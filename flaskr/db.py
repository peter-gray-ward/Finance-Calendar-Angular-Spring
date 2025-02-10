import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from flask import g, current_app
import os
import json

# Load database credentials from `.env.json`
with open(os.path.join(os.path.dirname(__file__), '.env.json'), 'r') as env_file:
    env = json.load(env_file)

# Create a global database connection pool
connection_pool = SimpleConnectionPool(
    1, 20,  # Min & max connections
    host=env['host'],
    database=env['database'],
    user=env['user'],
    password=env['password']
)


def init_db(app):
    """Register `close_db()` so connections are returned to the pool at the end of each request."""
    app.teardown_appcontext(close_db)  # ✅ Flask will call this automatically


def get_db(which):
    """Retrieve a database connection from the pool."""
    print('--> get_db(' + which + ')')
    
    if 'db' not in g:
        g.db = connection_pool.getconn()

    return g.db  # Return the connection object


def get_cursor(which):
    """Retrieve a cursor with RealDictCursor for easy result handling."""
    db = get_db(which)
    return db.cursor(cursor_factory=RealDictCursor)  # Explicit cursor creation


def close_db(error=None):
    """Return the database connection to the pool instead of closing it."""
    db = g.pop("db", None)
    if db is not None:
        try:
            connection_pool.putconn(db, close=False)  # ✅ Return connection to pool without closing
        except Exception as e:
            print(f"❌ Error returning connection to pool: {e}")
