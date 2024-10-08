require('./extensions');

const { app, BrowserWindow, ipcMain, Tray } = require('electron');

app.dock.setIcon("yuzu-wikipd.png");

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const qs = require('querystring');
const moment = require('moment');
const cp = require('child_process');
const calendar = require('calendar').Calendar;
const uuid = require('uuid');
var GET_TOTAL = () => JSON.parse(fs.readFileSync('./balance.json'));
var total = GET_TOTAL();
var Calendar = new calendar();
var account = {
  year: moment().year(),
  month: moment().month() + 1
};
var IMG = require('./assets/IMG');

const Page = {
  CALENDAR: 1,
  DAY: 2,
  PREVIOUSMONTH: 3,
  NEXTMONTH: 4,
  EVENT: 5,
  PRESENTS: 6,
  IMAGINE: 7,
  LEFTPANEL: 8,
  RIGHTPANEL: 9
};

const Api = {
  CREATEEVENT: 1,
  SAVEEVENT: 2,
  DELETETHISEVENT: 3,
  DELETEALLTHESEEVENTS: 4,
  DELETETHISANDFUTUREEVENTS: 4.5,
  CSV: 5,
  ADDEXPENSE: 6,
  REFRESHCALENDAR: 7,
  LOADBALANCE: 8,
  CHAT: 9,
  ADDPRESENT: 10,
  PRESENT: 11,
  DELETEPRESENT: 12,
  BUYPRESENT: 13,
  EDITSINGLEVENT: 14,
  SUMMARIZE: 15,
  TOGGLESAVINGS: 16,
  ACCOUNT: 17,
  SAVEEVENTINSTANCE: 18
};

const Expenses = () => loadCsv('expenses');
const Presents = () => load('./presents.json');
const Debts = () => loadCsv('debts')

const DOW = [
  'Sunday','Monday','Tuesday',
  'Wednesday','Thursday','Friday',
  'Saturday'
];

const MONTHS = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December'
]

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.maximize();

  win.loadFile('index.html')
}

var abc123 = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
function id() {
  var result = '';
  while (result.length < 10) {
    result += abc123[Math.floor(Math.random() * abc123.length)];
  }
  return result;
}

var balanceMap = {};
function CalculateTotals(events) {
  var account = JSON.parse(fs.readFileSync('./account.json'));
  if (account.addSavings == true) {
    total = GET_TOTAL().checking + GET_TOTAL().saving;
  } else {
    total = GET_TOTAL().checking;
  }
  events = events.sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(event => {
      if (moment(event.date).isAfter(event.recurrenceenddate)) {
        event.recurrenceenddate = event.date;
      }
      event.total = 0;
      return event;
    });
  var today = moment().startOf('day');
  var start = false;
  for (var i = 0; i < events.length; i++) {
    if (+events[i].balance !== 0) {
      if (!balanceMap.hasOwnProperty(events[i].recurrenceid)) {
        balanceMap[events[i].recurrenceid] = {
          balance: +events[i].balance,
          count: 0,
          months: null
        };
      } else {
        events[i].balance = balanceMap[events[i].recurrenceid].balance + +events[i].amount;
        balanceMap[events[i].recurrenceid].count++;
        balanceMap[events[i].recurrenceid].balance = events[i].balance;
        if (events[i].balance <= 0 && balanceMap[events[i].recurrenceid].months == null) {
          balanceMap[events[i].recurrenceid].months = balanceMap[events[i].recurrenceid].count;
          balanceMap[events[i].recurrenceid].balanceEndDate = events[i].date;
          events = events.map(e => {
            if (e.recurrenceid == events[i].recurrenceid) {
              e.months = balanceMap[events[i].recurrenceid].months;
              e.balanceEndDate = balanceMap[events[i].recurrenceid].balanceEndDate;
            }
            return e;
          });
        }
      }
    }
    if (moment(events[i].date).isSameOrAfter(today)) {
      start = true;
    }
    if (start) {
      if (!events[i].exclude) {
        total += +events[i].amount;
      }
      events[i].total = +total;
    }
  }
  if (account.addSavings) {
    total = GET_TOTAL().checking + GET_TOTAL().saving;
  } else {
    total = GET_TOTAL().checking;
  }
  balanceMap = {};
  return events;
}

