"""Check the built production container's HTTP behavior without third-party packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
import time
import re
from urllib.request import Request

BASE = "http://127.0.0.1:8080"
# Share expected values with the checked-in server policy; assert key protections
# separately in the Node security baseline tests.
EXPECTED = {}
for line in Path("config/security-headers.conf").read_text().splitlines():
    match = re.fullmatch(r'add_header ([A-Za-z-]+) (.+) always;', line)
    if match:
        EXPECTED[match[1]] = match[2].strip('"')



def request(path):
    try:
        return urlopen(BASE + path, timeout=3)
    except HTTPError as error:
        return error


def check_headers(response):
    assert response.headers.get("Access-Control-Allow-Origin") is None
    assert response.headers.get("Set-Cookie") is None
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

# Each share address must work on the real static server, without an SPA fallback.
set_pages = list(Path("dist/sets").glob("*/index.html"))
assert set_pages, "The production build must include individual set pages"
for page in set_pages:
    path = "/sets/" + page.parent.name + "/"
    with request(path) as response:
        assert response.status == 200, path
        check_headers(response)
        html = response.read().decode()
        assert f'content="https://nails.bowerbanks.com{path}"' in html, path
        assert 'property="og:image"' in html, path
        assert "Explore more work" in html, path

with request("/sets/not-a-published-set/") as response:
    assert response.status == 404
    check_headers(response)

with request("/missing-review-asset.js") as response:
    assert response.status == 404
    check_headers(response)

print("Production HTTP checks passed: home/set pages/assets/404 headers, sharing metadata, immutable caching, asset MIME types.")


# Legal/help pages must be real, script-free documents on the static server.
for slug in ("privacy", "terms", "cookies", "privacy-requests", "accessibility"):
    with request(f"/{slug}/") as response:
        assert response.status == 200
        check_headers(response)
        html = response.read().decode()
        assert '<script' not in html
        assert 'Draft for legal review' in html
        assert 'aria-label="Policies and help"' in html
for path in ('/.env', '/.git/config', '/content/sets.yaml', '/assets/private.key', '/api/account', '/missing-review-asset.js'):
    with request(path) as response:
        assert response.status == 404, path
        check_headers(response)
for method in ('POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE'):
    try:
        response = urlopen(Request(BASE + '/', method=method), timeout=3)
    except HTTPError as error:
        response = error
    with response:
        assert response.status == 405, method
        check_headers(response)
print("Privacy and hardening checks passed: policies, private files, absent APIs, read-only methods, no cookies/CORS.")
