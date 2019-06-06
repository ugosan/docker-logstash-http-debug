var highlight = require('pygments').colorize;
 
var blessed = require('blessed'), screen;

var messages = [];

screen = blessed.screen({
  dump: __dirname + '/log.txt',
  smartCSR: true,
  autoPadding: false,
  warnings: true
});

var message_list = blessed.list({
  parent: screen,
  top: 1,
  left: 'left',
  width: '20%',
  height: '99%',
  border: 'line',
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  scrollback: 100,
  style: {
    selected: {
        bg: 'yellow'
    }
  },
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'yellow'
    },
    style: {
      inverse: true
    }
  }
});

var message_body = blessed.box({

    left: '20%',
    top: 1,
    width: '80%',
    height: '99%',
    border: {
      type: 'line',
      left: true,
      top: true,
      right: true,
      bottom: true
    },
    // border: 'line',
    content: 'Bar'
    
  });

  highlight(JSON.stringify({foo:{bar:{baz:true}}}, null, 2), 'json', 'console', function(data) {
    message_body.content = data;
  });


message_list.focus();
message_list.select(0);

message_list.on('keypress', function(ch, key) {
    if (key.name === 'up' || key.name === 'down') {

        var content = {"time": Math.random(), "string": "this is a long string", "object":{"one": 1, "two": 2.2} };
        content['index'] = message_list.getScroll();
        highlight(JSON.stringify(content, null, 2), 'json', 'console', function(data) {
            message_body.content = data;
          });
    }
  
    
});


message_list.on('select', function(){
    var content = {"time": Math.random(), "string": "this is a long string", "object":{"one": 1, "two": 2.2} };
    highlight(JSON.stringify(content, null, 2), 'json', 'console', function(data) {
        message_body.content = data;
      });
});

screen.append(message_body);

setInterval(function() {
  message_list.add("event "+Math.random());
  screen.render();
}, 300).unref();

screen.key('q', function() {
  return screen.destroy();
});

screen.render();