function RecurEvent(event, events) {
  if (!event) return events;

  var date = moment(event.date);
  var enddate = moment(event.recurrenceenddate);

  events = events.sort((a,b) => new Date(a.date) - new Date(b.date))
    .filter(e => {
      return (
        e.recurrenceid == event.recurrenceid && moment(e.date).isBefore(event.date)
      ) || (
        e.recurrenceid !== event.recurrenceid
      );
    });

  event.recurrenceid = id();

  while (date.isSameOrBefore(enddate)) {
    var recurredEvent = CreateEvent({
      year: date.year(),
      month: date.month() + 1,
      date: date.date(),
      summary: event.summary,
      amount: event.amount,
      exclude: event.exclude
    }, event);
    events.push(recurredEvent);
    switch (event.frequency) {
      case 'Monthly':
        date.add(1, 'month');
        break;
      case 'Biweekly':
        date.add(2, 'week');
        break;
      case 'Weekly':
        date.add(1, 'week');
        break;
      default:
        throw new Error('Unknown recurrence frequency: ' + event.frequency);
    }
  }
  
  return events;
}

function CreateEvent(data, event) {
  return {
    id: id(),
    recurrenceid: event && event.recurrenceid ? event.recurrenceid : id(),
    summary: ((event && event.summary ? event.summary : data && data.summary) ? data.summary : '-'),
    date: moment(new Date(+data.year, +data.month - 1, +data.date)).format('yyyy-MM-DD'),
    recurrenceenddate: event && event.recurrenceenddate ? event.recurrenceenddate :  moment(new Date(+data.year, +data.month - 1, +data.date)).format('yyyy-MM-DD'),
    amount: ((event && event.amount ? event.amount : data && data.amount) ? data.amount : 0),
    frequency: event && event.frequency ? event.frequency : 'Monthly',
    total: 0,
    balance: event && event.balance ? event.balance : 0,
    exclude: (event && event.exclude) || false
  };
}

function SavePresents(presents) {
  fs.writeFileSync('./presents.json', JSON.stringify(presents.sort((a, b) => {
    return a.name - b.name;
  }).map(present => {
    delete present.index;
    return present;
  }), null, 2));
}

function Key(object, value) {
  for (var key in object) {
    if (object[key] == value) {
      return key;
    }
  }
}

function load(filepath) {
  var file = fs.readFileSync(filepath).toString();
  var json;
  try {
    json = JSON.parse(file);
  } catch {
    json = [];
  }
  return json;
}

function Month(year, month) {
  return Calendar.monthDays(year, month - 1)
    .map(week => week.map((date, weekIndex) => {
      if (!date) return date;
      return {
        date,
        day: DOW[weekIndex],
        events: []
      };
    }).filter(dayObj => dayObj)
      .map(dayObj => {
        dayObj.year = year;
        dayObj.month = month;
        return dayObj
    })
  ).reduce((a, b) => a.concat(b))
}

function PreviousMonth(year, month) {
  if (month == 1) {
    year -= 1;
    month = 12;
  } else {
    month -= 1;
  }
  return Month(year, month);
}

function NextMonth(year, month) {
  if (month == 12) {
    year += 1;
    month = 1;
  } else {
    month += 1;
  }
  return Month(year, month);
}

function Months(weeks) {
  var months = [];
  var week = [];
  var first = false;
  for (var i = 0; i < weeks.length; i++) {
    if (week.length == 7) {
      months.push(week);
      week = [];
    }
    if (!first && weeks[i].day == 'Sunday') {
      first = true;
    }
    if (first) {
      week.push(weeks[i]);
    }
  }
  return months;
}

function PosNegClass(event) {
  return `class="${event.amount > 0 ? 'positive' : (event.amount < 0 ? 'negative' : '')}"`;
}

