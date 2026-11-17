import { expect, test } from '@playwright/test';
import { portfolio } from '../src/data/portfolio';

const firstSet = portfolio[0];
const setPath = (id: string) => `/sets/${id}/`;
const productionUrl = (id: string) => `https://nails.bowerbanks.com${setPath(id)}`;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('every shared set has its own static preview before JavaScript executes', async ({ page, request }) => {
  for (const set of portfolio) {
    const response = await request.get(setPath(set.id));
    expect(response.status(), set.id).toBe(200);
    const html = await response.text();
    const metadata = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, 'text/html');
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        url: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
        text: document.body.textContent,
      };
    }, html);
    expect(metadata.title).toContain(set.title);
    expect(metadata.description).toBe(set.description);
    expect(metadata.canonical).toBe(productionUrl(set.id));
    expect(metadata.url).toBe(productionUrl(set.id));
    expect(metadata.image).toMatch(/^https:\/\/nails\.bowerbanks\.com\/media\//);
    expect(metadata.text).toContain(set.title);
    expect(metadata.text).toContain(set.description);
  }
});

test('a shared link survives reload and leads into the full lookbook', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(setPath(firstSet.id));
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
  await page.reload();
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
  await dialog.getByRole('button', { name: 'Explore more work', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.locator('.portfolio-card')).toHaveCount(portfolio.length);
  expect(errors).toEqual([]);
});

test('Back closes the reveal in one step, Forward restores the last viewed set, and focus returns', async ({ page }) => {
  await page.goto('/#work');
  const card = page.getByRole('button', { name: `View ${firstSet.title}`, exact: true });
  await card.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => scrollY);
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(page).toHaveURL(new RegExp(`${setPath(firstSet.id)}$`));
  await dialog.getByRole('button', { name: 'Next set', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText(portfolio[1].title);
  await expect(page).toHaveURL(new RegExp(`${setPath(portfolio[1].id)}$`));
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/#work$/);
  await expect(card).toBeFocused();
  expect(Math.abs(await page.evaluate(() => scrollY) - scrollBefore)).toBeLessThan(3);
  await page.goForward();
  await expect(dialog.getByRole('heading')).toHaveText(portfolio[1].title);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/#work$/);
});

test('native sharing receives the current set permanent link', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => { sessionStorage.setItem('shared-set', JSON.stringify(data)); },
    });
  });
  await page.goto(setPath(firstSet.id));
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Next set', exact: true }).click();
  await dialog.getByRole('button', { name: 'Share this set', exact: true }).click();
  const shared = await page.evaluate(() => JSON.parse(sessionStorage.getItem('shared-set') ?? '{}') as ShareData);
  expect(shared.url).toBe(productionUrl(portfolio[1].id));
  expect(shared.title).toContain(portfolio[1].title);
  await expect(dialog.getByRole('heading')).toHaveText(portfolio[1].title);
});

test('Forward during the closing animation restores a visible photograph', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#work');
  await page.getByRole('button', { name: `View ${firstSet.title}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
  // Respond to the closing state in the browser so a slow automation round trip
  // cannot accidentally let the whole close animation finish first.
  await page.evaluate(() => new Promise<void>((resolve) => {
    const dialog = document.querySelector('dialog')!;
    const observer = new MutationObserver(() => {
      if (!dialog.classList.contains('is-closing')) return;
      observer.disconnect();
      history.forward();
      resolve();
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['class'] });
    history.back();
  }));
  await expect(page).toHaveURL(new RegExp(`${setPath(firstSet.id)}$`));
  await expect(dialog).not.toHaveClass(/is-closing/);
  await expect(dialog.locator('.lightbox-media img')).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('Forward preserves a filtered collection and repeated close requests traverse once', async ({ page }) => {
  const naturalSets = portfolio.filter((set) => set.category === 'Natural Nails');
  await page.goto('/#about');
  await page.goto('/#work');
  await page.getByRole('button', { name: 'Natural Nails', exact: true }).click();
  await page.getByRole('button', { name: `View ${naturalSets[0].title}`, exact: true }).click();
  await page.getByRole('button', { name: 'Close lookbook', exact: true }).evaluate((element) => {
    (element as HTMLButtonElement).click();
    (element as HTMLButtonElement).click();
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/#work$/);
  await page.goForward();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(naturalSets[0].title);
  await dialog.getByRole('button', { name: 'Next set', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText(naturalSets[1 % naturalSets.length].title);
});

test('cancelling native sharing keeps the set open without copying a link', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => { throw new DOMException('User dismissed the share sheet', 'AbortError'); },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { sessionStorage.setItem('copied-set', 'unexpected'); } },
    });
  });
  await page.goto(setPath(firstSet.id));
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Share this set', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
  expect(await page.evaluate(() => sessionStorage.getItem('copied-set'))).toBeNull();
  await expect(dialog.getByRole('status')).not.toContainText(/unavailable|failed|copied/i);
});

test('Copy link copies the permanent address and announces success', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value: string) => { sessionStorage.setItem('copied-set', value); } },
    });
  });
  await page.goto(setPath(firstSet.id));
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Copy link', exact: true }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('copied-set'))).toBe(productionUrl(firstSet.id));
  await expect(dialog.getByRole('status')).toContainText('Link copied');
});

test('native sharing failure exposes a usable link and leaves copying available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => { throw new Error('Share target unavailable'); },
    });
  });
  await page.goto(setPath(firstSet.id));
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Share this set', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Link to this set', exact: true })).toHaveValue(productionUrl(firstSet.id));
  await expect(dialog.getByRole('button', { name: 'Copy link', exact: true })).toBeEnabled();
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
});

test('blocked clipboard access still leaves a selectable permanent link', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new DOMException('Clipboard denied', 'NotAllowedError'); } },
    });
  });
  await page.goto(setPath(firstSet.id));
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Copy link', exact: true }).click();
  const field = dialog.getByRole('textbox', { name: 'Link to this set', exact: true });
  await expect(field).toHaveValue(productionUrl(firstSet.id));
  await expect(field).toHaveAttribute('readonly', '');
  await field.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
});

test('a carousel photograph opens its matching set with keyboard focus restored on close', async ({ page, isMobile }) => {
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Signature nail sets' });
  await carousel.scrollIntoViewIfNeeded();
  const region = (await carousel.boundingBox())!;
  const point = { x: page.viewportSize()!.width / 2, y: region.y + 150 };
  const id = await carousel.getAttribute('data-active-set');
  const set = portfolio.find((item) => item.id === id)!;
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(set.title);
  await expect(page).toHaveURL(new RegExp(`${setPath(set.id)}$`));
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(await carousel.evaluate((element) => element.contains(document.activeElement))).toBeTruthy();
});

test('reduced motion removes expanding image movement while preserving navigation', async ({ page }) => {
  await page.goto('/#work');
  await page.getByRole('button', { name: `View ${firstSet.title}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(firstSet.title);
  const movingTransforms = await dialog.evaluate((element) => element.getAnimations({ subtree: true }).filter((animation) => {
    const effect = animation.effect;
    return effect instanceof KeyframeEffect && Number(effect.getTiming().duration) > 100 && effect.getKeyframes().some((frame) => frame.transform && frame.transform !== 'none');
  }).length);
  expect(movingTransforms).toBe(0);
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText(portfolio[1].title);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
