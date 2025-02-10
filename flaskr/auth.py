import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, 
    request, session, url_for, jsonify, make_response
)
import jwt
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
from flaskr.db import get_db, close_db
import uuid

SECRET_KEY = "supersecretkey"
TOKEN_EXPIRY_MINUTES = 30

def as_dict(real_dict_row):
    """
    Transform a RealDictRow to a plain dictionary.

    Args:
        real_dict_row (RealDictRow): The RealDictRow to transform.

    Returns:
        dict: A plain dictionary representation of the RealDictRow.
    """
    if isinstance(real_dict_row, dict):
        return dict(real_dict_row)  # If it's already a dict, return it
    return {key: value for key, value in real_dict_row.items()}

api = Blueprint('auth', __name__, url_prefix='/auth')

def generate_jwt(user_id):
    expiration = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY_MINUTES)
    token = jwt.encode({"user_id": user_id, "exp": expiration}, SECRET_KEY, algorithm="HS256")
    return token

@api.route('/register', methods=['POST'])
def register():
    error = None
    cursor = None

    try:
        body = request.get_json()
        name = body['name']
        password = body['password']

        if not name:
            return jsonify({"status": "failure", "error": "Name is required."}), 400
        if not password:
            return jsonify({"status": "failure", "error": "Password is required."}), 400

        with get_db('register') as db:
            cursor = db.cursor()
            try:
                cursor.execute(
                    '''
                    INSERT INTO "user" (id, name, password) 
                    VALUES (%s, %s, %s)
                    ''',
                    (str(uuid.uuid4()), name, generate_password_hash(password))
                )
                db.commit()  # Explicit commit before closing
                return jsonify({"status": "success"}), 201

            except db.IntegrityError:
                db.rollback()  # Ensure rollback on failure
                return jsonify({"status": "failure", "error": f"User {name} is already registered."}), 409

            finally:
                cursor.close()

    except Exception as e:
        return jsonify({"status": "failure", "error": str(e)}), 500


@api.route('/login', methods=['POST'])
def login():
    print("Logging in...")
    try:
        body = request.get_json()
        name = body['name']
        password = body['password']

        print(f"Logging in... {name} : {password}")
        cursor = None

        with get_db('login') as db:
            try:
                cursor = db.cursor()
                cursor.execute(
                    '''
                    SELECT id, password
                    FROM "user" 
                    WHERE name = %s
                    ''', 
                    (name,)
                )
                user = cursor.fetchone()
                
                print('found user', user)

                if user:

                    if not check_password_hash(user[1], password):
                        return jsonify({"authenticated": False, "error": "Incorrect name or password"}), 401
                    
                    print('Generating JWT...')

                    # Generate JWT token
                    token = generate_jwt(user[0])

                    print(f"JWT for {name} : {token}")

                    # Create response with token stored in HTTP-only cookie
                    response = make_response(jsonify({"authenticated": True}))
                    response.set_cookie("auth_token", token, httponly=True, secure=False, samesite='Lax')

                    return response  # Return JSON response
                else:
                    return jsonify({"authenticated": False, "error": f"{name} not found."}), 404
            finally:
                if cursor:
                    cursor.close()

    except Exception as e:
        return jsonify({"authenticated": False, "error": str(e)}), 500


@api.route('/check-auth')
def check_auth():
    print('checking auth')
    token = request.cookies.get("auth_token")
    if not token:
        return jsonify({"authenticated": False}), 401  # Not authenticated

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({"authenticated": True, "user_id": payload["user_id"]}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"authenticated": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"authenticated": False, "error": "Invalid token"}), 401


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return jsonify({"error": "Unauthorized"}), 401  # Send JSON instead of redirect
        return view(**kwargs)
    return wrapped_view

@api.before_app_request
def load_logged_in_user():
    """Ensure database connection is properly released after checking user."""
    if request.path.startswith('/static/'):
        return

    token = request.cookies.get("auth_token")
    if not token:
        g.user = None
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")

        db = get_db('load_logged_in_user')  # ✅ Get DB connection
        cursor = db.cursor()

        try:
            cursor.execute(
                '''
                SELECT id, name FROM "user" WHERE id = %s
                ''', 
                (user_id,)
            )
            g.user = cursor.fetchone()
        finally:
            cursor.close() 
            close_db()
            
    except jwt.ExpiredSignatureError:
        g.user = None
    except jwt.InvalidTokenError:
        g.user = None





@api.route('/logout')
def logout():
    response = make_response(jsonify({"message": "Logged out"}))
    
    # Expire the cookie properly
    response.set_cookie("auth_token", "", 
                        httponly=True, 
                        secure=False, 
                        samesite="Lax", 
                        expires=0, 
                        max_age=0, 
                        path="/")  # Ensures the cookie is removed globally

    return response



