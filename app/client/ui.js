var WebSocket = require('ws');

var blessed = require('blessed'),
    screen;
var flatten = require('./flatten');

var emphasize = require('emphasize')
var chalk = require('chalk')

var messages = [];

const ui_colors = {
    'green': '#93c90e',
    'cyan': '#00bfb3',
    'blue': '#00a9e5',
    'magenta': '#df4998',
    'yellow': 'fed10a'
}

const ui_theme = {
    'highlight': ui_colors.magenta,
    'button': ui_colors.blue
}

const json_color_config = {
    'attr': chalk.hex(ui_colors.blue),
    'string': chalk.white,
    'number': chalk.hex(ui_colors.yellow)
}

var KEY_FIELD = "@timestamp"
var MAX_MESSAGES = 100;

var stats = {};
stats.message_count = 0;
stats.message_size_sum = 0;
stats.message_length_avg = 0;
stats.messages_per_second = 0;
stats.message_count_t0 = 0;

screen = blessed.screen({
    log: __dirname + '/console.log',
    debug: true,
    smartCSR: true,
    autoPadding: true,
    warnings: true,
    dockBorders: true,
    fullUnicode: true,
    title: "Logstash Debug",
    cursor: {
        artificial: true,
        shape: 'block',
        blink: true,
        color: ui_colors.yellow
    }
});

const ws = new WebSocket('ws://localhost:8081');

ws.on('open', function open() {
    ws_connected.content = "Connected: Yes";
});

ws.on('close', function open() {
    ws_connected.content = "Connected: No";
});

ws.on('message', function incoming(message) {
    screen.debug(message);
    var json_message = JSON.parse(message);
    
    if(json_message instanceof Array) {
        for (var i = 0; i < json_message.length; i++) {
            add_message(json_message[i]);
        }
    }else {
        add_message(json_message);
    }
   
    stats.message_size_sum += Buffer.from(message).length; 
    stats.message_length_avg = stats.message_size_sum / stats.message_count;
});

var message_list = blessed.list({
    label: 'Events',
    top: 0,
    left: 'left',
    width: '20%',
    height: '100%-4',

    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
        selected: {
            bg: ui_theme.highlight
        }
    },
    border: {
        type: "line",
        fg: 'gray'
    },
    scrollbar: {
        ch: ' ',
        track: {
            bg: ui_theme.highlight
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
        }
    },
    border: {
        type: "line",
        fg: 'gray'
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
    border: {
        type: "line",
        fg: 'gray'
    },
});

var footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: {
        border: {
            fg: '#f0f0f0'
        }
    }
});

