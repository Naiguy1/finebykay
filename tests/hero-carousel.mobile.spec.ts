import { expect, test } from '@playwright/test';
import type { CDPSession, Locator, Page } from '@playwright/test';
import { heroSets } from '../src/data/portfolio';

type Point = { x: number; y: number; id?: number };

async function drag(session: CDPSession, start: Point, end: Point, cancel = false) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  for (let index = 1; index <= 10; index++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x + (end.x - start.x) * index / 10, y: start.y + (end.y - start.y) * index / 10 }],
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
}

async function swipeArea(page: Page, carousel: Locator) {
  await carousel.scrollIntoViewIfNeeded();
  const box = (await carousel.boundingBox())!;
  // Stay above the lookbook link, within the visible middle card.
  return { x: page.viewportSize()!.width / 2, y: box.y + 110 };
}

test('touch swipes cycle and wrap in both directions with reduced motion', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const session = await context.newCDPSession(page);
  const point = await swipeArea(page, carousel);
  const startY = await page.evaluate(() => scrollY);
  for (let index = 1; index <= heroSets.length; index++) {
    await drag(session, { x: point.x + 70, y: point.y }, { x: point.x - 70, y: point.y });
    await expect(carousel).toHaveAttribute('data-active-set', heroSets[(2 + index) % heroSets.length].id);
  }
  for (let index = 1; index <= heroSets.length; index++) {
    await drag(session, { x: point.x - 70, y: point.y }, { x: point.x + 70, y: point.y });
    await expect(carousel).toHaveAttribute('data-active-set', heroSets[(2 - index + heroSets.length) % heroSets.length].id);
  }
  expect(await page.evaluate(() => scrollY)).toBe(startY);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await expect(carousel.locator('[aria-live="polite"]')).toContainText(heroSets[2].title);
});

test('swipes settle on the next card with motion enabled', async ({ page, context }) => {
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const session = await context.newCDPSession(page);
  const point = await swipeArea(page, carousel);
  await drag(session, { x: point.x + 70, y: point.y }, { x: point.x - 70, y: point.y });
  await expect(carousel).toHaveAttribute('data-active-set', heroSets[3].id);
  await expect.poll(async () => {
    const box = (await carousel.locator('.carousel-card').nth(3).boundingBox())!;
    return Math.abs(box.x + box.width / 2 - page.viewportSize()!.width / 2);
  }).toBeLessThan(2);
});

test('vertical and diagonal touch gestures scroll the page without rotating the carousel', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const session = await context.newCDPSession(page);
  const first = await carousel.getAttribute('data-active-set');
  for (const horizontal of [0, 60]) {
    const point = await swipeArea(page, carousel);
    const startY = await page.evaluate(() => scrollY);
    await drag(session, { x: point.x, y: point.y + 80 }, { x: point.x - horizontal, y: point.y - 80 });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(startY + 30);
    await expect(carousel).toHaveAttribute('data-active-set', first!);
  }
});

test('short, cancelled, and multi-touch gestures do not advance; fresh swipes still work', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const session = await context.newCDPSession(page);
  const point = await swipeArea(page, carousel);
  const first = await carousel.getAttribute('data-active-set');
  await drag(session, point, { x: point.x - 20, y: point.y });
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await drag(session, { x: point.x + 70, y: point.y }, { x: point.x - 70, y: point.y }, true);
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  const fingers = [{ x: point.x + 70, y: point.y, id: 0 }, { x: point.x + 70, y: point.y + 50, id: 1 }];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: fingers });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: fingers.map((finger) => ({ ...finger, x: finger.x - 100 })) });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await drag(session, { x: point.x + 70, y: point.y }, { x: point.x - 70, y: point.y });
  await expect(carousel).toHaveAttribute('data-active-set', heroSets[3].id);
});

test('touch tablets retain swipe navigation, native wheel behavior, and active set after resizing', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const session = await context.newCDPSession(page);
  const point = await swipeArea(page, carousel);
  await drag(session, { x: point.x + 80, y: point.y }, { x: point.x - 80, y: point.y });
  await expect(carousel).toHaveAttribute('data-active-set', heroSets[3].id);
  const native = await carousel.evaluate((element) => element.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true })));
  expect(native).toBeTruthy();
  await expect(carousel).toHaveAttribute('data-active-set', heroSets[3].id);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(carousel).toHaveAttribute('data-active-set', heroSets[3].id);
  await expect.poll(async () => {
    const box = (await carousel.locator('.carousel-card').nth(3).boundingBox())!;
    return Math.abs(box.x + box.width / 2 - page.viewportSize()!.width / 2);
  }).toBeLessThan(2);
  const button = page.getByRole('button', { name: 'Previous signature set' });
  const size = (await button.boundingBox())!;
  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);
  await button.click();
  await expect(carousel).toHaveAttribute('data-active-set', heroSets[2].id);
  await page.getByRole('link', { name: 'Scroll to the lookbook' }).tap();
  await expect(page).toHaveURL(/#work$/);
});
