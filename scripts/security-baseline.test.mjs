import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const walk = (path) => readdirSync(resolve(root, path), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(`${path}/${entry.name}`) : [`${path}/${entry.name}`]);

test('production licenses are permissive; tool-only exceptions are explicit', () => {
  const permissive = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'BlueOak-1.0.0', 'OFL-1.1']);
  const exceptions = new Map([
    ['argparse', 'Python-2.0'], // Build-only Python license, commercially usable with notices.
    ['caniuse-lite', 'CC-BY-4.0'], // Build-only compatibility dataset; retain attribution.
    ['lightningcss', 'MPL-2.0'], // Build-only file copyleft; no library shipped to browsers.
  ]);
  const lock = JSON.parse(read('package-lock.json'));
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path) continue;
    // npm records dependencies bundled inside an integrity-checked parent tarball
    // without separate resolved/integrity fields.
    const archive = entry.inBundle ? lock.packages[path.slice(0, path.lastIndexOf('/node_modules/'))] : entry;
    assert.ok(archive?.integrity?.startsWith('sha512-') || archive?.integrity?.startsWith('sha1-'), `Missing registry integrity: ${path}`);
    assert.ok(archive?.resolved?.startsWith('https://registry.npmjs.org/'), `Unexpected package origin: ${path}`);
    const name = path.split('node_modules/').at(-1);
    const exception = exceptions.get(name) ?? (name.startsWith('lightningcss-') ? 'MPL-2.0' : undefined);
    assert.ok(permissive.has(entry.license) || (entry.dev && entry.license === exception), `Review new license before use: ${path} (${entry.license})`);
  }
});

test('the static portfolio cannot silently acquire tracking or public environment secrets', () => {
  for (const path of walk('src').filter((name) => /\.(?:tsx?|css)$/.test(name))) {
    const source = read(path);
    assert.doesNotMatch(source, /import\.meta\.env|process\.env/, `Browser environment exposure: ${path}`);
    assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|sendBeacon\s*\(|document\.cookie|localStorage|sessionStorage|serviceWorker/, `Static privacy boundary changed: ${path}. Complete docs/feature-safety.md before replacing this guard.`);
    assert.doesNotMatch(source, /<(?:script|iframe|img|link|video|source)\b[^>]*(?:src|href)=["'](?:https?:)?\/\//, `Review remote resource: ${path}`);
  }
  for (const tag of read('index.html').match(/<(?:script|link|iframe|img)\b[^>]*>/gi) ?? []) {
    if (/rel="canonical"/.test(tag)) continue;
    assert.doesNotMatch(tag, /(?:src|href)="(?:https?:)?\/\//, `External resource connection: ${tag}`);
  }
  const headers = read('config/security-headers.conf');
  for (const directive of ["default-src 'none'", "script-src 'self'", "connect-src 'none'", "form-action 'none'", "frame-ancestors 'none'", "frame-src 'none'"]) assert.ok(headers.includes(directive), directive);
  assert.ok(headers.includes('Strict-Transport-Security'));
});

test('required policies, deletion workflow, and explicit review placeholders exist', () => {
  const pages = JSON.parse(read('content/legal.json'));
  for (const slug of ['privacy', 'terms', 'cookies', 'privacy-requests', 'accessibility']) {
    const page = pages.find((p) => p.slug === slug);
    assert.ok(page?.sections.length, slug);
  }
  const text = JSON.stringify(pages);
  for (const placeholder of ['[COMPANY NAME]', '[CONTACT EMAIL]', '[JURISDICTION]']) assert.ok(text.includes(placeholder));
  assert.ok(text.includes('Delete my data'));
  assert.ok(read('src/components/Contact.tsx').includes('<PolicyLinks />'));
});

test('alternative static host retains the same response policy', () => {
  const caddy = read('config/Caddyfile.static');
  for (const match of read('config/security-headers.conf').matchAll(/^add_header ([A-Za-z-]+) (.+) always;$/gm)) {
    assert.ok(caddy.includes(`${match[1]} "${match[2].replace(/^"|"$/g, '')}"`), match[1]);
  }
});
