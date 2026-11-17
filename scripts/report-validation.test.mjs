import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publishValidation, validationSummary } from './report-validation.mjs';

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), 'finebykay-diagnostics-'));
  try { return run(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}

test('installation failures and unexecuted browser tests are distinct', () => fixture((directory) => {
  writeFileSync(join(directory, 'install.log'), 'npm error ERESOLVE: incompatible Vite peer dependency');
  const summary = validationSummary(directory, { REPORT_INSTALL: 'failure', REPORT_BROWSER: 'skipped' });
  assert.match(summary, /Dependency installation \| failure/);
  assert.match(summary, /Browser tests \| Not run/);
  assert.match(summary, /ERESOLVE: incompatible Vite peer dependency/);
  assert.match(summary, /browser.log[\s\S]*No log was produced/);
}));

test('full audit JSON and audit stderr are included alongside installation output', () => fixture((directory) => {
  writeFileSync(join(directory, 'dependency-audit.json'), JSON.stringify({ vulnerabilities: { example: { severity: 'high', range: '<2.0.0' } } }));
  writeFileSync(join(directory, 'dependency-audit-error.log'), 'Audit service warning');
  const summary = validationSummary(directory, { REPORT_INSTALL: 'success', REPORT_AUDIT: 'failure' });
  assert.match(summary, /Full dependency audit \| failure/);
  assert.match(summary, /"example"/);
  assert.match(summary, /"severity":"high"/);
  assert.match(summary, /Audit service warning/);
}));

test('diagnostics remain literal and bounded even when every log is large', () => fixture((directory) => {
  const names = ['install.log', 'dependency-audit.json', 'dependency-audit-error.log', 'production-audit.log', 'browser-install.log', 'content.log', 'lint.log', 'build.log', 'browser.log', 'container.log'];
  for (const name of names) writeFileSync(join(directory, name), 'x'.repeat(80000) + '\u001b[31m<script>```danger</script>&');
  const summary = validationSummary(directory, { REPORT_INSTALL: 'failure' });
  assert.ok(summary.length < 65535, `Summary must fit the Checks API limit: ${summary.length}`);
  assert.match(summary, /Earlier output omitted/);
  assert.match(summary, /&lt;script&gt;ˋˋˋdanger&lt;\/script&gt;&amp;/);
  assert.ok(!summary.includes(String.fromCharCode(27)));
  assert.doesNotMatch(summary, /<script>/);
}));

const environment = {
  GITHUB_TOKEN: 'test-only-token',
  GITHUB_REPOSITORY: 'owner/repository',
  REPORT_SHA: 'a'.repeat(40),
  REPORT_STATUS: 'failure',
  REPORT_INSTALL: 'failure',
  REPORT_BROWSER: 'skipped',
  GITHUB_RUN_ID: '123',
};

test('publishing preserves the failed result and uses the supplied full commit SHA', async () => {
  let request;
  await publishValidation(environment, async (url, options) => {
    request = { url, options, payload: JSON.parse(options.body) };
    return { ok: true };
  });
  assert.equal(request.url, 'https://api.github.com/repos/owner/repository/check-runs');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.payload.head_sha, environment.REPORT_SHA);
  assert.equal(request.payload.conclusion, 'failure');
  assert.match(request.payload.output.summary, /Browser tests \| Not run/);
  assert.equal(request.payload.details_url, 'https://github.com/owner/repository/actions/runs/123');
  assert.ok(!request.payload.output.summary.includes(environment.GITHUB_TOKEN));
});

test('publishing does not hide API or configuration failures', async () => {
  await assert.rejects(publishValidation(environment, async () => ({ ok: false, status: 403 })), /HTTP 403/);
  await assert.rejects(publishValidation({ ...environment, REPORT_SHA: 'short-sha' }, async () => { throw new Error('Must not request'); }), /full commit SHA/);
});
