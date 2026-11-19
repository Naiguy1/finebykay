import { expect, test } from '@playwright/test';
import { lookbookSets } from '../src/data/portfolio';

const naturalSets = lookbookSets.filter((set) => set.category === 'Natural Nails');
const exitingSet = lookbookSets.find((set) => set.category !== 'Natural Nails')!;

test('a card clicked as its filter exits cannot open an invalid lightbox', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#work');
  await expect(page.getByRole('button', { name: `View ${exitingSet.title}` })).toBeVisible();

  // Keep the rapid interaction in one browser task so automation does not wait
  // for the exiting card's animation to finish before sending its click.
  await page.evaluate((title) => {
    const card = Array.from(document.querySelectorAll<HTMLButtonElement>('.portfolio-card')).find((button) => button.getAttribute('aria-label') === `View ${title}`);
    const filter = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-button')).find((button) => button.textContent === 'Natural Nails');
    if (!card || !filter) throw new Error('Expected gallery controls were not found');
    filter.click();
    card.click();
  }, exitingSet.title);

  await expect(page.getByRole('button', { name: 'Natural Nails', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.portfolio-card')).toHaveCount(naturalSets.length);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByRole('button', { name: `View ${lookbookSets[0].title}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText(lookbookSets[0].title);
  expect(errors).toEqual([]);
});

test('zoomed images support keyboard panning without changing the set', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  await page.getByRole('button', { name: `View ${lookbookSets[0].title}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const viewport = dialog.getByRole('region', { name: 'Zoomed image. Use arrow keys to pan.' });
  await expect(viewport).toBeFocused();
  await expect.poll(() => viewport.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeGreaterThan(0);
  await expect.poll(() => viewport.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
  // Send keys to the already-focused viewport without refocusing it between axes.
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(dialog.getByRole('heading')).toHaveText(lookbookSets[0].title);
  await dialog.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText(lookbookSets[1].title);
});
