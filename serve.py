"""Tiny dev server for the German app. Disables caching so edits always show up.
Run:  python serve.py   then open http://localhost:8420
"""
import http.server, socketserver, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

# ThreadingTCPServer, not plain TCPServer: a browser holds several keep-alive
# connections open at once (including the service worker), and a single-
# threaded server stalls on every other request once that happens.
socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer.daemon_threads = True
with socketserver.ThreadingTCPServer(("", int(os.environ.get("PORT", 8420))), NoCache) as s:
    print("Serving on http://localhost:%s  (Ctrl+C to stop)" % os.environ.get("PORT", 8420))
    s.serve_forever()
