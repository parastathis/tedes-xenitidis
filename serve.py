"""Static preview server with HTTP Range support.

The default PowerShell/HttpListener preview server returns whole files and no
Accept-Ranges header, so <video>.currentTime seeking silently fails — which is
exactly what the scroll-scrubbed hero needs. This adds byte-range handling plus
correct Greek-safe UTF-8 content types.

    python serve.py [port]
"""
import os
import re
import sys
import mimetypes
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))

TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg":  "image/svg+xml",
    ".webp": "image/webp",
    ".jpg":  "image/jpeg",
    ".png":  "image/png",
    ".mp4":  "video/mp4",
    ".xml":  "application/xml; charset=utf-8",
    ".txt":  "text/plain; charset=utf-8",
    ".md":   "text/plain; charset=utf-8",
}

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


class RangeHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def translate_path(self, path):
        path = path.split("?", 1)[0].split("#", 1)[0]
        from urllib.parse import unquote
        rel = unquote(path).lstrip("/")
        full = os.path.normpath(os.path.join(ROOT, rel))
        if not full.startswith(ROOT):          # no traversal out of the project
            return ROOT
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        return full

    def guess_type(self, path):
        return TYPES.get(os.path.splitext(path)[1].lower()) \
            or mimetypes.guess_type(path)[0] or "application/octet-stream"

    def do_HEAD(self):
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            self.send_error(404, "Not found")
            return
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Length", str(os.path.getsize(path)))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            self.send_error(404, "Not found")
            return

        size = os.path.getsize(path)
        ctype = self.guess_type(path)
        rng = self.headers.get("Range")
        m = RANGE_RE.match(rng or "")

        if m:
            start_s, end_s = m.group(1), m.group(2)
            if start_s == "":                          # suffix range: bytes=-N
                length = min(int(end_s or 0), size)
                start, end = size - length, size - 1
            else:
                start = int(start_s)
                end = int(end_s) if end_s else size - 1
            end = min(end, size - 1)
            if start > end or start >= size:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{size}")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            with open(path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(64 * 1024, remaining))
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                    except (BrokenPipeError, ConnectionAbortedError):
                        return
                    remaining -= len(chunk)
            return

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        with open(path, "rb") as f:
            while True:
                chunk = f.read(64 * 1024)
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionAbortedError):
                    return

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8909
    print(f"Serving {ROOT} on http://localhost:{port}/ (Range enabled)", flush=True)
    # Threading is required: HTTP/1.1 keep-alive on a single-threaded server
    # blocks every request after the first.
    srv = ThreadingHTTPServer(("127.0.0.1", port), RangeHandler)
    srv.daemon_threads = True
    srv.serve_forever()
