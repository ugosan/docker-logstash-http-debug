from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import json

hostName = "0.0.0.0"
hostPort = 9000

class MyServer(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_POST(self):
        self._set_headers()
        print("Length: %s bytes"%self.headers['content-length'])
        content_len = int(self.headers['content-length'])
        post_body = self.rfile.read(content_len).decode('utf-8')

        print(json.dumps(json.loads(post_body), indent=2, sort_keys=True))
        

myServer = HTTPServer((hostName, hostPort), MyServer)
print(time.asctime(), "Server Starts - %s:%s" % (hostName, hostPort))

try:
    myServer.serve_forever()
except KeyboardInterrupt:
    pass

myServer.server_close()
print(time.asctime(), "Server Stops - %s:%s" % (hostName, hostPort))
