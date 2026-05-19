#!/usr/bin/env python3
"""Simple HTTP server for visual companion brainstorm sessions."""
import http.server
import socketserver
import os
import json
import threading
import sys

PORT = 52341
PROJECT_DIR = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
SESSION_DIR = os.path.join(PROJECT_DIR, '.superpowers', 'brainstorm', 'session')

os.makedirs(SESSION_DIR, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SESSION_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/event':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            event_file = os.path.join(SESSION_DIR, 'events')
            with open(event_file, 'a') as f:
                f.write(post_data.decode('utf-8') + '\n')
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_response(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress logging

if __name__ == '__main__':
    server_info = {
        'type': 'server-started',
        'port': PORT,
        'url': f'http://localhost:{PORT}',
        'screen_dir': SESSION_DIR,
        'state_dir': SESSION_DIR
    }
    print(json.dumps(server_info))
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()