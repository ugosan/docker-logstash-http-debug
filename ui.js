var WebSocket = require('ws');

var blessed = require('blessed'), screen;

var emphasize = require('emphasize')
var chalk = require('chalk')
var messages = [];

const color_config = {
    'attr': chalk.red,
    'string': chalk.white,
    'number': chalk.magenta
}

const MAX_MESSAGES = 500;

screen = blessed.screen({
    //dump: __dirname + '/log.txt',
    smartCSR: true,
    autoPadding: true,
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

var title = blessed.Text({
    left: 1,
    top: 0,
    // border: 'line',
    content: 'Logstash Debug',
    style: {
        inverse: true
    }
});



var ws_connected = blessed.Text({
    right: 1,
    top: 0,
    content: 'Connected: No'
});

var message_viewer = blessed.box({
    left: '20%',
    top: 1,
    width: '80%',
    height: '90%',
    border: {
        type: 'line',
        left: true,
        top: true,
        right: true,
        bottom: true
    },
    content: ''
});

message_list.focus();
message_list.select(0);

var show_message = function(index) {
    if(messages.length > 0){
        var jsonmessage = JSON.parse(messages[index]);
        message_viewer.content = emphasize.highlightAuto(JSON.stringify(jsonmessage, null, 2), color_config).value;
    }
}

message_list.on('keypress', function (ch, key) {
    if (key.name === 'up' || key.name === 'down') {
        show_message(message_list.getScroll());
    }

});

message_list.on('select', function () {
    show_message(message_list.getScroll());
});

message_list.on('click', function () {
    show_message(message_list.getScroll());
});


screen.append(message_viewer);
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
    
    if(messages.length <= MAX_MESSAGES){
        message_list.add(jsonmessage["@timestamp"] || "event "+message_list.items.length);
        messages.push(message);
    }
});

setInterval(function () {
    screen.render();
}, 200);

screen.render();