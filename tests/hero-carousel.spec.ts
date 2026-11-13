import { expect, test } from '@playwright/test';

test('mobile and touch tablets retain the original gallery and native wheel behavior', async ({ page, isMobile, browser, baseURL }) => {
  if (isMobile) {
    await page.goto('/');
    await expect(page.locator('.hero-strip .hero-card')).toHaveCount(5);
    await expect(page.getByRole('region', { name: 'Signature nail sets' })).toHaveCount(0);
    const gallery = page.locator('.hero-gallery');
    const native = await gallery.evaluate((element) => element.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true })));
    expect(native).toBeTruthy();
  } else {
    const context = await browser.newContext({ baseURL, viewport: { width: 1100, height: 900 }, isMobile: true, hasTouch: true });
    const tablet = await context.newPage();
    await tablet.goto('/');
    await expect(tablet.locator('.hero-strip .hero-card')).toHaveCount(5);
    await expect(tablet.locator('.wheel-gallery')).toHaveCount(0);
    await context.close();
  }
});

test('the full headline fits at 320px with enlarged text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const heading = page.getByRole('heading', { level: 1 });
  await heading.evaluate((element) => { element.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`; });
  const bounds = await heading.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: innerWidth };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
});
