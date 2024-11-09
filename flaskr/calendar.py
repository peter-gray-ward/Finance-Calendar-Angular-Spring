from flask import (
    Blueprint, 
    g, 
    redirect, 
    render_template, 
    request, url_for, 
    session, 
    jsonify, 
    flash,
    json,
    current_app
)
import os
import calendar
import uuid
import re
from werkzeug.exceptions import abort
from datetime import datetime, timedelta, date
from dateutil.relativedelta import *
from dateutil import parser
from flaskr.auth import login_required
from flaskr.db import get_db
from . import enums
import pprint
import uuid
import urllib.request
import xml.etree.ElementTree as ET

date_pattern = re.compile(r"(date|updated)", re.IGNORECASE)

cache = {}

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
FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'yearly']

def debug_filter(event):
    event_date = event['date']
    target_date = datetime(2024, 10, 16).date()

    if isinstance(event_date, (datetime, date)):
        return event_date == target_date
    else:
        print(f'isinstance(event_date, (datetime, date)): {isinstance(event_date, (datetime, date))}')
        return False
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
def fetchall_as_dict(cursor):
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
    return [as_dict(row) for row in cursor.fetchall()]
def calculate_totals(events, checking_balance):
    user_id = session.get('user_id')
    if not user_id in cache:
        cache[user_id] = { 'balance_map': {} }
    try:
        events = sorted(events, key = lambda e: e['date'])

        for event in events:
            event_date = event['date']
            recurrenceenddate = event['recurrenceenddate']
            # event date preferenced above recurrencend date
            # so we always ensure start before end
            if event_date > recurrenceenddate:
                event['recurrenceenddate'] = event['date']
            event['total'] = 0

        today = datetime.now().date()
        twodaysfromnow = today + timedelta(days=2)

        start = False
        for event in events:
            if event['balance'] != 0:
                if event['recurrenceid'] not in cache[user_id]['balance_map']:
                    cache[user_id]['balance_map'][event['recurrenceid']] = event['balance']
                else:
                    event['balance'] = cache[user_id]['balance_map'][event['recurrenceid']] + event['amount']
                    cache[user_id]['balance_map'][event['recurrenceid']]['count'] += 1
                    cache[user_id]['balance_map'][event['recurrenceid']] = event
                    if event['balance'] <= 0 and cache[user_id]['balance_map'][event['recurrenceid']]['months'] == None:
                        cache[user_id]['balance_map'][event['recurrenceid']]['month'] = cache[user_id]['balance_map'][event['recurrenceid']]['count']
                        cache[user_id]['balance_map'][event['recurrenceid']]['balanceEndDate'] = event['date']
                        events = [
                            {
                                **e,
                                'months': cache[user_id]['balance_map'][e['recurrenceid']]['months'],
                                'balanceEndDate': cache[user_id]['balance_map'][e['recurrenceid']]['balanceEndDate']
                            } if e['recurrenceid'] in cache[user_id]['balance_map'] else e
                            for e in events
                        ]
            if event['date'] >= today:
                start = True
            if start == True:
                if event['exclude'] == '0':
                    checking_balance += event['amount']
                event['total'] = checking_balance
        return events
    except Exception as e:
        errormessage = f'Error calculating totals {e}'
        return jsonify({ 'status': 'error', 'message': errormessage }), 500
    finally:
        cache[user_id]['balance_map'] = {}
