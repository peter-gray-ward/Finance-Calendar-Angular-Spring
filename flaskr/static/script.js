var body = () => document.getElementsByTagName('body')[0];
var main = () => document.getElementById('main');
var modal = document.createElement('div');
    modal.classList.add('modal');
var calendar = () => document.getElementById('calendar');
let Api, Page;

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
  api: (which, data = {}) => {
    const isDelete = /delete/.test(which)
    return new Promise(resolve => {
      var xhr = new XMLHttpRequest();
      xhr.open(isDelete ? 'DELETE' : 'POST', `/api/${which}`);
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
      if (isDelete) {
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


function SerializeExpense(id) {
  var row = document.getElementById(id);
  console.log($(row.children[3]).val())
  return JSON.stringify({
    name: row.children[0].value,
    frequency: row.children[1].children[0].value,
    amount: row.children[2].value,
    startdate: moment(row.children[3].value).format('yyyy-MM-DD'),
    recurrenceenddate: moment(row.children[4].value).format('yyyy-MM-DD'),
    expense_id: row.id,
  })
}

var events = {
  '.select:focus': function(event) {
    var input = event.srcElement;
    if (!input.classList.contains('active')) {
      input.classList.add('active');
      var options = eval(input.dataset.options);
      for (var option of options) {
        var el = document.createElement('div');
        el.classList.add('option');
        el.innerHTML = option;
        input.parentElement.appendChild(el);
      }
      ADD_EVENTS()
    }
  },
  '.select:blur': function(event) {
    var input = event.srcElement;
    input.classList.remove('active');
    input.parentElement.querySelectorAll('.option').forEach(el => el.remove());
  },
  '.option:mousedown': function(event) {
    var id = $(event.srcElement).closest('.tr')[0].id
    var input = event.srcElement.parentElement.querySelector('input.select');
    $(input).val(event.srcElement.innerHTML);
    SerializeAndSave = setTimeout(function(id) {
      const expense = SerializeExpense(id);
      console.log(".... saving", expense)
    }.bind(null, id), 700);
  },
  '.add-expense:click': function(event) {
    var expenses = $($(event.srcElement).closest('#left')).find('#expenses')[0]
    fc.api(Api.ADD_EXPENSE).then(res => {
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
    fc.api(Api.DELETE_EXPENSE + '/' + expense_id).then(res => {
      if (res.status == 'success') {
        row[0].remove();
      }
    });
  }
}


fc.sync().then(res => {
  Api = res.Api;
  Page = res.Page;
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
    const elements = document.querySelectorAll(selector);


    elements.forEach(element => {
      element.addEventListener(eventType, events[key]);
    });
  }
}



ADD_EVENTS()



