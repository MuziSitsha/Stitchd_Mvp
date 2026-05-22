from __future__ import annotations

import argparse
import mimetypes
import subprocess
import sys
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WEB_ROOT = PROJECT_ROOT / "build" / "web"
DEFAULT_API_BASE_URL = "http://127.0.0.1:3002/api/v1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build and serve the Flutter web bundle with no-cache headers.",
    )
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to.")
    parser.add_argument("--port", type=int, default=8082, help="Port to bind to.")
    parser.add_argument(
        "--web-root",
        type=Path,
        default=DEFAULT_WEB_ROOT,
        help="Directory containing the built Flutter web bundle.",
    )
    parser.add_argument(
        "--api-base-url",
        default=DEFAULT_API_BASE_URL,
        help="Value passed to STITCHD_API_BASE_URL during the build step.",
    )
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Serve the existing build/web output without rebuilding first.",
    )
    return parser.parse_args()


def build_web(api_base_url: str) -> None:
    command = [
        "puro",
        "flutter",
        "build",
        "web",
        f"--dart-define=STITCHD_API_BASE_URL={api_base_url}",
    ]
    print("Running:", " ".join(command))
    subprocess.run(command, cwd=PROJECT_ROOT, check=True)


def create_handler(web_root: Path) -> type[SimpleHTTPRequestHandler]:
    class NoCacheFlutterHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(web_root), **kwargs)

        def end_headers(self) -> None:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            super().end_headers()

        def do_GET(self) -> None:
            request_path = self.translate_path(self.path)
            request_file = Path(request_path)
            if request_file.exists() and request_file.is_file():
                return super().do_GET()

            if Path(self.path).suffix:
                self.send_error(404, "File not found")
                return

            self.path = "/index.html"
            super().do_GET()

        def guess_type(self, path: str) -> str:
            if path.endswith(".wasm"):
                return "application/wasm"
            return mimetypes.guess_type(path)[0] or "application/octet-stream"

        def log_message(self, format: str, *args) -> None:
            sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")

    return NoCacheFlutterHandler


def main() -> int:
    args = parse_args()
    web_root = args.web_root.resolve()

    if not args.skip_build:
        build_web(args.api_base_url)

    if not web_root.exists():
        print(f"Web root does not exist: {web_root}", file=sys.stderr)
        return 1

    handler = create_handler(web_root)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    server.allow_reuse_address = True

    print(f"Serving fresh Flutter web build from {web_root}")
    print(f"Preview URL: http://{args.host}:{args.port}/")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping preview server.")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())