def load_user_info(db, user_id):
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
        expenses = fetchall_as_dict(cursor)

        cursor.execute(
            'SELECT * FROM "debt"'
            ' WHERE user_id = %s',
            (user_id,)
        )
        debts = fetchall_as_dict(cursor)

        now = datetime.now().date()

        sync_data['account'] = {
            'id': user_data['id'],
            'name': user_data['name'],
            'checking_balance': user_data['checking_balance'],
            'expenses': [as_dict(expense) for expense in expenses],
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
def select_events(db, data, user_id):
    current_month = data['account']['month']
    current_year = data['account']['year']
     
    try:
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

        events = fetchall_as_dict(cursor)
        print(f'fetched {len(events)} events')

        cursor.close()

        try:
            events = calculate_totals(events, data['account']['checking_balance'])
        except Exception as e:
            print(e)
            return f'Exception calculating totals {e}', 500

        print(f'calculated totals for {len(events)} events')

        return events
    except Exception as e:
        print(f'Exception selecting events {e}')
def build_months(data, events):
    current_month = data['account']['month']
    current_year = data['account']['year']
    today = datetime.now().date()
    
    three_months_weeks = PreviousMonth(current_year, current_month) + Month(current_year, current_month) + NextMonth(current_year, current_month)
    months = Months(three_months_weeks)
    vv = False
    for weeks in months:
        for day in weeks:
            thisday = datetime(day['year'], day['month'], day['date']).date()
            day['today'] = thisday == today
            day['todayOrLater'] = thisday >= today
            total = 0
            for event in events:
                if day['year'] == event['date'].year and day['month'] == event['date'].month and day['date'] == event['date'].day:
                    day['events'].append(event)
                    day['total'] = event['total']



    return (months, events)
def RenderApp(db = None, just_calendar = False):
    user_id = session.get('user_id')
    try:
        if db != None:
            data = load_user_info(db, user_id)
            events = select_events(db, data, user_id)
            (months, events) = build_months(data, events)

            html = render_template(
                'app/calendar.html' if just_calendar else 'app/index.html', 
                data = data, 
                datetime = datetime, 
                months = months, 
                today = datetime.now().date(), 
                FREQUENCIES = FREQUENCIES
            )

            return html
        else:
            with get_db() as db:
                data = load_user_info(db, user_id)
                events = select_events(db, data, user_id)
                (months, events) = build_months(data, events)


                html = render_template(
                    'app/calendar.html' if just_calendar else 'app/index.html',
                    data = data,
                    datetime = datetime,
                    months = months,
                    today = datetime.now().date(),
                    FREQUENCIES = FREQUENCIES
                )

                print(5)

                return html
    except Exception as e:
        return f'<div style="padding: 1rem; width: 50vw; height: 50vh; background: blue; color: white; font-family: Menlo;">500: {e}</div>'
def id():
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
def CreateEventFromExpense(recurrenceid, data, user_id, expense=None):
    return {
        'id': id(),
        'recurrenceid': recurrenceid,
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
def save_event(db, event_id, request):
    user_id = session.get('user_id')
    try:
        event = request.get_json()
        event.pop('id', None)
        cursor = db.cursor()

        previous_fields = {}
        cursor.execute(
            '''
                SELECT *
                FROM "event"
                WHERE id = %s
            ''',
            (event_id,)
        )

        previous_fields = fetchall_as_dict(cursor)[0]

        for field_name in event.keys():
            cursor.execute(
                '''
                    INSERT INTO "event_field_lock"
                    (id, user_id, event_id, field_name)
                    SELECT %s, %s, %s, %s
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM "event_field_lock"
                        WHERE event_id = %s AND field_name = %s
                    )
                ''',
                (
                    str(uuid.uuid1()),
                    user_id, 
                    event_id, 
                    field_name, 
                    event_id, 
                    field_name
                )
            )


        sqlquery = '''UPDATE "event" SET '''
        sqlquery += ', '.join([f'{key} = %({key})s' for key in event.keys()])
        sqlquery += '''
            WHERE id = %(id)s
            AND user_id = %(user_id)s
        '''

        cursor.execute(sqlquery, {**event, 'id': event_id, 'user_id': user_id})

        db.commit()
        cursor.close()

        data = load_user_info(db, user_id)
        events = select_events(db, data, user_id)

        

        return calculate_totals(events, data['account']['checking_balance'])
    except Exception as e:
        print(e)
        return  []



def CalculatePaymentPlans(db, user_id, debt_id):
    try:
        cursor = db.cursor()
        cursor.execute(
            '''
            WITH debt_info AS (
                -- Assuming we know the debt balance and interest rate for each debt
                SELECT
                    d.creditor,
                    d.id,  -- Assuming a primary key for debt
                    d.balance,
                    d.interest,  -- The annual interest rate, included directly
                    d.interest / 12.0 AS monthly_interest_rate,  -- Convert annual interest to monthly
                    NOW() AS start_date  -- Use NOW() to get the current date
                FROM
                    debt d
                WHERE d.user_id = %s
                AND d.id = %s
            ),
            payment_plan AS (
                -- Step 1: Calculate payment amounts for three different plans (long-term, mid-range, short-term) and three frequencies (weekly, bi-weekly, monthly)
                SELECT
                    id,
                    creditor,
                    'long-term' AS plan_type,
                    'weekly' AS frequency,
                    120 AS term_in_months,  -- Long-term plan: 10 years (120 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 120)) /
                    (POWER(1 + monthly_interest_rate, 120) - 1)) / 4.33 AS payment_amount  -- Weekly payments (approx. 4.33 weeks per month)
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'long-term' AS plan_type,
                    'bi-weekly' AS frequency,
                    120 AS term_in_months,  -- Long-term plan: 10 years (120 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 120)) /
                    (POWER(1 + monthly_interest_rate, 120) - 1)) / 2 AS payment_amount  -- Bi-weekly payments (2 payments per month)
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'long-term' AS plan_type,
                    'monthly' AS frequency,
                    120 AS term_in_months,  -- Long-term plan: 10 years (120 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 120)) /
                    (POWER(1 + monthly_interest_rate, 120) - 1)) AS payment_amount  -- Monthly payments
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'mid-range' AS plan_type,
                    'weekly' AS frequency,
                    60 AS term_in_months,  -- Mid-range plan: 5 years (60 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 60)) /
                    (POWER(1 + monthly_interest_rate, 60) - 1)) / 4.33 AS payment_amount  -- Weekly payments
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'mid-range' AS plan_type,
                    'bi-weekly' AS frequency,
                    60 AS term_in_months,  -- Mid-range plan: 5 years (60 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 60)) /
                    (POWER(1 + monthly_interest_rate, 60) - 1)) / 2 AS payment_amount  -- Bi-weekly payments
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'mid-range' AS plan_type,
                    'monthly' AS frequency,
                    60 AS term_in_months,  -- Mid-range plan: 5 years (60 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 60)) /
                    (POWER(1 + monthly_interest_rate, 60) - 1)) AS payment_amount  -- Monthly payments
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'short-term' AS plan_type,
                    'weekly' AS frequency,
                    24 AS term_in_months,  -- Short-term plan: 2 years (24 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 24)) /
                    (POWER(1 + monthly_interest_rate, 24) - 1)) / 4.33 AS payment_amount  -- Weekly payments
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'short-term' AS plan_type,
                    'bi-weekly' AS frequency,
                    24 AS term_in_months,  -- Short-term plan: 2 years (24 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 24)) /
                    (POWER(1 + monthly_interest_rate, 24) - 1)) / 2 AS payment_amount  -- Bi-weekly payments
                FROM debt_info
                UNION ALL
                SELECT
                    id,
                    creditor,
                    'short-term' AS plan_type,
                    'monthly' AS frequency,
                    24 AS term_in_months,  -- Short-term plan: 2 years (24 months)
                    (balance * (monthly_interest_rate * POWER(1 + monthly_interest_rate, 24)) /
                    (POWER(1 + monthly_interest_rate, 24) - 1)) AS payment_amount  -- Monthly payments
                FROM debt_info
            ),
            payment_schedule AS (
                -- Step 2: Simulate payment schedule and calculate remaining balance for each plan and frequency
                SELECT
                    pp.id,
                    d.creditor,
                    pp.plan_type,
                    pp.frequency,
                    pp.term_in_months,
                    pp.payment_amount,
                    CASE
                        WHEN pp.frequency = 'weekly' THEN d.start_date + (interval '1 week' * gs)
                        WHEN pp.frequency = 'bi-weekly' THEN d.start_date + (interval '2 weeks' * gs)
                        ELSE d.start_date + (interval '1 month' * gs)
                    END AS payment_date,  -- Adjust based on payment frequency
                    d.balance * (1 + d.interest) - SUM(pp.payment_amount) OVER (PARTITION BY pp.id, pp.plan_type, pp.frequency ORDER BY gs) AS remaining_balance
                FROM
                    payment_plan pp
                JOIN
                    debt_info d
                ON
                    pp.id = d.id
                CROSS JOIN
                    generate_series(1, pp.term_in_months * CASE
                        WHEN pp.frequency = 'weekly' THEN 4.33  -- Approximate weeks per month
                        WHEN pp.frequency = 'bi-weekly' THEN 2  -- Bi-weekly: 2 payments per month
                        ELSE 1  -- Monthly
                    END) gs  -- Simulate payments based on frequency
            ),
            payoff_schedule AS (
                -- Step 3: Find the payoff date for each plan and frequency when remaining balance becomes <= 0
                SELECT
                    id,
                    plan_type,
                    frequency,
                    MIN(payment_date) AS recurrenceenddate
                FROM
                    payment_schedule
                WHERE
                    remaining_balance <= 0
                GROUP BY
                    id, plan_type, frequency
            )
            -- Final Step: Select the debt, plan, frequency, calculated payment amount, and payoff date for each plan
            SELECT
                pp.creditor,
                d.balance,
                pp.plan_type,
                pp.frequency,
                pp.payment_amount,
                to_char(ps.recurrenceenddate, 'yyyy-MM-dd') as recurrenceenddate
            FROM
                payment_plan pp
            
            JOIN debt_info d on 1 = 1
            JOIN
                payoff_schedule ps
            ON
                pp.id = ps.id AND pp.plan_type = ps.plan_type AND pp.frequency = ps.frequency;

            ''',
            (user_id,debt_id,)
        )
        db.commit()
        plan = fetchall_as_dict(cursor)
        return plan
    except Exception as e:
        print(e)
        return None



api = Blueprint('calendar', __name__)

@api.route('/')
@login_required
def index():
    return RenderApp()

@api.route('/set_session_info', methods=['POST'])
def set_session_info():
    # Assume the client sends the month value as part of the JSON request
    month = request.json.get('month')
    year = request.json.get('year')
    
    # Save the month in the session
    session['selected_month'] = month
    session['selected_year'] = year
    
    return jsonify({'message': 'Month saved successfully'}), 200

@api.route('/sync')
@login_required
def sync():
    user_id = session.get('user_id')
    try:
        with get_db() as db:
            sync_data = load_user_info(db, user_id)
            return jsonify(sync_data)
    except Exception as e:
        return f'500: {e}'

@api.route('/api/add-expense', methods=('POST',))
@login_required
def add_expense():
    user_id = session.get('user_id')
    error = None
    inserted_row = {}

    cursor = None

    try:
        
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                '''
                    INSERT INTO "expense"
                    (id, name, frequency, amount, startdate, recurrenceenddate, user_id)
                     VALUES (%s, %s, %s, 0, NULL, NULL, %s)
                     RETURNING *;
                ''',
                (str(uuid.uuid4()), '-', enums.Frequency.MONTHLY.value, user_id,)
            )
            inserted_row = cursor.fetchone()
            db.commit()
            cursor.close()
    except Exception as e:
        return jsonify({ 'status': 'error', 'error': f'Error adding expense: {e}' }), 500
    else:
        expense = as_dict(inserted_row)
        print(f'making a row for expense {expense}')
        rendered_row = render_template('app/expense.html', expense = expense, FREQUENCIES = FREQUENCIES, datetime = datetime)
        return jsonify({ 'status': 'success', 'html': rendered_row }), 201          

@api.route('/api/delete-expense/<expense_id>', methods=('DELETE',))
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

@api.route('/api/update-expense/<expense_id>', methods=('POST',))
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
    valid_frequencies = FREQUENCIES
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

@api.route('/api/add-debt', methods=('POST',))
@login_required
def add_debt():
    user_id = session.get('user_id')
    error = None
    inserted_row = {}

    cursor = None

    try:
        sql_payload = (str(uuid.uuid4()), '• creditor •', 0.0, 0.0, '• account number •', '• link •', user_id)
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                '''
                    INSERT INTO "debt"
                    (id, creditor, balance, interest, account_number, link, user_id, recurrenceid)
                     VALUES (%s, %s, %s, %s, %s, %s, %s, NULL)
                     RETURNING *;
                ''',
                sql_payload
            )
            inserted_row = cursor.fetchone()
            db.commit()
            cursor.close()
    except Exception as e:
        return jsonify({ 'status': 'error', 'error': f'Error adding expense: {e}' }), 500
    else:
        debt = as_dict(inserted_row)
        print(f'making a row for debt {debt}')
        rendered_row = render_template('app/debt.html', debt = debt)
        return jsonify({ 'status': 'success', 'html': rendered_row }), 201    

