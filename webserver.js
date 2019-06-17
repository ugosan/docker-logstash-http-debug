var http = require('http');
var WebSocketServer = require('ws').Server;
var WebSocket = require('ws');

var wss = new WebSocketServer({
    port: 8081
});

var server = http.createServer(function (req, res) {

    //console.info(req.method);
    if (req.method == 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {

            //console.log(body);
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(body);
                }
            });
            res.end('ok');

        });
    }

    var body = 'ok';
    var content_length = body.length;
    res.writeHead(200, {
        'Content-Length': content_length,
        'Content-Type': 'text/plain'
    });

    res.end(body);
});
server.listen(9000);
console.log('Server is accepting messages on port 9000');

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