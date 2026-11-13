import { expect, test } from '@playwright/test';

test('a card clicked as its filter exits cannot open an invalid lightbox', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#work');
  await expect(page.getByRole('button', { name: 'View Merlot muse' })).toBeVisible();

  // Keep the rapid interaction in one browser task so automation does not wait
  // for the exiting card's animation to finish before sending its click.
  await page.evaluate(() => {
    const card = document.querySelector<HTMLButtonElement>('[aria-label="View Merlot muse"]');
    const filter = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-button')).find((button) => button.textContent === 'Natural Nails');
    if (!card || !filter) throw new Error('Expected gallery controls were not found');
    filter.click();
    card.click();
  });

  await expect(page.getByRole('button', { name: 'Natural Nails', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.portfolio-card')).toHaveCount(2);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'View Soft light', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Soft light');
  expect(errors).toEqual([]);
});

test('zoomed images support keyboard panning without changing the set', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  await page.getByRole('button', { name: 'View A study in petals', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const viewport = dialog.getByRole('region', { name: 'Zoomed image. Use arrow keys to pan.' });
  await expect(viewport).toBeFocused();
  await viewport.press('ArrowRight');
  await viewport.press('ArrowDown');
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(dialog.getByRole('heading')).toHaveText('A study in petals');
  await dialog.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText('After hours');
});
