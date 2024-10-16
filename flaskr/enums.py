from enum import Enum

class Frequency(Enum):
  DAILY = 'daily'
  WEEKLY = 'weekly'
  BIWEEKLY = 'biweekly'
  MONTHLY = 'monthly'
  YEARLY = 'yearly'

class Page(Enum):
    CALENDAR = 1
    DAY = 2
    PREVIOUSMONTH = 3
    NEXTMONTH = 4
    EVENT = 5
    PRESENTS = 6
    IMAGINE = 7
    LEFTPANEL = 8
    RIGHTPANEL = 9

Api = {
  'ADD_EXPENSE': 'add-expense',
  'DELETE_EXPENSE': 'delete-expense',
  'UPDATE_EXPENSE': 'update-expense',
  'REFRESH_CALENDAR': 'refresh-calendar',
  'CHANGE_MONTH_YEAR': 'update-month-year',
  'GET_EVENT': 'get-event',
  'UPDATE_EVENT': 'update-event'
}


frequency = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'yearly'
]

event_fields = [
    'recurrenceid', 
    'summary', 
    'date', 
    'recurrenceenddate', 
    'amount', 
    'total', 
    'balance', 
    'exclude', 
    'frequency'
]