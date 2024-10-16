var body = () => document.getElementsByTagName('body')[0];
var main = () => document.getElementById('main');
var modal = document.createElement('div');
    modal.classList.add('modal');
var calendar = () => document.getElementById('calendar');
let Api, Page;
let process = {
  expanding: false,
  refreshing: false
}
var fc = {
  sync: () => {
    return new Promise(resolve => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/sync');
      xhr.addEventListener('load', function() {
        var res = JSON.parse(this.response);
        resolve(res);
      });
      xhr.send();
    });
  },
  api: (method, which, data = {}) => {
    return new Promise(resolve => {
      var xhr = new XMLHttpRequest();
      xhr.open(method, `/api/${which}`, true);
      xhr.setRequestHeader('content-type', 'application/json')
      xhr.addEventListener('load', function() {
        var res = JSON.parse(this.response);
        resolve(res);
      });
      var req = data;
      try {
        req = JSON.stringify(data);
      } catch {
        throw new Error("invalid request body");
      }
      if (method == 'GET' || method == 'DELETE') {
        xhr.send()
      } else {
        xhr.send(req);
      }
    });
  },
  render: (which, data = {}) => {
    if (typeof data !== 'object') data = {};
    data.which = which;
    return new Promise(resolve => {
      var xhr = new XMLHttpRequest();
      xhr.open('PUT', '/render');
      xhr.addEventListener('load', function() {
        resolve(this.response);
      });
      xhr.send(JSON.stringify(data));
    });
  }
};

var SerializeAndSave = undefined;


function SerializeAndSaveExpense(id) {
  var row = document.getElementById(id);
  var json = JSON.stringify({
    name: row.children[0].value,
    frequency: row.children[1].children[0].value,
    amount: row.children[2].value,
    startdate: moment(row.children[3].value).format('yyyy-MM-DD'),
    recurrenceenddate: moment(row.children[4].value).format('yyyy-MM-DD'),
    expense_id: row.id,
  });
  fc.api('POST', Api.UPDATE_EXPENSE + '/' + id, json);
}

function SerializeEvent() {
  var eventEdit = document.getElementById("event-edit");
  var modalEvent = eventEdit.children[0]
  return JSON.stringify({  
    id: eventEdit.dataset.id,
    recurrenceid: eventEdit.dataset.recurrenceid,
    summary: $(modalEvent.children[0].children[1].children[0]).val(),
    date: moment(modalEvent.children[3].children[1].value,).format('yyyy-MM-DD') ,
    recurrenceenddate: moment(modalEvent.children[4].children[1].value,).format('yyyy-MM-DD'), 
    amount: $(modalEvent.children[1].children[1].children[0]).val(),
    frequency: $(modalEvent.children[2].children[1].children[0]).val()
  });
}

function SerializeAndSaveEvent(callback) {
  var json = SerializeEvent()
  fc.api('PUT', Api.UPDATE_EVENT + '/' + eventEdit.dataset.id, json).then(callback)
}

function SelectOption(event, callback) {
  var input = event.srcElement;
  if (!input.parentElement.classList.contains('active')) {
    input.parentElement.classList.add('active');
    var options = eval(input.dataset.options);
    for (var option of options) {
      var optionEl = document.createElement('div');
      optionEl.classList.add('option');
      optionEl.innerHTML = `<span>${option}</span>`;
      optionEl.dataset.value = option
      $(optionEl).css({
        width: +getComputedStyle(input).width.split('px')[0]
      })

      var graphic = document.createElement('div')
      $(graphic).addClass('graphic')
      $(graphic).html(input.dataset[option + '-graphic-text'])
      optionEl.appendChild(graphic)

      console.log('adding a graphic')

      input.parentElement.appendChild(optionEl);

      if (callback) {
        var id = $(input).closest('.id')[0].id
        callback(id)
      }
    }
    ADD_EVENTS()
  }
}