function RenderMonths(months, account, events) {
  var account = JSON.parse(fs.readFileSync('./account.json').toString());
  var balance = JSON.parse(fs.readFileSync('./balance.json').toString());
  return months.map((week, weekIndex) => {
    return `<div class="week" id="week-${weekIndex}">${
      week.map((d, dayIndex) => {
        var firstOfMonth = d.date == 1;
        var isToday = d.year == moment().year() && d.date == moment().date() && d.month - 1 == moment().month();
        if (isToday) {
          if (account.addSavings) {
            d.total = GET_TOTAL().checking + GET_TOTAL().saving;
          } else {
            d.total = GET_TOTAL().checking;
          }
        }

        const total = Math.round(Number(d.events[d.events.length - 1] ? d.events[d.events.length - 1].total : d.total).toFixed(2));

        return `<div class="${firstOfMonth ? 'first-of-month' : ''} day-block${d.day == 'Sunday' || d.day == 'Saturday' ? ' weekend' : ''} ${d.month !== account.month ? ' opaque' : ''}" data-date=${d.date} data-dow=${d.day} data-year=${d.year} data-month=${d.month} data-monthname=${MONTHS[d.month - 1]}>
          <div class="day-header">
            ${
              (moment(new Date(d.year, d.month - 1, d.date + 1)).isSameOrAfter(moment()) && d.events.length) || isToday ? 
              `<div class="total">
                ${ isToday ? `<input type="number" value="${total}" id="total-input" />` : total }
              </div>` 
              : ''
            }
            <div class="day-date${isToday ? ' today' : ''}" ${isToday ? 'id="todays-date"' : ''}>${d.date}</div>
          </div>
          <div class="events">
            ${
              d.events.map(event => {
                return `<div class="event${event.exclude ? ' exclude' : ''}" data-id="${event.id}" id="${event.id}">
                  <span ${PosNegClass(event)}>•</span> <span class="summary">${event.summary}</span> <span ${PosNegClass(event)}>${event.amount}</span>
                </div>`;
              }).join('')
            }
          </div>
        </div>`
      }).join('')
    }</div>`;
  }).join('')
}

function loadCsv(name) {
  return fs.readFileSync('./' + name + '.csv').toString().split('\n').map(line => line.replaceAll('\r', '').split(','));
}

function Refresh(callback) {
  var events = [];
  var expenses = loadCsv('expenses');
  var headers = expenses.shift();
  var today = moment().startOf('day');
  for (var i = 0; i < expenses.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = expenses[i][j];
    }
    expenses[i] = obj;
    var date = moment(`2022-11-${expenses[i]['Start Date']}`);
    var k = 0;
    const frequency = expenses[i].Frequency.toUpperCase();
    while (k < +expenses[i].Recurs) {
      switch (frequency) {
        case 'MONTHLY':
          date.add(1, 'month');
          break;
        case 'BIWEEKLY':
          date.add(2, 'week');
          break;
        case 'WEEKLY':
          date.add(1, 'week');
          break;
        default:
          throw new Error('Unknown recurrence frequency: ' + frequency);
      }
      k++;
    }
    
    var event = CreateEvent({
      year: 2022,
      month: 11,
      date: +expenses[i]['Start Date']
    }, expenses[i]);
    event.recurrenceenddate = date.format('yyyy-MM-DD');
    event.summary = expenses[i].Expense
    event.amount = +expenses[i].Amount;
    event.frequency = expenses[i].Frequency;
    event.balance = 0;
    events.push(event);
    events = RecurEvent(event, events);
  }
  fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
  if (callback) callback();
}

function DownloadImage(url, objectId) {
  return new Promise(resolve => {
    cp.exec(`curl ${url} > tmp.png`, (stderr, stdout) => {
      var img = fs.readFileSync('./tmp.png', { encoding: 'base64' });
      resolve(`data:image/png;base64,${img}`);
    });
  });
}

