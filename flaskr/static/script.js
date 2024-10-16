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



var chillout = {
  click: {
    body: false
  }
}

var events = {

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
  '.select:focus': (event) => {
    var input = event.srcElement;
    input.classList.add('focusable')

    $(input.parentElement).css({
      'z-index': 99999
    })
    if (!input.parentElement.classList.contains('active')) {
      input.parentElement.classList.add('active');
      var options = eval(input.dataset.options);
      for (var option of options) {
        var optionEl = document.createElement('button');
        optionEl.classList.add('option');
        optionEl.innerHTML = `<span>${option}</span>`;
        optionEl.dataset.value = option
        optionEl.addEventListener("click", this['button.option:click'])

        var graphic = document.createElement('div')
        graphic.classList.add('option')
        $(graphic).addClass('graphic')
        $(graphic).html(input.dataset[option + '-graphic-text'])
        optionEl.appendChild(graphic)

        console.log('adding a graphic')

        input.parentElement.appendChild(optionEl);
      }

      
    }
  },
  
  '.select:blur': function(event) {
    var inSelectContainer = event.target
    while (inSelectContainer && inSelectContainer.classList.contains('select-container') == false) {
      inSelectContainer = inSelectContainer.parentElement
    }
    if (inSelectContainer) return
    var input = event.srcElement;
    if (!$(input).closest('.select-container').length) return
    input.parentElement.classList.remove('active');
    input.parentElement.querySelectorAll('.option').forEach(el => el.remove());
  },

  'button.option:click': function(event) {
    var tr = event.target;
    while (tr && tr.classList.contains("tr") == false) {
      tr = tr.parentElement;
    }

    if (tr) {
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
    } else {
      var value = event.target.dataset.value;
      $($(event.target.parentElement).find('input')).val(value)
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

  // Mouse down: start dragging
  'window:mousedown': (event) => {
    // var modal = $(event.target).closest('.modal')
    // if (modal.length && !$(event.target).hasClass('focusable') && !$(event.target).closest('.focuable').length) {
      
    //   modal.addClass('gripped');
    //   modal.data().offset = JSON.stringify({
    //     x: event.clientX - modal.offset().left,
    //     y: event.clientY - modal.offset().top
    //   });
    // }

    var isModal = event.target
    while (isModal && isModal.classList.contains('modal') == false) {
      isModal = isModal.parentElement;
    }

    var focusable = event.target
    while (focusable && focusable.classList.contains('focusable') == false) {
      focusable = focusable.parentElement;
    }

    if (isModal && !focusable) {
      console.log(event.target, 'is not focusable')
      isModal.classList.add('gripped')
      $(isModal).data().offset = JSON.stringify({
        x: event.clientX - $(isModal).offset().left,
        y: event.clientY - $(isModal).offset().top
      });
    }


    var eventItem = event.srcElement;
    while (eventItem && eventItem.classList.contains('event') == false) {
      eventItem = eventItem.parentElement;
    }

    if (!eventItem) {
      if (event.srcElement.dataset.parentSelector) {
        eventItem = document.querySelector(event.srcElement.dataset.parentSelector)
      }
    }

    if (eventItem) {
      console.log('request for ' + eventItem.id + ' event edit')
      fc.api('GET', Api.GET_EVENT + '/' + eventItem.id).then(res => {
        if (res.status !== 'success') return alert(res.status)

        var modal = document.createElement('div');
        modal.classList.add('modal');
        modal.classList.add('event-modal')
        modal.innerHTML = res.html;

        body().appendChild(modal);


        var width = +getComputedStyle(modal).width.split('px')[0]
        var height = +getComputedStyle(modal).height.split('px')[0]
        var top = event.clientY
        var left = event.clientX

        while (top < 0) {
          top += 1
        }

         while (height + top > window.innerHeight) {
          top -= 1
        }

        while (width + left > window.innerWidth) {
          left -= 1
        }

         while (left < 0) {
          left += 1
        }

        modal.style.top = top + 'px';
        modal.style.left = left + 'px';



        



        add_chessboard_pieces()
        


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
    console.log(event.target)
    var focusable = event.target
    while (focusable && !focusable.classList.contains('focusable')) focusable = focusable.parentElement
    console.log('is focusable:', focusable)
    var modal = event.target
    while (modal && modal.classList.contains('modal') == false) {
      modal = modal.parentElement
    }
    if (modal) {
      modal.classList.remove("gripped")
    }
  }
}

events['button.option:click'] = events['button.option:click'].bind(events)

function add_chessboard_pieces() {
  var chessBoards = [document.getElementById('after-summary'), document.getElementById('before-amount')]

  if (chessBoards[0]) {
  
    for (var board of chessBoards) {
      var width = window.innerHeight / 3;
      var height = width;

      var Y = 3
      for (var y = 0; y < Y; y++) {
          for (var x = 0; x < 3; x++) {
              var div = document.createElement('div');

              // Random tree branch background image
              let n = Math.random() < 0.5 ? 1 : (Math.random() < 0.5 ? 2 : (Math.random() < 0.5 ? 3 : 4));
              div.style.background = `url(/static/tree-branch-${n}.png)`;
              
              div.dataset.board_width = width;
              var boardPieceWidth = width / 9
              div.style.width = boardPieceWidth + 'px';
              div.style.height = div.style.width;
              div.style.border = 'none';
              div.classList.add('chess-block');

              // Apply a translation toward the center
              // var translateX = distanceToCenterX * 0.5; // Move halfway toward the center
              // var translateY = distanceToCenterY * 0.5;
              // translate(${translateX}px, ${translateY}px)
              div.style.zIndex = 9999
              div.style.transform = `translateZ(${boardPieceWidth / 2}px) scale3d(3, 3, 3) rotateX(${Math.random() * 50}deg) rotateY(${Math.random() * 360}deg) rotateZ(${Math.random() * 50}deg)`;

              div.addEventListener('mouseover', function(event) {
                  // var div = event.target;
                  // var touchHistory = div.dataset.touchHistory;
                  
                  // // If there's no previous touch history, initialize it
                  // if (!touchHistory) {
                  //     touchHistory = JSON.stringify({
                  //         last: [event.clientX, event.clientY],
                  //         current: [event.clientX, event.clientY]
                  //     });
                  //     div.dataset.touchHistory = touchHistory;
                  // }

                  // // Parse the touch history
                  // touchHistory = JSON.parse(div.dataset.touchHistory);

                  // // Update the current position in touch history
                  // touchHistory.last = touchHistory.current;
                  // touchHistory.current = [event.clientX, event.clientY];

                  // // Calculate the distance moved in both X and Y directions
                  // var distX = touchHistory.current[0] - touchHistory.last[0];
                  // var distY = touchHistory.current[1] - touchHistory.last[1];

                  // // Calculate the center of the div
                  // var divRect = div.getBoundingClientRect();
                  // var divCenterX = divRect.left + divRect.width / 2;

                  // // Calculate the relative movement toward the center of the div on the X-axis
                  // var relativeX = event.clientX - divCenterX;

                  // // Rotate the div toward the Z-axis (positive Z), clamping the Y-axis rotation between -180 and 180 degrees
                  // var rotateY = relativeX * 0.1; // Adjust this factor to control the sensitivity

                  // // Ensure the rotateY doesn't exceed -180 to 180 degrees
                  // rotateY = Math.max(-180, Math.min(rotateY, 180));

                  // // Rotate the div along the Y-axis (Z-axis pointing into the screen)
                  // div.style.transform = `rotateX(0deg) rotateY(${rotateY}deg) rotateZ(0deg)`;

                  // // Store the updated touch history back into the dataset
                  // div.dataset.touchHistory = JSON.stringify(touchHistory);
              });

              board.appendChild(div)
          }
      }
    }

  } else {
    window.requestAnimationFrame(add_chessboard_pieces)
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
  runTemps();
});


function runTemps() {
  $('.select-container').each(function(index, element) {
    // Get the parent and sibling elements
    var childrenArray = Array.from(this.parentElement.children);
    var thisIndex = childrenArray.indexOf(this);
    
    var thisIsFirst = thisIndex === 0;
    var thisIsLast = thisIndex === childrenArray.length - 1;

    // Calculate the height for each element
    var nextSiblingHeight = this.nextElementSibling ? $(this.nextElementSibling).outerHeight() : 0;
    var previousSiblingHeight = this.previousElementSibling ? $(this.previousElementSibling).outerHeight() : 0;

    var height = thisIsFirst ? nextSiblingHeight : (thisIsLast ? previousSiblingHeight : previousSiblingHeight);

    // Set the max-height based on calculated height
    $(this).css({
      'max-height': height + 'px'
    });
  });
}

runTemps()


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
        if (element.classList.contains('focusable')) {
          console.log('Adding ' + eventType + ' for ' + selector, element)
        }
        element.addEventListener(eventType, events[key]);
      });
    }
  }
}



ADD_EVENTS()


ScrollToFirstOfMonth(0)
