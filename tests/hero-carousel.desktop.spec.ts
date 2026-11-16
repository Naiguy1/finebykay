import { expect, test } from '@playwright/test';
import { portfolio } from '../src/data/portfolio';

test('desktop wheel moves the carousel, reverses, and leaves page scrolling available', async ({ page }) => {  await page.emulateMedia({ reducedMotion: 'reduce' });
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

test('desktop buttons and keyboard loop through a complete sequence in both directions', async ({ page }) => {  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const first = await carousel.getAttribute('data-active-set');
  const initial = portfolio.findIndex((set) => set.id === first);
  expect(initial).toBeGreaterThanOrEqual(0);
  const seen = new Set<string>();
  for (let index = 1; index <= portfolio.length; index++) {
    await page.getByRole('button', { name: 'Next signature set' }).click();
    const expected = portfolio[(initial + index) % portfolio.length];
    await expect(carousel).toHaveAttribute('data-active-set', expected.id);
    const image = carousel.locator(`.carousel-card img[src="${expected.image}"]`).first();
    await expect.poll(() => image.evaluate((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBeTruthy();
    seen.add(expected.id);
  }
  expect(seen.size).toBe(portfolio.length);
  await carousel.focus();
  for (let index = 1; index <= portfolio.length; index++) {
    await carousel.press('ArrowLeft');
    await expect(carousel).toHaveAttribute('data-active-set', portfolio[(initial - index + portfolio.length) % portfolio.length].id);
  }
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();

  const activeBeforeZoomGesture = await carousel.getAttribute('data-active-set');
  // Pinch/browser zoom gestures must not be cancelled by our wheel listener.
  const passesZoom = await carousel.evaluate((element) => element.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, ctrlKey: true, bubbles: true, cancelable: true })));
  expect(passesZoom).toBeTruthy();
  await expect(carousel).toHaveAttribute('data-active-set', activeBeforeZoomGesture!);
});


test('desktop motion remains bounded and resizing releases wheel scrolling', async ({ page }) => {  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  await carousel.scrollIntoViewIfNeeded();
  const before = (await carousel.locator('.carousel-card').nth(2).boundingBox())!.x;
  await carousel.hover();
  for (let index = 0; index < 15; index++) await page.mouse.wheel(0, 100);
  await expect.poll(async () => Math.abs((await carousel.locator('.carousel-card').nth(2).boundingBox())!.x - before)).toBeGreaterThan(30);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.setViewportSize({ width: 600, height: 800 });
  await expect(page.locator('.wheel-gallery')).toHaveCount(0);
  await expect(carousel).toBeVisible();
  const active = await carousel.getAttribute('data-active-set');
  const native = await carousel.evaluate((element) => element.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true })));
  expect(native).toBeTruthy();
  await expect(carousel).toHaveAttribute('data-active-set', active!);
  await expect(page.getByRole('button', { name: 'Next signature set' })).toBeVisible();
});