async function sync(event) {
  var balance = JSON.parse(fs.readFileSync('./balance.json'));
  return {
    Page,
    Api,
    Expenses: Expenses(),
    Debts: Debts(),
    Checking: balance.checking,
    Saving: balance.savings
  };
}

let reqUuid = uuid.v4();

async function api(event, which, data) {
  var events = load('./events.json');
  var account = JSON.parse(fs.readFileSync('./account.json'));

  switch (which) {
    case Api.ACCOUNT:
      for (var key in data) {
        if (account[key] = data[key]);
      }
      fs.writeFileSync('./account.json', JSON.stringify(account, null, 2));
      break;
    case Api.CREATEEVENT:
      let newevent = CreateEvent(data);
      events.push(newevent);
      events = CalculateTotals(events);
      fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
      break;
    case Api.EDITSINGLEVENT:
      for (var i = 0; i < events.length; i++) {
        if (events[i].id == data.id) {
          for (var key in data) {
            events[i][key] = data[key];
          }
        }
      }
      events = CalculateTotals(events);
      fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
      break;
    case Api.SAVEEVENT:
      for (var i = 0; i < events.length; i++) {
        if (events[i].id == data.id) {
          for (var key in data) {
            events[i][key] = data[key];
          }
          events = RecurEvent(events[i], events);
        }
      }
      events = CalculateTotals(events);
      fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
      break;
    case Api.SAVEEVENTINSTANCE:
      for (var i = 0; i < events.length; i++) {
        if (events[i].id == data.id) {
          console.log("JUST THIS", events[i])
          for (var key in data) {
            events[i][key] = data[key];
          }
        }
      }
      events = CalculateTotals(events);
      fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
      break;
    case Api.DELETETHISEVENT:
      // e.id & data.id
      events = events.filter(e => {
        if (data && e.id == data.id) {
          return false;
        }
        return true;
      });
      fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
      break;
    case Api.DELETEALLTHESEEVENTS:
      events = events.filter(e => {
        var condition = (
          e.recurrenceid !== data.recurrenceid 
        );
        return condition;
      });
      fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
      break;
    case Api.DELETETHISANDFUTUREEVENTS:
      for (var i = 0; i < events.length; i++) {
        if (events[i].recurrenceid == data.recurrenceid && moment(events[i].date).isSameOrAfter(data.date)) {
          events[i] = null;
        }
      }
      events = events.filter(e => e);
      fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));
      break;
    case Api.CSV:
      var csv = loadCsv(data.table);
      if (data.value == 'DELETE') {
        csv.splice(data.index, 1);
      } else {
        csv[data.index[0]][data.index[1]] = data.value;
      }
      fs.writeFileSync('./' + data.table + '.csv', csv.map(line => line.join(',')).join('\n'));

      return true;
    case Api.ADDCSVROW:
      var csv = loadCsv(data);
      csv.push(['','',0,0,0]);
      fs.writeFileSync('./' + data + '.csv', csv.map(line => line.join(',')).join('\n'));
      return true;
    case Api.REFRESHCALENDAR:
      Refresh(); return true;
    case Api.LOADBALANCE:
      var balance = JSON.parse(fs.readFileSync('./balance.json').toString());
      if (data && data.checking) {
        balance.checking = data.checking;
        fs.writeFileSync('./balance.json', JSON.stringify(balance, null, 2));
      } else {
        var checkingAndSaving = cp.execSync('/usr/bin/automator balance.workflow');
        if (!checkingAndSaving) return;
        checkingAndSaving = checkingAndSaving.toString().replaceAll(/[^\d,]/g, '').split(',').map(Number);

        fs.writeFileSync('./balance.json', JSON.stringify({
          checking: checkingAndSaving[0],
          saving: checkingAndSaving[1]
        }, null, 2));
      }
      return true;
    case Api.TOGGLESAVINGS:
      var account = JSON.parse(fs.readFileSync('./account.json').toString());
      account.addSavings = !account.addSavings;
      // console.log('account savings toggled', account);
      fs.writeFileSync('./account.json', JSON.stringify(account, null, 2));
      break;
    default:
      return `<!DOCTYPE html>
<html>
  <head>
    <title>finance-calenard</title>
    <meta charset="utf8" />
    <style>
      * { font-family: Helvetica; font-weight: 100; }
    </style>
  </head>
  <!-- SOS -->
  <body>
    <pre>
This is the Application Programing Interface for finance-calendar,
and this case hasn't yet been implemented:

      ${
        which
      } of ${
        api
      }
    </pre>
  </body>
</html>`;
  }
  
  return true;
}

