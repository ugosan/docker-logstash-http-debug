var WebSocket = require('ws');

var blessed = require('blessed'),
    screen;
var hljs = require('highlight.js');
var h2c = require('highlight.js-console'); 


var messages = [];

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
        var hlText = hl2c.highlightAuto(JSON.stringify(messages[logger.getScroll()], null, 2));
        
        topright.content = hlText;

        /*highlight(JSON.stringify(content, null, 2), 'json', 'console', function(data) {
            topright.content = data;
          });*/
    }

});

logger.on('select', function () {
    topright.content = JSON.stringify(messages[logger.getScroll()], null, 2);

});

screen.append(topright);
screen.append(ws_connected);
screen.append(title);

screen.key('q', function () {
    ws.close();
    process.exit(0);
    return screen.destroy();
});

process.on('SIGTERM', function () {
    console.info("Shutting down UI");
    process.exit(0);
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
    const jsonmessage = JSON.parse(message);
    logger.add(jsonmessage["@timestamp"]||"event");
    messages.push(message);
});

setInterval(function(){
    screen.render();
}, 200);


screen.render();