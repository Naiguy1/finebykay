import { expect, test } from '@playwright/test';
import { portfolio } from '../src/data/portfolio';

const naturalSets = portfolio.filter((set) => set.category === 'Natural Nails');

test('page renders local assets, anchors, and fits the viewport', async ({ page, isMobile }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nail Art by Kalisa');
  await page.getByRole('link', { name: 'Explore the Lookbook' }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('.portfolio-card')).toHaveCount(portfolio.length);
  for (const image of await page.locator('.portfolio-card img[loading="lazy"], .about-image img[loading="lazy"]').all()) await image.scrollIntoViewIfNeeded();
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'Say hello to @finebykay' })).toHaveAttribute('href', 'https://instagram.com/finebykay');
  await expect.poll(() => page.locator('img:not([loading="lazy"]), .portfolio-card img, .about-image img').evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize(isMobile ? { width: 390, height: 1000 } : { width: 1280, height: 1100 });
  await page.screenshot({ path: testInfo.outputPath(`review-${testInfo.project.name}.jpg`), type: 'jpeg', quality: 25, scale: 'css' });
  await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true });
});

test('filter, keyboard lightbox navigation, zoom, focus trap and restore', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  await page.getByRole('button', { name: 'Natural Nails', exact: true }).click();
  await expect(page.locator('.portfolio-card')).toHaveCount(naturalSets.length);
  const card = page.getByRole('button', { name: `View ${naturalSets[0].title}`, exact: true });
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close lookbook' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Zoom in', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close lookbook' })).toBeFocused();
  await expect(dialog.getByRole('heading')).toHaveText(naturalSets[0].title);
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText(naturalSets[1].title);
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Zoom out', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBeTruthy();
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
});

test('mobile navigation and reduced motion work', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Services', exact: true }).click();
    await expect(page).toHaveURL(/#services$/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  }
});
