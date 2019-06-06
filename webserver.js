var http = require('http');
var server = http.createServer(function (req, res) {

    console.info(req.method);
    if (req.method == 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', () => {
            console.log(body);
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