@api.route('/api/update-debt/<debt_id>', methods=('POST',))
@login_required
def update_debt(debt_id):
    user_id = session.get('user_id')
    try:
        body = json.loads(request.get_json())
        creditor = body['creditor']
        balance = body['balance']
        interest = body['interest']
        account_number = body['account_number']
        recurrenceid = None
        if 'recurrenceid' in body:
            recurrenceid = uuid.UUID(body['recurrenceid'])
        debt_id = body['id']
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                '''
                UPDATE "debt"
                SET creditor = %s, balance = %s, interest = %s,
                    account_number = %s, recurrenceid = %s
                WHERE id = %s
                ''',
                (creditor, balance, interest, account_number, recurrenceid, debt_id)
            )
            db.commit()
            cursor.close()
            return jsonify({ 'status': 'success' })
    except Exception as e:
        print(e)
        return jsonify({ 'status': 'error', 'message': f'{e}' })

@api.route('/api/delete-debt/<debt_id>', methods=('DELETE',))
@login_required
def delete_debt(debt_id):
    user_id = session.get('user_id')
    error = None
    data = {}

    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'DELETE FROM "debt" '
            'WHERE user_id = %s AND id = %s',
            (user_id,debt_id,)
        )
        db.commit()
    except Exception as e:
        return jsonify({ 'status': 'error', 'error': f'Error deleting debt: {e}' }), 500
    else:
        return jsonify({ 'status': 'success' }), 200
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

