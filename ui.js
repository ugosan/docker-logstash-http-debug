var WebSocket = require('ws');

var blessed = require('blessed'), screen;

var emphasize = require('emphasize')
var chalk = require('chalk')
var messages = [];

const color_config = {
    'attr': chalk.blue,
    'string': chalk.white,
    'number': chalk.magenta
}

const MAX_MESSAGES = 500;

var message_count = 0;

screen = blessed.screen({
    //dump: __dirname + '/log.txt',
    fastCSR: true,
    autoPadding: true,
    warnings: true,
    dockBorders: true,
    title: "Logstash Debug"
});


var message_list = blessed.list({
    label: 'Events',
    top: 0,
    left: 'left',
    width: '20%',
    height: '90%',
    border: 'line',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollback: 100,
    style: {
        selected: {
            bg: 'red'
        }
    },
    scrollbar: {
        ch: ' ',
        track: {
            bg: 'red'
        },
        style: {
            inverse: true
        }
    }
});



var progress = blessed.progressbar({
    border: 'line',
    label: '0/200',
    style: {
      fg: 'magenta',
      bg: 'default',
      bar: {
        bg: 'default',
        fg: 'blue'
      },
      border: {
        fg: 'default',
        bg: 'default'
      }
    },
    ch: '█',
    width: '20%',
    height: 3,
    left: 0,
    top: '90%-4',
    filled: 0
  });


var footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: '#f0f0f0'
      }
    }
});

footer.append(progress);

var commands = blessed.Text({
    left: 0,
    top: 0,
    tags: true,
    content: '{bold}q{/bold}uit | {bold}c{/bold}lear events | {bold}s{/bold}ettings',
});
var ws_connected = blessed.Text({
    right: 1,
    top: 0,
    content: 'Connected: No'
});

footer.append(commands);
footer.append(ws_connected);

var message_viewer = blessed.box({
    label: 'Preview',
    left: '20%',
    top: 0,
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

var add_message = function(message){
    
    if(messages.length <= MAX_MESSAGES){
        var jsonmessage = JSON.parse(message);
        message_list.add(jsonmessage["@timestamp"] || "event "+message_list.items.length);
        messages.push(message);

        if(messages.length == 1) show_message(message_list.getScroll());
    }
    message_count++;
    update_progress();
}

var update_progress = function(){
    progress.setLabel(messages.length+"/"+message_count);
    progress.filled = messages.length*100/MAX_MESSAGES;
}


message_list.on('keypress', function (ch, key) {
    if (key.name === 'up' || key.name === 'down') {
        show_message(message_list.getScroll());
    }else if (key.name === 'c') {
        message_list.clearItems();
        messages = [];
        message_viewer.content = "";
        update_progress();
    }

});

message_list.on('select', function () {
    show_message(message_list.getScroll());
});

message_list.on('click', function () {
    show_message(message_list.getScroll());
});

screen.append(message_list);
screen.append(message_viewer);
screen.append(footer);

screen.key('q', function () {
    ws.close();
    process.exit(0);
    return screen.destroy();
});

screen.key('t', function(){
    var test_message = {
        "@timestamp": new Date().toISOString(),
        "foo": "bar",
        "blah": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "number": 400,
        "floating": 4.555
    }

    add_message(JSON.stringify(test_message));
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
    add_message(message);
});

setInterval(function () {
    screen.render();
}, 300);
