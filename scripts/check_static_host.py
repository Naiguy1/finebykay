"""Check the built production container's HTTP behavior without third-party packages."""
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
import time

BASE = "http://127.0.0.1:8080"
EXPECTED = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
}


def request(path):
    try:
        return urlopen(BASE + path, timeout=3)
    except HTTPError as error:
        return error


def check_headers(response):
    for name, expected in EXPECTED.items():
        assert response.headers.get(name) == expected, (response.url, name, dict(response.headers))


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        path = attrs.get("src") if tag == "script" else attrs.get("href") if tag == "link" and attrs.get("rel") == "stylesheet" else None
        if path and path.startswith("/assets/"):
            self.paths.append(path)


for attempt in range(30):
    try:
        home = request("/")
        break
    except (URLError, TimeoutError):
        if attempt == 29:
            raise
        time.sleep(1)

with home:
    assert home.status == 200
    check_headers(home)
    parser = Assets()
    parser.feed(home.read().decode())

assert parser.paths, "Production HTML must reference compiled assets"
for path in parser.paths:
    with request(path) as response:
        assert response.status == 200, path
        check_headers(response)
        cache = ",".join(response.headers.get_all("Cache-Control", []))
        assert "immutable" in cache and "max-age=31536000" in cache, cache
        assert "text/html" not in response.headers.get("Content-Type", ""), path
        assert response.read(64), path

with request("/missing-review-asset.js") as response:
    assert response.status == 404
    check_headers(response)

print("Production HTTP checks passed: HTML/assets/404 headers, immutable caching, asset MIME types.")
