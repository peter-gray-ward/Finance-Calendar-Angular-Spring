from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify
)
import json
import calendar
import uuid
from werkzeug.exceptions import abort
from datetime import datetime, timedelta
from dateutil.relativedelta import *
from dateutil import parser
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

def fetch_all_as_dict(cursor):
    """
    Converts the cursor result into a list of dictionaries.

    Args:
        cursor: The database cursor containing the result set.

    Returns:
        list: A list of dictionaries where each row is represented as a dict.
    """
    # Get column names from the cursor description
    columns = [col[0] for col in cursor.description]
    
    # Fetch all rows and convert each row into a dictionary
    return [real_dict_row_to_dict(row) for row in cursor.fetchall()]

balance_map = {}
def calculate_totals(events, total):
    user_id = session.get('user_id')
    try:
        events = sorted(events, key=lambda e: e['date'])

        for event in events:
            event_date = event['date']
            recurrenceenddate = event['recurrenceenddate']
            if event_date > recurrenceenddate:
                event['recurrenceenddate'] = event['date']
            event['total'] = 0

        today = datetime.now().date()

        start = False
        for event in events:
            if event['balance'] != 0:
                if event['recurrenceid'] not in balance_map:
                    balance_map[event['recurrenceid']] = {
                        'balance': event['balance'],
                        'count': 0,
                        'months': None
                    }
                else:
                    event['balance'] = balance_map[event['recurrenceid']]['balance'] + event['amount']
                    balance_map[event['recurrenceid']]['count'] += 1
                    balance_map[event['recurrenceid']]['balance'] = event['balance']
                    if event['balance'] <= 0 and balance_map[event['recurrenceid']]['months'] == None:
                        balance_map[event['recurrenceid']]['month'] = balance_map[event['recurrenceid']]['count']
                        balance_map[event['recurrenceid']]['balanceEndDate'] = event['date']
                        events = [
                            {
                                **e,
                                'months': balance_map[e['recurrenceid']]['months'],
                                'balanceEndDate': balance_map[e['recurrenceid']]['balanceEndDate']
                            } if e['recurrenceid'] in balance_map else e
                            for e in events
                        ]
            if event['date'] >= today:
                start = True
                print('Starting total calculation')
            if start == True:
                if event['exclude'] == '0':
                    total += event['amount']
                event['total'] = total
        balance_map = {}
        return events
    except Exception as e:
        errormessage = f'Error calculating totals {e}'
        print(errormessage)
        return jsonify({ 'status': 'error', message: errormessage }), 500


bp = Blueprint('calendar', __name__)

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
        with get_db() as db:
            cursor = db.cursor()

            cursor.execute(
                'SELECT id, name, checking_balance'
                ' FROM "user"'
                ' WHERE id = %s',
                (user_id,)
            )
            user_data = cursor.fetchone()

            cursor.execute(
                '''
                SELECT * FROM public.expense
                WHERE user_id = %s
                ''',
                (user_id,)
            )
            expenses = fetch_all_as_dict(cursor)

            cursor.execute(
                'SELECT * FROM "debt"'
                ' WHERE user_id = %s',
                (user_id,)
            )
            debts = fetch_all_as_dict(cursor)

            now = datetime.now().date()

            sync_data['account'] = {
                'id': user_data['id'],
                'name': user_data['name'],
                'checking_balance': user_data['checking_balance'],
                'expenses': [real_dict_row_to_dict(expense) for expense in expenses],
                'debts': debts,
                'month': session.get('selected_month', now.month),
                'year': session.get('selected_year', now.year)
            }

            cursor.close()
    except Exception as e:
        print(f'{e}')
        return sync_data
    else:
        return sync_data