var commands = blessed.Text({
    left: 0,
    top: 0,
    tags: true,
    content: '{bold}q{/bold}uit | {bold}r{/bold}eset events | {bold}s{/bold}ettings | {bold}f{/bold}ormat | {bold}w{/bold}rite to file',
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
        type: "line",
        fg: "gray"
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

var show_message = function (index) {
    if (messages.length == 0) return;
    
    var msg = messages[index];

    if (!msg.formatted) {
        //do the json pretty print, which is kind of slow;
        msg.formatted = emphasize.highlight('json', JSON.stringify(msg.json, null, 2), json_color_config).value;
        //msg.formatted = emphasize.highlight('json', JSON.stringify(msg.flat, null, 2), color_config).value;
    }
    message_viewer.setContent(msg.formatted);
    screen.render();
}

async function add_message(message) {
    return new Promise(resolve => {
        if (messages.length < MAX_MESSAGES) {
            var msg = {};
            msg.json = message;
            msg.flat = flatten.flatten(msg.json);

            message_list.add(msg.flat[KEY_FIELD] || "event " + message_list.items.length);
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

message_viewer.on('keypress', function (ch, key) {
    if (key.name === 'left') {
        message_list.focus();
    }
});

message_list.on('select', function () {
    show_message(message_list.getScroll());
});

message_list.on('click', function () {
    show_message(message_list.getScroll());
});

message_list.on('focus', function () {
    message_list.style.border.fg = 'white';
});

message_list.on('blur', function () {
    message_list.style.border.fg = 'gray';
});

message_viewer.on('focus', function () {
    message_viewer.style.border.fg = 'white';
});

message_viewer.on('blur', function () {
    message_viewer.style.border.fg = 'gray';
});

screen.append(message_list);
screen.append(message_viewer);
screen.append(stats_box);
screen.append(progress);
screen.append(footer);

message_list.focus();
message_list.select(0);

var prompt = blessed.box({
    parent: screen,
    shadow: true,
    left: 'center',
    top: 'center',
    width: 60,
    height: 17,
    border: 'line',
    draggable: true,
    label: 'Settings',
    hidden: true
});

var form = blessed.form({
    parent: prompt,
    keys: true,
    left: 0,
    top: 0,
    width: "100%-2",
    height: "100%-2"
});

var form_wrapper_max_messages = blessed.box({
    top: 2,
    parent: form,
    width: "100%-2",
    height: 1,
    mouse: false,
    keys: false,
    focusable: false
})

var form_label_max_messages = blessed.text({
    parent: form_wrapper_max_messages,
    width: "30%",
    label: "Max messages: ",
    mouse: false,
    keys: false,
    focusable: false,
    shrink: true,
    left: 0
})

var form_input_max_messages = blessed.textbox({
    parent: form_wrapper_max_messages,
    name: "MAX_MESSAGES",
    value: "" + MAX_MESSAGES,
    width: "70%",
    inputOnFocus: true,
    right: 0,
    underline: true
})

var form_wrapper_key_field = blessed.box({
    top: 5,
    parent: form,
    width: "100%-2",
    height: 1

})

var form_label_key_field = blessed.text({
    parent: form_wrapper_key_field,
    width: "30%",
    label: "Key field: ",
    mouse: false,
    keys: false,
    focusable: false,
    shrink: true,
    left: 0
})

var form_input_key_field = blessed.textbox({
    parent: form_wrapper_key_field,
    name: "KEY_FIELD",
    value: "" + KEY_FIELD,
    width: "70%",
    cursor: {
        shape: "block",
        blink: true
    },
    inputOnFocus: true,
    right: 0,
    underline: true
})

form_input_key_field.on('focus', function () {
    form_input_key_field.style.bg = ui_theme.highlight;
    form_input_key_field.enableInput();
});

form_input_key_field.on('blur', function () {
    form_input_key_field.style.bg = 'black';
});

form_input_max_messages.on('focus', function () {
    form_input_max_messages.style.bg = ui_theme.highlight;
});

form_input_max_messages.on('blur', function () {
    form_input_max_messages.style.bg = 'black';
});

var submit = blessed.button({
    parent: form,
    mouse: true,
    keys: true,
    shrink: true,
    padding: {
        left: 1,
        right: 1
    },
    left: "50%-10",
    bottom: 2,
    name: 'submit',
    content: 'ok',
    border: {
        type: "line",
        fg: "white",
        bg: ui_theme.button
    },
    style: {
        bg: ui_theme.button,
        fg: 'white',
        focus: {
            bg: ui_theme.highlight
        },
        hover: {
            bg: ui_theme.highlight
        }
    }
});

var cancel = blessed.button({
    parent: form,
    mouse: true,
    keys: true,
    shrink: true,
    padding: {
        left: 1,
        right: 1
    },
    left: "50%",
    bottom: 2,
    shrink: true,
    name: 'cancel',
    content: 'cancel',
    border: {
        type: "line",
        fg: "white",
        bg: ui_theme.button
    },
    style: {
        bg: ui_theme.button,
        fg: 'white',
        focus: {
            bg: ui_theme.highlight
        },
        hover: {
            bg: ui_theme.highlight
        }
    }
});

submit.on('press', function () {
    form.submit();
    message_list.focus();
});

form.on('submit', function (data) {
    screen.log(data);
    MAX_MESSAGES = data['MAX_MESSAGES'];
    KEY_FIELD = data['KEY_FIELD'];
});

cancel.on('press', function () {
    //form.reset();s
    prompt.hidden = !prompt.hidden;
    message_list.focus();
});

form.on('submit', function (data) {
    prompt.hidden = !prompt.hidden;
    message_list.focus();
});

form.on('reset', function (data) {
    prompt.hidden = !prompt.hidden;
    message_list.focus();
});

screen.key('s', function () {
    if (prompt.hidden) {
        prompt.toggle();
        form.focus();
    }
});

screen.key('escape', function () {
    prompt.hidden = true;
    message_list.focus();
});

screen.key('r', function () {
    message_list.clearItems();
    stats.message_count = 0;
    stats.message_length_avg = 0;
    stats.messages_per_second = 0;
    stats.message_size_sum = 0;
    stats.message_count_t0 = 0;
    messages = [];
    message_viewer.setContent("");
});

screen.key('c', function () {
    message_list.clearItems();
    messages = [];
    message_viewer.content = "";
});

screen.key('q', function () {
    ws.close();
    
    screen.program.disableMouse();

    screen.destroy();
    process.exit(0);
    return screen.destroy();
});

var form_focusable = {
    "index": 0,
    "items": [
        form_input_max_messages,
        form_input_key_field,
        submit,
        cancel
    ]
};

var main_screen_focusable = [
    message_list,
    message_viewer
]

screen.key('tab', function () {

    if (!prompt.hidden) {

        form.focus();
    } else {
        main_screen_focusable[0].focus();
        main_screen_focusable.push(main_screen_focusable.shift());
    }

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
        "array": [1,2,3],
        "array_strings": ["one", "two", "three"],
        "blah2": {
            "aaa": "ááá",
            "cccc": "DDD"
        },
        "blah3": {
            "aaa": "👍",
            "cccc": "DDD"
        },
        "blah4": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "blah5": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "blah6": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "blah7": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "blah8": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "blah9": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "blah10": {
            "aaa": "bbb",
            "cccc": "DDD"
        },
        "blah11": {
            "aaa": "bbb",
            "cccc": "DDD"
        }
    }

    add_message(test_message);
});

process.on('SIGTERM', function () {
    console.info("Shutting down UI");
    ws.close();
    screen.program.disableMouse();
    screen.destroy();
    process.exit(0);
});

function humanize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes.toFixed(0) + ' B';
    }
    var units = si ?
        ['kB', 'MB', 'GB'] :
        ['KiB', 'MiB', 'GiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}

setInterval(function () {
    update_progress();

    stats.messages_per_second = stats.message_count - stats.message_count_t0;
    stats_box.content = ` {bold}${humanize(stats.message_length_avg)}{/bold} avg\t{bold}${stats.messages_per_second}{/bold} eps\t{bold}${humanize(stats.messages_per_second*stats.message_length_avg)}{/bold}/s`;
    stats.message_count_t0 = stats.message_count;
}, 500);
