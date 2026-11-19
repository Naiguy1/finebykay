import { expect, test } from '@playwright/test';
import { lookbookSets } from '../src/data/portfolio';

const policies = ['privacy', 'terms', 'cookies', 'privacy-requests', 'accessibility'];

test('portfolio interactions make no third-party requests or tracking storage', async ({ page, context, baseURL }) => {
  const unexpected: string[] = [];
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) { unexpected.push(url.origin); return route.abort(); }
    if (!route.request().isNavigationRequest() && !/^\/(?:assets|media)\//.test(url.pathname) && url.pathname !== '/favicon.svg') unexpected.push(url.pathname);
    return route.continue();
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Next signature set' }).click();
  await page.getByRole('button', { name: `View ${lookbookSets[0].title}`, exact: true }).click();
  await page.getByRole('button', { name: 'Next set', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(unexpected).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  const footer = page.getByRole('navigation', { name: 'Policies and help' });
  for (const slug of policies) await expect(footer.locator(`a[href="/${slug}/"]`)).toHaveCount(1);
});

test('policies and request workflow work without JavaScript at 320px', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  for (const slug of policies) {
    const response = await page.goto(`${baseURL}/${slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByText('Draft for legal review.', { exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Policies and help' }).getByRole('link')).toHaveCount(5);
    await expect(page.locator('script, iframe, form')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
  await page.goto(`${baseURL}/privacy-requests/`);
  await expect(page.getByText(/Delete my data/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact @finebykay on Instagram (external site)' })).toHaveAttribute('href', 'https://instagram.com/finebykay');
  await context.close();
});

test('skip navigation and menu dismissal preserve keyboard focus', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  if (isMobile) {
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Work', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }
});

test('text tokens and photograph labels meet the requested contrast threshold', async ({ page }) => {
  await page.goto('/');
  const colors = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return Object.fromEntries(['--cream', '--linen', '--ink', '--muted', '--accent'].map((key) => [key, styles.getPropertyValue(key).trim()]));
  });
  const luminance = (hex: string) => {
    const rgb = hex.replace('#', '').match(/../g)!.map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const [a, b] of [['--ink', '--cream'], ['--muted', '--cream'], ['--muted', '--linen'], ['--accent', '--cream'], ['--cream', '--ink']]) {
    const values = [luminance(colors[a]), luminance(colors[b])].sort((x, y) => y - x);
    expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
  }
  const badge = page.locator('.photo-number').first();
  const label = await badge.evaluate((element) => { const s = getComputedStyle(element); return { color: s.color, background: s.backgroundColor, blend: s.mixBlendMode }; });
  expect(label).toEqual({ color: 'rgb(250, 246, 240)', background: 'rgb(30, 27, 24)', blend: 'normal' });
});