def RenderApp():
    user_id = session.get('user_id')
    data = load_user_info(user_id)

    current_month = data['account']['month']
    current_year = data['account']['year']

    three_months_weeks = PreviousMonth(current_year, current_month) + Month(current_year, current_month) + NextMonth(current_year, current_month)
    months = Months(three_months_weeks)
    today = datetime.now()
    today = today.replace(hour=0, minute=0, second=0, microsecond=0)
    events = []

    print('... selecting events')

    try:
        with get_db() as db:
            print('... connected to db')
            cursor = db.cursor()
            cursor.execute(
                '''
                    SELECT *
                    FROM "event"
                    WHERE user_id = %s
                    AND (
                        date >= DATE_TRUNC('month', DATE '%s-%s-01') - INTERVAL '1 month'  -- Previous month
                        AND date < DATE_TRUNC('month', DATE '%s-%s-01') + INTERVAL '2 months'  -- Next month
                    )
                ''',
                (user_id, current_year, current_month, current_year, current_month)
            )

            print('... executed sql and about to fetch')

            events = fetch_all_as_dict(cursor)

            try:
                print('Calculating totals...')
                events = calculate_totals(events, data['account']['checking_balance'])
            except Exception as e:
                return f'Exception calculating totals {e}', 500


            print('... fetched events')

            for weeks in months:
                for day in weeks:
                    day['today'] = datetime(day['year'], day['month'], day['date']) == today
                    day['todayOrLater'] = datetime(day['year'], day['month'], day['date']) >= today
                    total = 0
                    for event in events:
                        if day['year'] == event['date'].year and day['month'] == event['date'].month and day['date'] == event['date'].day:
                            day['events'].append(event)
                            total += event['total']
                    day['total'] = total

            print('... about to close cursor')

            cursor.close()

    except Exception as e:
        print(f'Exception selecting events {e}')


    html = render_template('app/index.html', data = data, datetime = datetime, months = months, today = today)

    return html 

def RenderCalendar():
    user_id = session.get('user_id')
    data = load_user_info(user_id)

    current_month = data['account']['month']
    current_year = data['account']['year']

    three_months_weeks = PreviousMonth(current_year, current_month) + Month(current_year, current_month) + NextMonth(current_year, current_month)
    months = Months(three_months_weeks)
    today = datetime.now()
    today = today.replace(hour=0, minute=0, second=0, microsecond=0)
    events = []
    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            '''
                SELECT *
                FROM "event"
                WHERE user_id = %s
                AND (
                    date >= DATE_TRUNC('month', DATE '%s-%s-01') - INTERVAL '1 month'  -- Previous month
                    AND date < DATE_TRUNC('month', DATE '%s-%s-01') + INTERVAL '2 months'  -- Next month
                )

            ''',
            (user_id, current_year, current_month, current_year, current_month)
        )
        events = fetch_all_as_dict(cursor)

        for weeks in months:
            for day in weeks:
                day['today'] = datetime(day['year'], day['month'], day['date']) == today
                day['todayOrLater'] = datetime(day['year'], day['month'], day['date']) >= today
                total = 0
                for event in events:
                    if day['year'] == event['date'].year and day['month'] == event['date'].month and day['date'] == event['date'].day:
                        day['events'].append(event)
                        total += event['total']
                day['total'] = total

    except Exception as e:
        print(e)

    try:
        print('Calculating totals')
        events = calculate_totals(events)
    except Exception as e:
        print(f'Error calculating totals: {e}')
        return f'{e}', 500

    html = render_template('app/calendar.html', data = data, datetime = datetime, months = months, today = today)

    if cursor:
        cursor.close()
    if db:
        db.close()

    return html

@bp.route('/')
@login_required
def index():
    return RenderApp()

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

    db = None
    cursor = None

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
        rendered_row = render_template('app/expense.html', expense = expense, data = { 'frequency': enums.frequency }, datetime = datetime)
        return jsonify({ 'status': 'success', 'html': rendered_row }), 201
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

@bp.route('/api/delete-expense/<expense_id>', methods=('DELETE',))
@login_required
def delete_expense(expense_id):
    user_id = session.get('user_id')
    error = None
    data = {}

    db = None
    cursor = None

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
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

@bp.route('/api/update-expense/<expense_id>', methods=('POST',))
@login_required
def update_expense(expense_id):
    user_id = session.get('user_id')
    error = None

    if request.is_json == False:
        return jsonify({'status': 'error', 'error': f'Bad request Content-Type'}), 400

    body = json.loads(request.get_json())

    name = body['name']
    amount = body['amount']
    startdate = body['startdate']
    recurrenceenddate = body['recurrenceenddate']
    frequency = body['frequency']
    expense_id = body['expense_id']

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


    db = None
    cursor = None

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
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


def id():
    # Generate a unique identifier (similar to id() in JS)
    return str(uuid.uuid4())