@api.route('/api/update-month-year', methods=('POST',))
@login_required
def update_account():
    user_id = session.get('user_id')
    body = request.get_json()
    print(user_id, body)
    try:
        if 'selected_month' not in session:
            now = datetime.now().date()
            session['selected_month'] = now.month
            session['selected_year'] = now.year


        month = int(session['selected_month'])
        year = int(session['selected_year'])

        which = body['which']

        print(which, month, year)

        if which == 'prev':
            if month == 1:
                month = 12
                year -= 1
            else:
                month -= 1
        elif which == 'next':
            if month == 12:
                month = 1
                year += 1
            else:
                month += 1
        else:
            now = datetime.now().date()
            month = now.month
            year = now.year

        
        session['selected_month'] = month
        session['selected_year'] = year

        print(session)
    except Exception as e:
        return jsonify({ 'status': f'error {e}' })
    else:
        html = RenderApp(None, True)
        return jsonify({ 'status': 'success', 'html': html, 'month': MONTHS[month - 1], 'year': year })

@api.route('/api/get-event/<event_id>', methods=('GET',))
@login_required
def get_event(event_id):
    user_id = session.get('user_id')
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute(
            '''
                SELECT *
                FROM "event"
                WHERE id = %s
            ''',
            (event_id,)
        )
        event = cursor.fetchone()
        html = render_template('app/event.html', event = event, datetime = datetime, FREQUENCIES = FREQUENCIES)
        return jsonify({
            'status': 'success',
            'event': event,
            'html': html
        })

