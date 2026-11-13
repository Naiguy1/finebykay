import { expect, test } from '@playwright/test';

test('desktop wheel moves the carousel, reverses, and leaves page scrolling available', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop wheel enhancement only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  await carousel.scrollIntoViewIfNeeded();
  await carousel.hover();
  const startY = await page.evaluate(() => scrollY);
  const first = await carousel.getAttribute('data-active-set');
  const before = await carousel.locator('.carousel-card').nth(2).boundingBox();
  await page.mouse.wheel(0, 360);
  await expect(carousel).not.toHaveAttribute('data-active-set', first!);
  await expect.poll(async () => (await carousel.locator('.carousel-card').nth(2).boundingBox())!.x).toBeLessThan(before!.x - 100);
  expect(await page.evaluate(() => scrollY)).toBe(startY);
  await page.mouse.wheel(0, -360);
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await page.keyboard.press('Escape');
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(startY);

  await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded();
  await page.getByRole('heading', { level: 1 }).hover();
  const outsideY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(outsideY);
});

test('desktop buttons and keyboard loop through a complete sequence in both directions', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop wheel enhancement only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const first = await carousel.getAttribute('data-active-set');
  for (let index = 0; index < 5; index++) await page.getByRole('button', { name: 'Next signature set' }).click();
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await carousel.focus();
  for (let index = 0; index < 5; index++) await carousel.press('ArrowLeft');
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();

  const card = carousel.locator('.carousel-card').nth(2);
  const before = (await card.boundingBox())!.x;
  // Pinch/browser zoom gestures must not be cancelled by our wheel listener.
  const passesZoom = await carousel.evaluate((element) => element.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, ctrlKey: true, bubbles: true, cancelable: true })));
  expect(passesZoom).toBeTruthy();
  expect((await card.boundingBox())!.x).toBeCloseTo(before, 0);
});

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

test('desktop motion remains bounded under repeated wheel input and disables when resized', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop wheel enhancement only');
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  await carousel.scrollIntoViewIfNeeded();
  const before = (await carousel.locator('.carousel-card').nth(2).boundingBox())!.x;
  await carousel.hover();
  for (let index = 0; index < 15; index++) await page.mouse.wheel(0, 100);
  await expect.poll(async () => Math.abs((await carousel.locator('.carousel-card').nth(2).boundingBox())!.x - before)).toBeGreaterThan(30);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.setViewportSize({ width: 600, height: 800 });
  await expect(page.locator('.wheel-gallery')).toHaveCount(0);
  await expect(page.locator('.hero-strip .hero-card')).toHaveCount(5);
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
