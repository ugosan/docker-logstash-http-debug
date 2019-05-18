from http.server import BaseHTTPRequestHandler, HTTPServer
from pygments import highlight, lexers, formatters
import time
import json
from socketserver import ThreadingMixIn
from http.server import SimpleHTTPRequestHandler, HTTPServer

import queue

q = queue.Queue()

hostName = "0.0.0.0"
hostPort = 9000

total_messages = 0
total_bytes = 0

class MyServer(BaseHTTPRequestHandler):

    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_POST(self):
        global total_messages
        global total_bytes
        self._set_headers()
        content_len = int(self.headers['content-length'])
        total_messages += 1
        total_bytes += content_len

        print(f'#{total_messages} | {content_len} bytes | Avg: {int(total_bytes/total_messages)}')
        
        post_body = self.rfile.read(content_len).decode('utf-8')

        formatted_json = json.dumps(json.loads(post_body), indent=2, sort_keys=True)
        colorful_json = highlight(formatted_json, lexers.JsonLexer(), formatters.TerminalFormatter())
        print(colorful_json)

class ThreadingSimpleServer(ThreadingMixIn, HTTPServer):
    pass

def start(_queue=None):     
    global queue
    queue = _queue
    myServer = ThreadingSimpleServer((hostName, hostPort), MyServer)
    #print(time.asctime(), f'Server Starts - {hostName}:{hostPort}')

    try:
        myServer.serve_forever()
    except KeyboardInterrupt:
        pass

    myServer.server_close()
    #print(time.asctime(), f'Server Stops - {hostName}:{hostPort}')