var events = {
  'body:click': function(event) {
    var eventItem = event.srcElement;
    while (eventItem && eventItem.classList.contains('event') == false) {
      eventItem = eventItem.parentElement;
    }
    if (eventItem) {
      console.log('request for ' + eventItem.id + ' event edit')
      fc.api('GET', Api.GET_EVENT + '/' + eventItem.id).then(res => {
        if (res.status !== 'success') return alert(res.status)

        var modal = document.createElement('div');
        modal.classList.add('modal');
        modal.classList.add('event-modal')
        modal.innerHTML = res.html;

        modal.style.top = (event.clientY) + 'px';
        modal.style.left = event.clientX + 'px';

        body().appendChild(modal);
        ADD_EVENTS();

          
      });
    } else {
      var eventModal = event.srcElement;
      while (eventModal && eventModal.classList.contains('event-modal') == false) {
        eventModal = eventModal.parentElement;
      }
      let modal = null;
      if (!eventModal && (modal = document.querySelector('.event-modal')) !== null) {
        modal.remove();
      }
    }
  },
  '.td:keyup': function(event) {
    var id = $(event.srcElement).closest('.tr')[0].id;
    clearTimeout(SerializeAndSave)
    SerializeAndSave = setTimeout(SerializeAndSaveExpense.bind(null, id), 2000);
  },
  '.td:change': function(event) {
    var id = $(event.srcElement).closest('.tr')[0].id;
    clearTimeout(SerializeAndSave)
    SerializeAndSave = setTimeout(SerializeAndSaveExpense.bind(null, id), 2000);
  },
  '.select:focus': SelectOption,// default behavior is to just change the dom
  '.select:blur': function(event) {
    var input = event.srcElement;
    if (!$(input).closest('.select-container').length) return
    input.parentElement.classList.remove('active');
    input.parentElement.querySelectorAll('.option').forEach(el => el.remove());
  },
  '.option:mousedown': function(event) {
    var id = $(event.srcElement).closest('.id')[0].id
    var name = $(event.srcElement).closest('.id')[0].dataset.name
    var input = event.srcElement.parentElement.querySelector('input.select');
    $(input).val(event.srcElement.dataset.value);
    clearTimeout(SerializeAndSave)
    switch (name) {
    case 'expense':
      SerializeAndSave = setTimeout(SerializeAndSaveExpense.bind(null, id), 2000);
      break
    case 'event':
      SerializeAndSave = setTimeout(SerializeAndSaveEvent.bind(null, id), 2000)
      break
    default:
      break;
    }
  },
  '.add-expense:click': function(event) {
    var expenses = $($(event.srcElement).closest('#left')).find('#expenses')[0]
    fc.api('POST', Api.ADD_EXPENSE).then(res => {
      if (res.status == 'success') {
        expenses.insertAdjacentHTML('beforeend', res.html);
        ADD_EVENTS()
      } else {
        console.error(res.error)
      }
    });
  },
  '.delete-expense:click': function(event) {
    var row = $(event.srcElement).closest('.tr.data')
    var expense_id  = row[0].id;
    fc.api('DELETE', Api.DELETE_EXPENSE + '/' + expense_id).then(res => {
      if (res.status == 'success') {
        row[0].remove();
      }
    });
  },
  '#expand:click': () => {
    if (process.expanding) return;
    process.expanding = true;
    if ($('body').hasClass('complex') == false) {
      $('header').addClass('visible');
      $('body').removeClass('music');
      setTimeout(function() {
        $('body').addClass('complex');
        process.expanding = false;
      }, 0);
    } else {
      $('body').removeClass('complex');
      setTimeout(function() {
        $('header').removeClass('visible');
        process.expanding = false;
      }, 100);
    }
  },
  '#refresh-calendar:click': function refreshData() {
    if (process.refreshing) return;
    process.refreshing = true;
    $('#refresh-calendar').addClass('refreshing');
    fc.api('GET', Api.REFRESH_CALENDAR).then(res => {
      $('#refresh-calendar').removeClass('refreshing');
      process.refreshing = false;
      if (res.status == 'success') {
        document.getElementById('calendar').innerHTML = res.html;
        ADD_EVENTS()
      }
    });
    
  },
  '#prev-month:click': () => {
    fc.api('POST', Api.CHANGE_MONTH_YEAR, { which: 'prev' }).then(res => {
      if (res.status == 'success') {
        document.getElementById('calendar').innerHTML = res.html;
        document.getElementById('month-name').innerHTML = res.month
        document.getElementById('year-name').innerHTML = res.year
        ADD_EVENTS()
      }
    })
  },
  '#go-to-today:click': () => {
    fc.api('POST', Api.CHANGE_MONTH_YEAR, { which: 'this' }).then(res => {
      if (res.status == 'success') {
        document.getElementById('calendar').innerHTML = res.html;
        document.getElementById('month-name').innerHTML = res.month
        document.getElementById('year-name').innerHTML = res.year
        ADD_EVENTS()
      }
    })
  },
  '#next-month:click': () => {
    fc.api('POST', Api.CHANGE_MONTH_YEAR, { which: 'next' }).then(res => {
      if (res.status == 'success') {
        document.getElementById('calendar').innerHTML = res.html;
        document.getElementById('month-name').innerHTML = res.month
        document.getElementById('year-name').innerHTML = res.year
        ADD_EVENTS()
      }
    })
  },
  '#save-this-intance:click': () => {
    fc.api('PUT', Api.UPDATE_EVENT_INSTANCE, SerializeEvent()).then(res => {
      if (res.status == 'success') {
        document.getElementById('calendar').innerHTML = res.html;
      } else {
        alert(res.status + ':: ' + res.message)
      }
    })
  },
  // Mouse down: start dragging
  'window:mousedown': (event) => {
    var modal = $(event.target).closest('.modal')
    if (modal.length) {
      console.log('gripped', modal.find('#event-edit').data().id);
      modal.addClass('gripped');
      modal.data().offset = JSON.stringify({
        x: event.clientX - modal.offset().left,
        y: event.clientY - modal.offset().top
      });
    }
  },

  // Mouse move: drag the modal
  'window:mousemove': (event) => {
    var modal = $(event.target).closest('.modal')
    if (modal.length) {
      if (modal.hasClass('gripped')) {
        var offset = JSON.parse(modal.data().offset);
        var newX = event.clientX - offset.x;
        var newY = event.clientY - offset.y;

        modal.css({
            left: `${newX}px`,
            top: `${newY}px`
        });

      }
    }
  },

  // Mouse up: stop dragging
  'window:mouseup': (event) => {
    var modal = $(event.target).closest('.modal')
    if (modal.length) {
      $(modal).removeClass('gripped');
    }
  },
  '.modal, .modal *:mouseup': (event) => {
    event.srcElement.classList.remove('gripped')
  }
}


