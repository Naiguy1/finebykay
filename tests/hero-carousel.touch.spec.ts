import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { portfolio } from '../src/data/portfolio';

// These dispatched events exercise both Chromium and WebKit's handler paths.
// The Chromium mobile suite separately sends trusted browser touch gestures.
async function pointer(page: Page, type: string, x: number, y: number, options: { id?: number; primary?: boolean; outside?: boolean } = {}) {
  await page.evaluate(({ type, x, y, options }) => {
    const target = options.outside ? document.body : document.elementFromPoint(x, y);
    if (!target) throw new Error('Missing pointer target');
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: options.id ?? 1,
      pointerType: 'touch', isPrimary: options.primary ?? true,
      clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1,
    }));
  }, { type, x, y, options });
}

async function surface(page: Page, carousel: Locator) {
  await carousel.scrollIntoViewIfNeeded();
  const box = (await carousel.boundingBox())!;
  const point = { x: page.viewportSize()!.width / 2, y: box.y + 150 };
  expect(await carousel.evaluate((region, point) => region.contains(document.elementFromPoint(point.x, point.y)), point)).toBeTruthy();
  return point;
}

test('quick down/up swipes work without an intermediate move, and dragging moves the cards', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const point = await surface(page, carousel);
  const first = await carousel.getAttribute('data-active-set');
  const initial = portfolio.findIndex((set) => set.id === first);
  await pointer(page, 'pointerdown', point.x + 70, point.y);
  await pointer(page, 'pointerup', point.x - 70, point.y);
  await expect(carousel).toHaveAttribute('data-active-set', portfolio[(initial + 1) % portfolio.length].id);

  const card = carousel.locator('.carousel-card').nth(initial + 1);
  const before = (await card.boundingBox())!;
  await pointer(page, 'pointerdown', point.x + 70, point.y);
  await pointer(page, 'pointermove', point.x - 30, point.y);
  await expect.poll(async () => (await card.boundingBox())!.x).toBeLessThan(before.x - 50);
  await pointer(page, 'pointerup', point.x - 70, point.y);
  await expect(carousel).toHaveAttribute('data-active-set', portfolio[(initial + 2) % portfolio.length].id);
  await expect(carousel.locator('[aria-live="polite"]')).toContainText(portfolio[(initial + 2) % portfolio.length].title);
});

test('interrupted, vertical, and multi-pointer gestures reset before the next swipe', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  const point = await surface(page, carousel);
  const first = await carousel.getAttribute('data-active-set');
  for (const end of ['pointercancel', 'lostpointercapture']) {
    await pointer(page, 'pointerdown', point.x + 70, point.y);
    await pointer(page, 'pointermove', point.x - 70, point.y);
    await pointer(page, end, point.x - 70, point.y);
    await pointer(page, 'pointerup', point.x - 70, point.y);
    await expect(carousel).toHaveAttribute('data-active-set', first!);
  }
  await pointer(page, 'pointerdown', point.x, point.y);
  await pointer(page, 'pointermove', point.x - 60, point.y + 100);
  await pointer(page, 'pointerup', point.x - 60, point.y + 100);
  await expect(carousel).toHaveAttribute('data-active-set', first!);

  await pointer(page, 'pointerdown', point.x + 70, point.y);
  await pointer(page, 'pointermove', point.x + 30, point.y);
  await pointer(page, 'pointerdown', 1, 1, { id: 2, primary: false, outside: true });
  await pointer(page, 'pointerup', point.x - 70, point.y);
  await pointer(page, 'pointerup', 1, 1, { id: 2, primary: false, outside: true });
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await pointer(page, 'pointerdown', point.x + 70, point.y);
  await pointer(page, 'pointerup', point.x - 70, point.y);
  await expect(carousel).not.toHaveAttribute('data-active-set', first!);
});
