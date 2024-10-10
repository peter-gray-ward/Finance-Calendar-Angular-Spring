from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
)
import json
import calendar
from werkzeug.exceptions import abort
from datetime import datetime
from flaskr.auth import login_required
from flaskr.db import get_db
from . import enums

DOW = [
  'Monday','Tuesday',
  'Wednesday','Thursday','Friday',
  'Saturday', 'Sunday'
];

MONTHS = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December'
]

def PreviousMonth(year, month):
    if month == 1:
        year -= 1
        month = 12
    else:
        month -= 1
    return Month(year, month)

def NextMonth(year, month):
    if month == 12:
        year += 1
        month = 1
    else:
        month += 1
    return Month(year, month)


def Month(year, month):
    cal = calendar.Calendar()
    
    month_days = cal.monthdayscalendar(year, month)

    return [
        [
            {
                "date": date,
                "day": DOW[datetime(year, month, date).weekday()],
                "events": [],
                "year": year,
                "month": month
            }
            for week_index, date in enumerate(week) if date != 0  # Skip zeroes (invalid days)
        ]
        for week in month_days
    ]

def Months(weeks):
    months = []
    week = []
    first_sunday_found = False
    
    for i in range(len(weeks)):
        for day in weeks[i]:
            if not first_sunday_found and day['day'] == 'Sunday':
                first_sunday_found = True

            if first_sunday_found:
                week.append(day)

            if len(week) == 7: 
                months.append(week)
                week = []

    if week:
        months.append(week)
    
    return months

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

    current_month = data['account']['month']
    current_year = data['account']['year']

    three_months_weeks = PreviousMonth(current_year, current_month) + Month(current_year, current_month) + NextMonth(current_year, current_month)
    months = Months(three_months_weeks)
    today = datetime.now()
    today = today.replace(hour=0, minute=0, second=0, microsecond=0)
    events = []

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            '''
                SELECT *
                FROM "events"
                WHERE user_id = %s
                AND (
                    date >= DATE_TRUNC('month', DATE '%s-%s-01') - INTERVAL '1 month'  -- Previous month
                    AND date < DATE_TRUNC('month', DATE '%s-%s-01') + INTERVAL '2 months'  -- Next month
                )

            ''',
            (user_id, current_year, current_month, current_year, current_month)
        )
        events = cursor.fetchall()
    except Exception as e:
        print(e)



    for weeks in months:
        for day in weeks:
            day['today'] = datetime(day['year'], day['month'], day['date']) == today
            day['todayOrLater'] = datetime(day['year'], day['month'], day['date']) >= today
            total = 0
            for event in events:
                if datetime(day['year'], day['month'], day['date']) == event.date:
                    day.events.append(event)
                    total += event['total']
            day['total'] = total


    return render_template('calendar/index.html', data = data, datetime = datetime, months = months, today = today)

def load_user_info(user_id):
    sync_data = {
        'Page': { page.name: page.value for page in enums.Page },
        'Api': enums.Api,
        'frequency': enums.frequency,
        'MONTHS': MONTHS,
        'DOW': DOW
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

        now = datetime.now()

        sync_data['account'] = {
            'id': user_data['id'],
            'name': user_data['name'],
            'checking_balance': user_data['checking_balance'],
            'expenses': [real_dict_row_to_dict(expense) for expense in expenses],
            'debts': debts,
            'month': session.get('selected_month', now.month),
            'year': session.get('selected_year', now.year)
        }
    except Exception as e:
        print(f'{e}')
        return sync_data
    else:
        return sync_data

@bp.route('/set_session_info', methods=['POST'])
def set_session_info():
    # Assume the client sends the month value as part of the JSON request
    month = request.json.get('month')
    year = request.json.get('year')
    
    # Save the month in the session
    session['selected_month'] = month
    session['selected_year'] = year
    
    return jsonify({'message': 'Month saved successfully'}), 200

@bp.route('/sync')
@login_required
def sync():
    user_id = session.get('user_id')
    sync_data = load_user_info(user_id)
    return jsonify(sync_data)

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
        rendered_row = render_template('calendar/expense.html', expense = expense, data = { 'frequency': enums.frequency }, datetime = datetime)
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

@bp.route('/api/update-expense/<expense_id>', methods=('POST',))
@login_required
def update_expense(expense_id):
    user_id = session.get('user_id')
    error = None

    name = request.json.get('name')
    amount = request.json.get('amount')
    startdate = request.json.get('startdate')
    recurrenceenddate = request.json.get('recurrenceenddate')
    frequency = request.json.get('frequency')
    expense_id = request.json.get('expense_id')

    # Validation
    if len(name) > 255:
        return jsonify({'status': 'error', 'error': 'Name is required and should not exceed 255 characters.'}), 400

    # Validate the start date format (YYYY-MM-DD)
    try:
        startdate = datetime.strptime(startdate, '%Y-%m-%d')
    except ValueError:
        return jsonify({'status': 'error', 'error': 'Start date must be in the format YYYY-MM-DD.'}), 400

    # Validate the recurrence end date format (if provided)
    if recurrenceenddate:
        try:
            recurrenceenddate = datetime.strptime(recurrenceenddate, '%Y-%m-%d')
        except ValueError:
            return jsonify({'status': 'error', 'error': 'Recurrence end date must be in the format YYYY-MM-DD.'}), 400

    # Validate frequency (assume predefined options like 'daily', 'weekly', 'monthly')
    valid_frequencies = ['daily', 'weekly', 'bi-weekly', 'monthly', 'yearly']
    if frequency not in valid_frequencies:
        return jsonify({'status': 'error', 'error': f'Frequency must be one of {valid_frequencies}.'}), 400


    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            '''
            UPDATE "expense"
            SET name = %s, amount = %s, startdate = %s, recurrenceenddate = %s, frequency = %s
            WHERE id = %s
            AND user_id = %s
            ''',
            (name, amount, startdate, recurrenceenddate, frequency, expense_id, user_id,)
        )
        db.commit()
    except Exception as e:
        return jsonify({ 'status': 'error', 'error': f'Error updating expense: {e}' }), 500
    else:
        return jsonify({ 'status': 'success' }), 200


