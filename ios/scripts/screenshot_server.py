#!/usr/bin/env python3
"""Accept PUT /name.png from the simulator and write PNGs to an output dir."""

from __future__ import annotations

import argparse
import http.server
import os
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=47321)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_PUT(self) -> None:
            name = os.path.basename(self.path.split("?", 1)[0])
            if not name.endswith(".png") or "/" in name or name.startswith("."):
                self.send_error(400)
                return
            length = int(self.headers.get("Content-Length", "0"))
            data = self.rfile.read(length)
            (out / name).write_bytes(data)
            print(f"saved {name} ({len(data)} bytes)", flush=True)
            self.send_response(200)
            self.end_headers()

        def log_message(self, fmt: str, *args: object) -> None:
            sys.stderr.write("%s\n" % (fmt % args))

    server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"screenshot server on 127.0.0.1:{args.port} -> {out}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
