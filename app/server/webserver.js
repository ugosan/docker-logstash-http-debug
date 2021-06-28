var http = require('http');
var WebSocketServer = require('ws').Server;
var WebSocket = require('ws');

var wss = new WebSocketServer({
    port: 8081
});


var express = require('express');
var app = express();

app.post('/', function (req, res) {

    let data = '';
    req.on('data', chunk => {
        data += chunk;
    })
    req.on('end', () => {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });

        res.end();
    })

});

var server = app.listen(9000, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Server is listening at http://%s:%s", host, port)
})

process.on('SIGTERM', function () {
    console.info("\nShutting down Webserver...");
    server.close();
    process.exit(0);
});

process.on('SIGINT', function () {
    console.info("\nShutting down webserver...");
    server.close();
    process.exit(0);
});