def CreateEvent(data, user_id, event=None):
    return {
        'id': id(),
        'recurrenceid': event['recurrenceid'] if event and 'recurrenceid' in event else id(),
        'summary': event['summary'] if event and 'summary' in event else (data['summary'] if data and 'summary' in data else '-'),
        
        # Format the date using Python's datetime
        'date': datetime(data['year'], data['month'], data['date']).strftime('%Y-%m-%d'),
        
        'recurrenceenddate': event['recurrenceenddate'] if event and 'recurrenceenddate' in event else datetime(data['year'], data['month'], data['date']).strftime('%Y-%m-%d'),
        'amount': event['amount'] if event and 'amount' in event else (data['amount'] if data and 'amount' in data else 0),
        'frequency': event['frequency'] if event and 'frequency' in event else 'Monthly',
        'total': 0,
        'balance': event['balance'] if event and 'balance' in event else 0,
        'exclude': '1' if event and 'exclude' in event else '0',
        'user_id': user_id
    }

def CreateEventFromExpense(data, user_id, expense=None):
    return {
        'id': id(),
        'recurrenceid': expense['recurrenceid'] if expense and 'recurrenceid' in expense else id(),
        'summary': expense['name'] if expense and 'name' in expense else (data['name'] if data and 'name' in data else '-'),
        
        # Format the date using Python's datetime
        'date': datetime(data['year'], data['month'], data['date']).strftime('%Y-%m-%d'),
        
        'recurrenceenddate': expense['recurrenceenddate'] if expense and 'recurrenceenddate' in expense else datetime(data['year'], data['month'], data['date']).strftime('%Y-%m-%d'),
        'amount': expense['amount'] if expense and 'amount' in expense else (data['amount'] if data and 'amount' in data else 0),
        'frequency': expense['frequency'] if expense and 'frequency' in expense else 'Monthly',
        'total': 0,
        'balance': expense['balance'] if expense and 'balance' in expense else 0,
        'exclude': '1' if expense and 'exclude' in expense else '0',
        'user_id': user_id
    }

@bp.route('/api/refresh-calendar', methods=('POST',))
@login_required
def refresh_calendar():
    user_id = session.get('user_id')

    print(f'Refreshing calendar for user {user_id}')

    res = {}
    code = 200

    db = None
    cursor = None

    try:
        expenses = []
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            '''
                SELECT *
                FROM "expense"
                WHERE user_id = %s
            ''',
            (user_id,)
        )
        expenses = fetch_all_as_dict(cursor)

        print(f'Found {len(expenses)} expenses to recur')

        today = datetime.now()
        events = []
        total = 0
        for expense in expenses:
            frequency = expense['frequency'].lower()
            start = expense['startdate']
            end = expense['recurrenceenddate']

            print(f'Starting recurrence of expense {expense['name']} at {start} until {end}')
            
            while start <= end:
                options = {
                    'year': start.year,
                    'month': start.month,
                    'date': start.day
                }

                event = CreateEventFromExpense(options, user_id, expense)

                events.append(event)

                if frequency == 'daily':
                    start += timedelta(days=1)  # Add one day
                    
                elif frequency == 'weekly':
                    start += timedelta(weeks=1)  # Add one week
                    
                elif frequency == 'biweekly':
                    start += timedelta(weeks=2)  # Add two weeks
                    
                elif frequency == 'monthly':
                    start += relativedelta(months=1)  # Add one month
                    
                elif frequency == 'yearly':
                    start += relativedelta(years=1)  # Add one year

                else:
                    return jsonify({ 'status': 'error', 'message': f'Bad frequency {frequency}' }), 400

                print(f'Start has moved to {start}')

        print(f'Created events per expenses and now deleting previous events')

        cursor.execute(
            '''
            DELETE 
            FROM "event" 
            WHERE user_id = %s;
            ''',
            (user_id,)
        )

        print(f'Inserting {len(events)} events')

        cursor.executemany(
            '''
            INSERT INTO "event"
            (id, recurrenceid, summary, date, recurrenceenddate, amount, total, balance, exclude, frequency, user_id)
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            [
                (
                    event['id'],
                    event['recurrenceid'],
                    event['summary'],
                    event['date'],
                    event['recurrenceenddate'],  # Make sure this column name is correct (recurrenceenddate or recurrenceenddate)
                    event['amount'],
                    event['total'],
                    event['balance'],
                    event['exclude'],
                    event['frequency'],
                    event['user_id']
                )
                for event in events  # Convert each event dict to a tuple
            ]
        )
        db.commit()
    except Exception as e:
        res['status'] = 'error'
        print(e)
        code = 500
        return jsonify(res), code
    else:
        html = RenderCalendar()
        return jsonify({ 'status': 'success', 'html': html })