fc.sync().then(res => {
  Api = res.Api;
  Page = res.Page;
});


function ScrollToFirstOfMonth(offset = 0) {
  var fom = document.querySelectorAll('.first-of-month');
  fom = fom.length == 3 ? fom[1] : fom[0];
  var fomWeek = fom;
  while (fomWeek && fomWeek.classList.contains("week") == false) fomWeek = fomWeek.parentElement;
  var headerHeight = +getComputedStyle(document.getElementById('calendar-month-header')).height.split('px')[0];
  var weekHeaderHeight = +getComputedStyle(document.getElementById('calendar-week-header')).height.split('px')[0];
  calendar().scrollTo(0, fomWeek.offsetTop - headerHeight - weekHeaderHeight);
}

window.addEventListener('resize', function(event) {
  ScrollToFirstOfMonth(0);
  //clearTemps();
});


function REMOVE_EVENTS() {
  for (var key in events) {
    const [selector, eventType] = key.split(':');
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      element.removeEventListener(eventType, events[key]);
    });
  }
}

function ADD_EVENTS() {
  REMOVE_EVENTS();


  for (var key in events) {
    const [selector, eventType] = key.split(':');
    let elements;
    if (selector == 'window') {
      window.addEventListener(eventType, events[key]);
    } else {
      elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.addEventListener(eventType, events[key]);
      });
    }
  }
}



ADD_EVENTS()


ScrollToFirstOfMonth(0)
