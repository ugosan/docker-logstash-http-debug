var highlight = require('pygments').colorize;
var WebSocket = require('ws');

var blessed = require('blessed'),
    screen;

screen = blessed.screen({
    //dump: __dirname + '/log.txt',
    smartCSR: true,
    autoPadding: true,
    warnings: true
});

var logger = blessed.list({
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

var title = blessed.Text({
    left: 0,
    top: 0,
    // border: 'line',
    content: 'Logstash Debug'
});

var ws_connected = blessed.Text({
    right: 0,
    top: 0,
    content: 'Connected: No'
});

var topright = blessed.box({

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

/* highlight(JSON.stringify({foo:{bar:{baz:true}}}, null, 2), 'json', 'console', function(data) {
   topright.content = data;
 });*/

logger.focus();
logger.select(0);

logger.on('keypress', function (ch, key) {
    if (key.name === 'up' || key.name === 'down') {

        var content = {
            "time": Math.random(),
            "string": "this is a long string",
            "object": {
                "one": 1,
                "two": 2.2
            }
        };

        content['index'] = logger.getScroll();
        topright.content = JSON.stringify(content, null, 2);

        /*highlight(JSON.stringify(content, null, 2), 'json', 'console', function(data) {
            topright.content = data;
          });*/
    }

});

logger.on('select', function () {
    var content = {
        "time": Math.random(),
        "string": "this is a long string",
        "object": {
            "one": 1,
            "two": 2.2
        }
    };
    topright.content = JSON.stringify(content, null, 2);
    /*highlight(JSON.stringify(content, null, 2), 'json', 'console', function(data) {
        topright.content = data;
      });*/
});

screen.append(topright);
screen.append(ws_connected);
screen.append(title);

screen.key('q', function () {
    ws.close();
    return screen.destroy();
});

const ws = new WebSocket('ws://localhost:8081');

ws.on('open', function open() {
    ws_connected.content = "Connected: Yes";
    screen.render();
});

ws.on('close', function open() {
    ws_connected.content = "Connected: No";
    screen.render();
});

ws.on('message', function incoming(message) {
    logger.add("" + message);
    screen.render();
});

screen.render();