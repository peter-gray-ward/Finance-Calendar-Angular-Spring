from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
)
from werkzeug.exceptions import abort

from flaskr.auth import login_required
from flaskr.db import get_db
from . import enums

def real_dict_row_to_dict(real_dict_row):
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


bp = Blueprint('calendar', __name__)

@bp.route('/')
@login_required
def index():
    user_id = session.get('user_id')
    data = load_user_info(user_id)

    return render_template('calendar/index.html', data=data)

def load_user_info(user_id):
    sync_data = {
        'Page': { page.name: page.value for page in enums.Page },
        'Api': enums.Api,
        'frequency': enums.frequency
    }
    error = None
    user_data = {}
    expenses = []
    debts = []
    frequencies = []

    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            'SELECT id, name, checking_balance'
            ' FROM "user"'
            ' WHERE id = %s',
            (user_id,)
        )
        user_data = cursor.fetchone()

        print(f'selecting from expense {user_id}')

        cursor.execute(
            '''
            SELECT * FROM public.expense
            WHERE user_id = %s
            ''',
            (user_id,)
        )
        expenses = cursor.fetchall()

        cursor.execute(
            'SELECT * FROM "debt"'
            ' WHERE user_id = %s',
            (user_id,)
        )
        debts = cursor.fetchall()

        print([real_dict_row_to_dict(expense) for expense in expenses])

        sync_data['account'] = {
            'id': user_data['id'],
            'name': user_data['name'],
            'checking_balance': user_data['checking_balance'],
            'expenses': [real_dict_row_to_dict(expense) for expense in expenses],
            'debts': debts,
        }
    except Exception as e:
        print(f'{e}')
        return sync_data
    else:
        return sync_data

@bp.route('/sync')
@login_required
def sync():
    user_id = session.get('user_id')
    sync_data = load_user_info(user_id)
    return jsonify(sync_data)


@bp.route('/render', methods=('POST',))
@login_required
def render():
    form = request.get_json()
    page = form['page']
    error = None

@bp.route('/api/add-expense', methods=('POST',))
@login_required
def add_expense():
    user_id = session.get('user_id')
    error = None
    inserted_row = {}

    print(f'... ADDING EXPENSE FOR {user_id}')

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            '''
            INSERT INTO "expense"
            (id, name, frequency, amount, startdate, recurrenceenddate, user_id)
             VALUES (uuid_generate_v1(), %s, %s, 0, NULL, NULL, %s)
             RETURNING *;
            ''',
            ('-', enums.Frequency.MONTHLY.value, user_id,)
        )
        inserted_row = cursor.fetchone()
        db.commit()
    except Exception as e:
        return jsonify({ 'status': 'error', 'error': f'Error adding expense: {e}' }), 500
    else:
        expense = real_dict_row_to_dict(inserted_row)
        print(f'making a row for expense {expense}')
        rendered_row = render_template('calendar/expense.html', expense = expense, data = { 'frequency': enums.frequency })
        return jsonify({ 'status': 'success', 'html': rendered_row }), 201

@bp.route('/api/delete-expense/<expense_id>', methods=('DELETE',))
@login_required
def delete_expense(expense_id):
    user_id = session.get('user_id')
    error = None
    data = {}
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'DELETE FROM "expense" '
            'WHERE user_id = %s AND id = %s',
            (user_id,expense_id,)
        )
        db.commit()
    except Exception as e:
        return jsonify({ 'status': 'error', 'error': f'Error deleting expense: {e}' }), 500
    else:
        return jsonify({ 'status': 'success' }), 200


