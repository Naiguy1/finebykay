import { expect, test } from '@playwright/test';

test('carousel controls remain available across responsive layouts', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  await expect(carousel).toBeVisible();
  const first = await carousel.getAttribute('data-active-set');
  await page.getByRole('button', { name: 'Next signature set' }).click();
  await expect(carousel).not.toHaveAttribute('data-active-set', first!);
  await page.getByRole('button', { name: 'Previous signature set' }).click();
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await carousel.focus();
  await carousel.press('ArrowLeft');
  await expect(carousel).not.toHaveAttribute('data-active-set', first!);
  await carousel.press('ArrowRight');
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(carousel).toHaveAttribute('data-active-set', first!);
  await expect(page.getByRole('button', { name: 'Next signature set' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
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