async function render(event, which, data = {}) {

  var account = JSON.parse(fs.readFileSync('./account.json'));
  var events = CalculateTotals(load('./events.json'));

  switch (which) {
    case Page.CALENDAR:

      var threeMonthsWeeks = PreviousMonth(account.year, account.month).concat(
        Month(account.year, account.month).concat(
          NextMonth(account.year, account.month)
        )
      );

      var months = Months(threeMonthsWeeks);

      for (var i = 0; i < events.length; i++) {
        var d = moment(events[i].date);
        var year = d.year();
        var month = d.month() + 1;
        var date = d.date();
        for (var j = 0; j < months.length; j++) {
          for (var k = 0; k < months[j].length; k++) {
            var day = months[j][k];
            if (day.date == date && day.month == month && day.year == year) {
              months[j][k].events.push(events[i]);
            }
          }
        }
      }

      return `<div id="calendar-month-header" data-year=${account.year} data-month=${account.month}>
        <div>
          <h1 id="month-name">${MONTHS[account.month - 1]}</h1>&nbsp;&nbsp;
          <h1 id="year-name" style="font-weight:100">${account.year}</h1>
        </div>
        <div id="data" class="search">
          <input style="display:none;" type="test" placeholder="Go for it!" />
        </div>
        <div>
          <button id="prev-month">
            <span>
              ∟
            </span>
          </button>
          <button id="go-to-today">
            Today
          </button>
          <button id="next-month">
            <span>
              ∟
            </span>
          </button>
        </div>
      </div>

      <div id="calendar-week-header">
        <div class="weekend">Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div class="weekend">Sat</div>
      </div>

      <div id="calendar">
        ${
            RenderMonths(months, account, events)
          }
      </div>`;
    case Page.PREVIOUSMONTH:
      var priorMonth = +data.month == 1 ? 12 : +data.month - 1;
      var year = priorMonth == 1 ? +data.year - 1 : +data.year;
      account = {
        month: priorMonth,
        year
      };
      fs.writeFileSync('./account.json', JSON.stringify(account, null, 2));
      return RenderMonths(Months(Month(account.year, account.month)), account, events);
    case Page.NEXTMONTH:
      var nextMonth = +data.month == 12 ? 1 : +data.month + 1;
      var year = nextMonth == 1 ? +data.year + 1 : +data.year;
      account = {
        month: nextMonth,
        year
      };
      console.log(account, nextMonth)
      fs.writeFileSync('./account.json', JSON.stringify(account, null, 2));
      return RenderMonths(Months(Month(account.year, account.month)), account, events)
    case Page.EVENT:
      var event = events.filter(e => e.id == data.id);
      if (event.length) {
        event = event[0];
      } else {
        event = {};
      }
      return `<div class='modal-content' id="event-edit" data-id="${event.id}" data-recurrenceid="${event.recurrenceid}">
        <div id="modal-event">
          <div id="summary-div">
              <label>Summary</label>
              <input class="this" name="summary" type="text" value="${event.summary}" />
            </div>
            <div>
              <label>Amount</label>
              <input class="this" type="number" id="event-amount" name="amount" value="${event.amount}" />
            </div>
            <div>
              <label>Frequency</label>
              <select class="that" id="event-frequency" name="frequency">
                ${
                  ['Monthly', 'Biweekly', 'Weekly'].map(t => `
                      <option value="${t}" ${event.frequency == t ? 'selected' : ''}>${t}</option>
                  `).join('')
                }
              </select>
            </div>
          <div>
              <label>Date</label>
              <input class="date that" name="date" type="date" id="event-date" value="${moment(event.date).format('yyyy-MM-DD')}" />
            </div>
            <div>
              <label>End Date</label>
              <input class="date that" name="recurrenceenddate" type="date" id="event-recurrence-end-date" value="${moment(event.recurrenceenddate).format('yyyy-MM-DD')}" />
            </div>
        </div>
        <div class="button-footer">
          <button id="save">save</button>
          <button id="clude-this">${event.exclude ? 'include' : 'exclude'}</button>
          <button id="clude-all">${event.exclude ? 'include' : 'exclude'} all</button>
          <button id="delete-this">delete</button>
          <button id="delete-all">delete all</button>
          <button id="delete-tafe">delete tafe</div>
        </div>
      </div>`;
    case Page.PRESENTS:
      return `( 0|-<{•}>>|0? )`;
    case Page.EVENTSUMMARYEDIT:
      return `<article id="event-summary-edit">
      
      </article>`;
    case Page.IMAGINE:
      return IMG[data.name];
    case Page.LEFTPANEL:
      var widths = {
        expenses: [40,15,15,15,15],
        debts: [30,10,10,30,20]
      };
      return `<header id="left" style="background:url(${IMG.wallpaper01})">
        <h3><div>Regular Expenses</div></h3>
        <div class="table" id="expenses">
          ${
            Expenses().map((line, index) => {
              return !index ? `<div class="tr">
                  ${
                    line.map((name, index2) => `<div class="th" style="width:${widths.expenses[index2]}%">` + name + '</div>').join('')
                  }
                  <button style="opacity:0" disabled class="delete-tr">-</button>
                </div>`
              : `<div class="tr data" data-row="${index}">
                  ${
                    line.map((value, index2) => `<input style="width:${widths.expenses[index2]}%" class="td" id="${index}-${index2}" value="${value}" type="text" />`).join('')
                  }

                  <button class="delete-tr">-</button>
                </div>`;
            }).join('')
          }
          <div class="tr button-row-right">
            <button class="add-row">+</button>
            <button id="refresh-calendar">↺</button>
          </div>
        </div> 
        <h3><div>Debts</div></h3>
        <div class="table" id="debts">
          ${
            Debts().map((line, index) => {
              return !index ? `<div class="tr">
                  ${
                    line.map((name, index2) => `<div class="th" style="width:${widths.debts[index2]}%">` + name + '</div>').join('')
                  }
                  <button style="opacity:0" disabled class="delete-tr">-</button>
                </div>`
              : `<div class="tr data" data-row="${index}">
                  ${
                    line.map((value, index2) => `<input style="width:${widths.debts[index2]}%" class="td" id="${index}-${index2}" value="${value}" type="text" />`).join('')
                  }
                  <button class="delete-tr">-</button>
                </div>`;
            }).join('')
          }
          <div class="tr button-row-right">
            <button class="add-row">+</button>
          </div>
        </div>
      </header>`;
    case Page.RIGHTPANEL:
      return `<div class="desc">This is an application purposed for the recurrence of bills paid on time.</div>
    <footer id="right">

    </footer>`;
      break;
    default:
      return `<!DOCTYPE html>
<html>
  <head>
    <title>finance-calenard</title>
    <meta charset="utf8" />
    <style>
      * { font-family: Helvetica; font-weight: 100; }
    </style>
  </head>
  <!-- SOS -->
  <body>
    <pre>
This is the Application Programing Interface for finance-calendar,
and this case hasn't yet been implemented:
    </pre>
  </body>
</html>`;
  }
}



if (process.argv[2] == 'init') {
  Refresh();
}

app.whenReady().then(() => {
  ipcMain.handle('sync', sync); // #hbd
  ipcMain.handle('render', render);






  ipcMain.handle('api', (event, which, data) => {
    var res = api(event, which, data);
    if (typeof res == Promise) {
      res.then();
    }
  });






  // ipcMain.handle('stream', (which, data) => Streamer.ReturnStream(which, data));
  createWindow()
});