@api.route('/api/create-event', methods=('POST',))
@login_required
def create_event():
    user_id = session.get('user_id')
    event_date = request.get_json()['date']
    with get_db() as db:
        data = load_user_info(db, user_id)
        event = CreateEvent(data, user_id)
        try:
            cursor = db.cursor()
            cursor.execute(
                '''
                    INSERT INTO "event"
                    ({', '.join(event.keys())})
                    VALUES
                    ({
                        ''.join(
                            [
                                '%s' + ',' if i < len(event.keys()) - 1 else '%s' 
                                for i, key in enumerate(event.keys())
                            ]
                        )
                    })
                ''',
                event.values()
            )
            db.commit()
            cursor.close()

            html = RenderApp(db, True)

            return jsonify({ 'status': 'success', 'html': html })
        except Exception as e:
            return jsonify({ 'status': 'error', 'message': f'{e}'})


@api.route('/api/save-this-event/<event_id>', methods=('PUT',))
@login_required
def save_this_event(event_id):
    with get_db() as db:

        if len(save_event(db, event_id, request)):
            html = RenderApp(db, True)

            return jsonify({
                'status': 'success',
                'html': html
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Didn\'t save this event {event_id}'
            })

@api.route('/api/save-this-and-future-events/<event_id>', methods=('PUT',))
@login_required
def save_tafe(event_id):
    user_id = session.get('user_id')
    with get_db() as db:
        try:
            data = load_user_info(db, user_id)

            cursor = db.cursor()
            event = request.get_json()
            event_id = event.pop('id', None)

            events = save_event(db, event_id, request)
            if not len(events):
                return jsonify({ 'status': 'error', 'message': 'Error saving the event in the first place...'})


            sql = '''
                UPDATE "event" e
                SET
                    summary = CASE 
                                WHEN EXISTS (
                                    SELECT 1 FROM "event_field_lock" efl
                                    WHERE efl.event_id = e.id
                                    AND efl.field_name = 'summary'
                                ) THEN summary
                                ELSE %s
                              END,
                    amount = CASE 
                                WHEN EXISTS (
                                    SELECT 1 FROM "event_field_lock" efl
                                    WHERE efl.event_id = e.id
                                    AND efl.field_name = 'amount'
                                ) THEN amount
                                ELSE %s
                              END,
                    frequency = CASE 
                                  WHEN EXISTS (
                                      SELECT 1 FROM "event_field_lock" efl
                                      WHERE efl.event_id = e.id
                                      AND efl.field_name = 'frequency'
                                  ) THEN frequency
                                  ELSE %s
                                END
                WHERE
                    e.recurrenceid = %s
                AND
                    e.date > %s;

            '''


            cursor.execute( sql, 
                (
                    event['summary'], 
                    event['amount'], 
                    event['frequency'], 
                    event['recurrenceid'], 
                    event['date']
                )
            )

            events = select_events(db, data, user_id)

            calculate_totals(events, data['account']['checking_balance'])

            html = RenderApp(db, True)

            print('done')

            return jsonify({
                'status': 'success',
                'html': html
            })


        except Exception as e:
            print(e)
            return jsonify({ 'status': 'error' })

