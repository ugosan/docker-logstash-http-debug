var WebSocket = require('ws');

var blessed = require('blessed'),
    screen;

var emphasize = require('emphasize')
var chalk = require('chalk')

var messages = [];

const color_config = {
    'attr': chalk.blue,
    'string': chalk.white,
    'number': chalk.magenta
}

var LIST_ITEM_ID = "@timestamp"
var MAX_MESSAGES = 100;

var stats = {};
stats.message_count = 0;
stats.message_length_avg = 0;
stats.messages_per_second = 0;
stats.message_count_t0 = 0;

screen = blessed.screen({
    smartCSR: true,
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
    height: '100%-4',
    border: 'line',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
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
    label: `0/${MAX_MESSAGES}`,
    style: {
        bar: {
            bg: 'default',
            fg: 'blue'
        },
        border: {
            fg: 'default',
            bg: 'default'
        }
    },
    ch: ':',
    width: '20%',
    height: 3,
    left: 0,
    bottom: 1,
    filled: 0
});

var stats_box = blessed.box({
    label: 'Stats',
    border: 'line',
    bottom: 1,
    left: '20%',
    width: '80%',
    height: 3,
    tags: true,
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#f0f0f0'
        }
    }
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


var commands = blessed.Text({
    left: 0,
    top: 0,
    tags: true,
    content: '{bold}q{/bold}uit | {bold}c{/bold}lear events | {bold}r{/bold}eset stats | {bold}s{/bold}ettings',
});
var ws_connected = blessed.Text({
    right: 1,
    top: 0,
    content: 'Connected: No'
});

footer.append(commands);
footer.append(ws_connected);

var message_viewer = blessed.textarea({
    label: 'Preview',
    left: '20%',
    top: 0,
    width: '80%',
    height: '100%-4',
    scrollable: true,
    mouse: true,
    keys: true,
    border: {
        type: 'line',
        left: true,
        top: true,
        right: true,
        bottom: true
    },
    content: '',
    scrollbar: {
      ch: ' ',
      track: {
          bg: 'gray'
      },
      style: {
          inverse: true
      }
  }
});

message_list.focus();
message_list.select(0);

var show_message = function (index) {
    if (messages.length > 0) {
        var msg = messages[index];

        if(!msg.formatted){
          //do the json pretty print, which is slow;
          msg.formatted = emphasize.highlightAuto(JSON.stringify(msg.json, null, 2), color_config).value;
        }
        message_viewer.content = msg.formatted;
    }
}

async function add_message(message) {
  return new Promise(resolve => {
    if (messages.length < MAX_MESSAGES) {
      var msg = {};
      msg.json = JSON.parse(message);
      
      message_list.add(msg.json[LIST_ITEM_ID] || "event " + message_list.items.length);
      messages.push(msg);

      if (messages.length == 1) show_message(message_list.getScroll());
    }
    stats.message_count++;
    resolve(stats.message_count);
  });

}

var update_progress = function () {
    progress.setLabel(messages.length + "/" + stats.message_count);
    progress.filled = messages.length * 100 / MAX_MESSAGES;

    if (messages.length >= MAX_MESSAGES) progress.style.bar.fg = 'white'
    else progress.style.bar.fg = 'blue'
}

message_list.on('keypress', function (ch, key) {
    if (key.name === 'up' || key.name === 'down') {
        show_message(message_list.getScroll());
    } 

    if (key.name === 'right') {
      message_viewer.focus();
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
screen.append(stats_box);
screen.append(progress);
screen.append(footer);


var prompt = blessed.box({
    parent: screen,
    shadow: true,
    left: 'center',
    top: 'center',
    width: '50%',
    height: '50%',
    style: {
        bg: 'red',
        transparent: false
    },
    border: 'line',
    draggable: true,
    label: 'Settings',
    hidden: true
});

var set = blessed.radioset({
    parent: prompt,
    left: 1,
    top: 1,
    shrink: true,
    //padding: 1,
    //content: 'f',
    style: {
        bg: 'magenta'
    }
});

blessed.radiobutton({
    parent: set,
    mouse: true,
    keys: true,
    shrink: true,
    style: {
        bg: 'magenta'
    },
    height: 1,
    left: 0,
    top: 0,
    name: 'radio1',
    content: 'radio1'
});

blessed.textbox({
    parent: prompt,
    mouse: true,
    keys: true,
    style: {
        bg: 'blue'
    },
    height: 1,
    width: 20,
    left: 1,
    top: 3,
    name: 'text'
});

screen.key('s', function () {
    prompt.hidden = !prompt.hidden;
    if (prompt.hidden){
        message_list.focus();
    }else{
        prompt.focus();
    }
});

screen.key('r', function () {
    message_list.clearItems();
    stats.message_count = 0;
    stats.message_length_avg = 0;
    stats.messages_per_second = 0;
    stats.message_count_t0 = 0;
    messages = [];
    message_viewer.content = "";
});

screen.key('c', function(){
    message_list.clearItems();
    messages = [];
    message_viewer.content = "";
});

screen.key('q', function () {
    ws.close();
    screen.destroy();
    process.exit(0);
    return screen.destroy();
});

message_viewer.key('tab',function () {
  message_list.focus();
});

message_list.key('tab',function () {
  message_viewer.focus();
});

screen.key('t', function () {
    var test_message = {
        "@timestamp": new Date().toISOString(),
        "foo": "bar",
        "blah": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "number": 400,
        "floating": 4.555,
        "blah2": {
          "aaa": "ááá",
          "cccc": "DDD"
        },"blah3": {
          "aaa": "👍",
          "cccc": "DDD"
        },"blah4": {
          "aaa": "bbb",
          "cccc": "DDD"
        },"blah5": {
          "aaa": "bbb",
          "cccc": "DDD"
        },"blah6": {
          "aaa": "bbb",
          "cccc": "DDD"
        },"blah7": {
          "aaa": "bbb",
          "cccc": "DDD"
        },"blah8": {
          "aaa": "bbb",
          "cccc": "DDD"
        },"blah9": {
          "aaa": "bbb",
          "cccc": "DDD"
        },"blah10": {
          "aaa": "bbb",
          "cccc": "DDD"
        },"blah11": {
          "aaa": "bbb",
          "cccc": "DDD"
        }
    }

    add_message(JSON.stringify(test_message));
});


process.on('SIGTERM', function () {
    console.info("Shutting down UI");
    ws.close();
    screen.destroy();
    process.exit(0);
});

function humanize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

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
    stats.message_length_avg = Buffer.from(message).length/messages.length;
});

setInterval(function () {
    screen.render();
}, 200);

setInterval(function(){
    update_progress();

    stats.messages_per_second = stats.message_count - stats.message_count_t0;
    stats_box.content = `{bold} ${stats.message_length_avg} {/bold} bytes avg \t {bold}${stats.messages_per_second}{/bold} eps \t {bold}${humanize(stats.messages_per_second*stats.message_length_avg)}{/bold}/s`;
    stats.message_count_t0 = stats.message_count;
}, 1000);