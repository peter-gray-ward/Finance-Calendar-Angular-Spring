from enum import Enum

class Frequency(Enum):
  DAILY = 'daily'
  WEEKLY = 'weekly'
  BIWEEKLY = 'bi-weekly'
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
  'REFRESH_CALENDAR': 'refresh-calendar'
}


frequency = [
  'daily',
  'weekly',
  'bi-weekly',
  'monthly',
  'yearly'
]