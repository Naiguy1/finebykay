import assert from 'node:assert/strict';
import process from 'node:process';
import { URL } from 'node:url';
import { chromium } from '@playwright/test';

// Exercise real Nginx response headers; Vite preview has no production CSP.
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const failures = [];
  const violations = [];
  const external = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:8080') external.push(request.url());
  });
  await page.exposeFunction('recordPolicyViolation', (directive) => violations.push(directive));
  await page.addInitScript(() => {
    globalThis.document.addEventListener('securitypolicyviolation', (event) => {
      globalThis.recordPolicyViolation(event.effectiveDirective);
    });
  });
  const response = await page.goto('http://127.0.0.1:8080/');
  assert.equal(response.status(), 200);
  assert.ok(response.headers()['content-security-policy'].includes("connect-src 'none'"));
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByRole('button', { name: 'Next signature set' }).click();
  await page.locator('.portfolio-card').first().click();
  await page.getByRole('dialog').waitFor({ state: 'visible' });
  await page.waitForFunction(() => globalThis.document.querySelector('.lightbox-media img')?.naturalWidth > 0);
  await page.getByRole('button', { name: 'Next set', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('navigation', { name: 'Policies and help' }).getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await page.getByRole('heading', { name: 'Privacy Policy', exact: true }).waitFor();
  assert.deepEqual(await context.cookies(), []);
  assert.deepEqual(failures, [], 'Production browser errors');
  assert.deepEqual(violations, [], 'Production CSP violations');
  assert.deepEqual(external, [], 'Unexpected external requests');
  process.stdout.write('Production browser smoke passed under real CSP: carousel, detail view, local media, policies, no cookies/external requests.\n');
} finally {
  await browser.close();
}