@api.route('/api/save-checking-balance/<float:checking_balance>', methods=('POST',))
@login_required
def save_checking_balance(checking_balance):
    user_id = session.get('user_id')
    with get_db() as db:
        try:
            cursor = db.cursor()
            cursor.execute(
                '''
                    UPDATE "user"
                    SET checking_balance = %s
                    WHERE id = %s
                ''',
                (checking_balance,user_id,)
            )
            db.commit()
            html = RenderApp(db, True)
            return jsonify({ 'status': 'success', 'html': html })
        except Exception as e:
            print(e)
            return jsonify({ 'status': 'error' })


@api.route('/api/clude-this-event/<event_id>', methods=('GET',))
def clude_event(event_id):
    try:
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                '''
                    UPDATE "event"
                    SET exclude = (exclude::int # 1)::bit
                    WHERE id = %s
                ''',
                (event_id,)
            )
            cursor.close()

            html = RenderApp(db, True)

            return jsonify({ 'status': 'success', 'html': html })
    except Exception as e:
        return jsonify({ 'status': 'error', 'message': f'{e}' })

@api.route('/api/clude-all-these-events/<event_recurrenceid>', methods=('GET',))
def clude_all_these_events(event_recurrenceid):
    try:
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                '''
                    UPDATE "event"
                    SET exclude = (exclude::int # 1)::bit
                    WHERE recurrenceid = %s
                ''',
                (event_recurrenceid,)
            )
            cursor.close()

            html = RenderApp(db, True)

            return jsonify({ 'status': 'success', 'html': html })
    except Exception as e:
        return jsonify({ 'status': 'error', 'message': f'{e}' })

@api.route('/api/delete-this-event/<event_id>', methods=('DELETE',))
@login_required
def delete_this_event(event_id):
    user_id = session.get('user_id')
    with get_db() as db:
        try:
            cursor = db.cursor()
            cursor.execute(
                '''
                DELETE FROM "event"
                WHERE id = %s
                ''',
                (event_id,)
            )
            db.commit()

            html = RenderApp(db, True)

            return jsonify({ 'status': 'success', 'html': html })
        except Exception as e:
            return jsonify({ 'status': 'error', message: f'{e}' })

@api.route('/api/delete-all-these-events/<recurrenceid>', methods=('DELETE',))
@login_required
def delete_all_these_events(recurrenceid):
    user_id = session.get('user_id')
    with get_db() as db:
        try:
            cursor = db.cursor()
            cursor.execute(
                '''
                DELETE FROM "event"
                WHERE recurrenceid = %s
                ''',
                (recurrenceid,)
            )
            db.commit()
            
            html = RenderApp(db, True)

            return jsonify({ 'status': 'success', 'html': html })
        except Exception as e:
            return jsonify({ 'status': 'error', message: f'{e}' })


