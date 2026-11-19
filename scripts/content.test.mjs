import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseSets, renderSetPage } from './content.mjs';

const source = `
- id: first-set
  name: A new name
  description: >-
    A line with a colon: and a second line.
    This stays one paragraph.
  category: Intricate Art
  image: /media/photo.jpg
  image_description: Visible nail details.
  tags:
    - Fine detail
`;
const parse = (value) => parseSets(value, { checkMedia: false });

test('editable names and folded paragraphs retain a permanent id', () => {
  const [set] = parse(source);
  assert.equal(set.id, 'first-set');
  assert.equal(set.title, 'A new name');
  assert.equal(set.description, 'A line with a colon: and a second line. This stays one paragraph.');
  assert.equal(set.alt, 'Visible nail details.');
  assert.equal(parse(source.replace('A new name', 'Another name'))[0].id, set.id);
});

test('reports duplicate IDs, malformed YAML, typoed fields, and missing text', () => {
  assert.throws(() => parse(source + source), /used twice/);
  assert.throws(() => parse('sets: ['), /YAML formatting/);
  assert.throws(() => parse(source.replace('description:', 'descripton:')), /Unknown field “descripton”/);
  assert.throws(() => parse(source.replace('  name: A new name\n', '')), /“name” must contain text/);
  assert.throws(() => parse(source.replace('Intricate Art', 'Intricate Arts')), /Choose a category/);
});

test('rejects external URLs, traversal, malformed escapes, and unsafe IDs', () => {
  for (const path of ['https://example.com/photo.jpg', '/media/../photo.jpg', '/media/%2e%2e/photo.jpg', '/media/photo.jpg?x=1', '/media/%ZZ.jpg']) {
    assert.throws(() => parse(source.replace('/media/photo.jpg', path)), /content\/sets.yaml/);
  }
  for (const id of ['../outside', 'Uppercase', 'two--hyphens', 'a/b']) {
    assert.throws(() => parse(source.replace('first-set', id)), /“id” may contain/);
  }
});

test('checks local media existence and accepts encoded spaces', () => {
  const root = mkdtempSync(join(tmpdir(), 'finebykay-content-'));
  try {
    mkdirSync(join(root, 'public/media'), { recursive: true });
    assert.throws(() => parseSets(source, { root }), /Photo or video not found/);
    writeFileSync(join(root, 'public/media/my photo.jpg'), 'test fixture');
    assert.equal(parseSets(source.replace('photo.jpg', 'my%20photo.jpg'), { root })[0].image, '/media/my%20photo.jpg');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('builds per-set metadata and a readable no-JavaScript fallback with safe escaping', () => {
  const [set] = parse(source);
  set.title = 'Art <script>alert("x")</script>';
  set.description = 'A "quoted" description & more.';
  const template = '<html><head><title>Old title</title><meta name="description" content="Old description"><meta property="og:title" content="Old title"><link rel="canonical" href="https://old.example/"></head><body><div id="root"></div><noscript>Old fallback</noscript><script type="module" src="/assets/app.js"></script></body></html>';
  const html = renderSetPage(template, set);
  assert.match(html, /https:\/\/nails\.bowerbanks\.com\/sets\/first-set\//);
  assert.match(html, /property="og:image" content="https:\/\/nails\.bowerbanks\.com\/media\/photo.jpg"/);
  assert.match(html, /name="twitter:image:alt" content="Visible nail details\."/);
  assert.match(html, /<noscript><main>/);
  assert.match(html, /Art &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /A &quot;quoted&quot; description &amp; more\./);
  assert.doesNotMatch(html, /Old title|Old description|Old fallback|https:\/\/old\.example/);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.match(html, /src="\/assets\/app\.js"/);
});

test('lookbook ordering is optional, positive, and unique without excluding carousel entries', () => {
  assert.equal(parse(source)[0].lookbookOrder, undefined);
  const featured = source.replace('  category:', '  lookbook_order: 2\n  category:');
  assert.equal(parse(featured)[0].lookbookOrder, 2);
  const unfeatured = source.replace('first-set', 'second-set');
  assert.equal(parse(featured + unfeatured).length, 2);
  for (const value of ['0', '-1', '1.5', '"1"', 'true', 'null']) {
    assert.throws(() => parse(featured.replace('lookbook_order: 2', `lookbook_order: ${value}`)), /positive whole number/);
  }
  assert.throws(() => parse(featured + featured.replace('first-set', 'second-set')), /must be unique/);
});