@api.route('/api/create-payment-plan/<debt_id>', methods=('GET',))
@login_required
def create_payment_plan(debt_id):
    user_id = session.get('user_id')
    try:
        with get_db() as db:
            plan = CalculatePaymentPlans(db, user_id, debt_id)
            if plan is None:
                return jsonify({ 'error': f'Execption creating payment plan'})
            terms = {}
            for p in plan:
                if p['plan_type'] not in terms:
                    terms[p['plan_type']] = {}
                if p['frequency'] not in terms[p['plan_type']]:
                    terms[p['plan_type']][p['frequency']] = p
            print(terms)
            html = render_template('app/debt-payment-plan.html', plan = terms)
            return jsonify({ 'status': 'success', 'html': html })
    except Exception as e:
        return jsonify({ 'error': f'Execption creating payment plan {e}'})

XML_NAMESPACES = {
    'media': 'http://search.yahoo.com/mrss/',
    'atom': 'http://www.w3.org/2005/Atom',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'dc': 'http://purl.org/dc/elements/1.1/',
}

@api.route(f'/api/{enums.Page.DAILYNEWS.value}/<date_str>', methods=('GET',))
@login_required
def dailynews(date_str):
    # Split date string if you want to use date parts
    date_parts = date_str.split("-")
    
    # Load the RSS feed URLs from JSON
    with open(os.path.join(current_app.root_path, 'static', 'news-rss-feeds.json'), 'r') as nrf:
        rss_feeds = json.load(nrf)
    
    all_feeds_data = {}

    today = datetime.now()

    # Parse each RSS feed
    for feed in rss_feeds:
        feed_data = []
        try:
            with urllib.request.urlopen(feed['url']) as response:
                xml_data = response.read()
                
                # Parse XML and collect data
                root = ET.fromstring(xml_data)
                
                # Traverse through each item and collect all available data
                for item in root.findall(".//item"):  # Finds all item elements
                    item_data = {}
                    
                    for elem in item:
                        tag_name = elem.tag
                        timestamp = None
                        if date_pattern.search(tag_name):  # Check if the tag name matches the pattern
                            try:
                                timestamp = parser.parse(elem.text)  # Parse the date text
                                today = datetime.today()

                                # Skip this item if its date is older than today
                                if timestamp.date() < today.date():
                                    continue

                            except (ValueError, TypeError):
                                # Handle any date parsing errors here
                                pass

                        # Check if tag includes a namespace
                        if '}' in tag_name:
                            tag_name = tag_name.split('}', 1)[1]  # Remove namespace

                        # Use tag as the key and text as the value in JSON output
                        item_data[tag_name] = elem.text or ""
                        
                        # Handle any namespaced elements, such as media:thumbnail
                        if elem.tag == f"{{{XML_NAMESPACES['media']}}}thumbnail":
                            item_data['thumbnail_url'] = elem.get('url', '')

                    feed_data.append(item_data)
                
                # Add parsed data to the dictionary
                all_feeds_data[feed['name']] = feed_data

        except Exception as e:
            # Log error if you want to handle individual feed errors
            all_feeds_data[feed['name']] = {"error": str(e)}

    # Return all feeds data as JSON response
    return jsonify(all_feeds_data)


@api.route('/api/refresh-calendar', methods=('GET',))
@login_required
def refresh_calendar():
    user_id = session.get('user_id')

    print(f'Refreshing calendar for user {user_id}')

    res = {}
    code = 200

    cursor = None

    try:
        with get_db() as db:
            expenses = []
            cursor = db.cursor()
            cursor.execute(
                '''
                    SELECT *
                    FROM "expense"
                    WHERE user_id = %s
                ''',
                (user_id,)
            )
            expenses = fetchall_as_dict(cursor)

            print(f'Found {len(expenses)} expenses to recur')

            today = datetime.now()
            events = []
            total = 0
            for expense in expenses:
                recurrenceid = str(uuid.uuid4())

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

                    event = CreateEventFromExpense(recurrenceid, options, user_id, expense)

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
            cursor.close()

            html = RenderApp(db, True)
            return jsonify({ 'status': 'success', 'html': html })
    except Exception as e:
        res['status'] = 'error'
        print(e)
        code = 500
        return jsonify(res), code



