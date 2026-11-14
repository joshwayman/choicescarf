import { expect, test, type Page } from '@playwright/test';

/**
 * Offline (#85): once loaded, the app works with no network, and a second
 * visit is served by the service worker instead of the network.
 */

const CALC = '/?v=1&t=garchomp&y=dragapult';

/** Loads the app and waits until the service worker controls the page. */
async function loadAndInstall(page: Page) {
  await page.goto(CALC);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first visit installs the worker; from the next load it serves the page.
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

function results(page: Page) {
  return page.getByRole('region', { name: /outspeeds/ });
}

test('works offline once loaded: reload, then a new calculation', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadAndInstall(page);

  await context.setOffline(true);
  await page.reload();
  await expect(results(page)).toContainText('Dragapult outspeeds 333 with');
  await expect(results(page)).toContainText('56 EVs');

  // Pick a different target with the search, still offline. Iron Bundle, base 136,
  // 31 IVs, 252 EVs, level 100: 2 × 136 + 31 + 63 + 5 = 371, then +Spe ×1.1 = 408.
  await page.getByRole('button', { name: 'Change Pokémon, now Garchomp' }).click();
  await page.getByRole('searchbox', { name: 'Search Pokémon' }).fill('iron bundle');
  await page.getByRole('option', { name: /^Iron Bundle/ }).click();
  await expect(results(page)).toContainText('Dragapult outspeeds 408 with');

  // Other routes come from the same cached page.
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1, name: 'About ChoiceScarf' })).toBeVisible();
});

test('shows sprites offline: the icon sheet up front, battle sprites once seen', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loadAndInstall(page);
  await expect(page.locator('img[src="/sprites/gen5/garchomp.png"]')).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  const loaded = (selector: string) =>
    page.locator(selector).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
  await expect.poll(() => loaded('img[src="/sprites/gen5/garchomp.png"]')).toBe(true);
  // The Pokémon icon sheet is a CSS background, so check the request is served.
  const sheet = await page.evaluate(async () => {
    const css = [...document.styleSheets].flatMap((s) => [...s.cssRules]).map((r) => r.cssText).join(' ');
    const url = /url\("?([^")]*pokemonicons-sheet[^")]*)"?\)/.exec(css)?.[1];
    return url === undefined ? 0 : (await fetch(url)).status;
  });
  expect(sheet).toBe(200);
});

/** Every response a page gets from the network (not the service worker), with its size. */
function recordNetwork(page: Page) {
  const pending: Promise<{ url: string; bytes: number }>[] = [];
  let all = 0;
  page.on('requestfinished', (request) => {
    // Analytics and error reporting (#86) are other sites and go to the network by design.
    if (new URL(request.url()).origin !== new URL(page.url() || 'http://localhost:4173').origin) return;
    all += 1;
    pending.push(
      (async () => {
        const response = await request.response();
        if (!response || response.fromServiceWorker()) return { url: '', bytes: -1 };
        const sizes = await request.sizes();
        return { url: request.url(), bytes: sizes.responseBodySize + sizes.responseHeadersSize };
      })(),
    );
  });
  return async () => ({ all, network: (await Promise.all(pending)).filter((r) => r.bytes >= 0) });
}

function report(label: string, network: { url: string; bytes: number }[], all: number) {
  const total = network.reduce((sum, r) => sum + r.bytes, 0);
  console.log(`${label}: ${String(total)} bytes over the network in ${String(network.length)} of ${String(all)} requests`);
  for (const r of network) console.log(`  ${String(r.bytes).padStart(7)} ${new URL(r.url).pathname}`);
  return total;
}

test('a second visit is served by the service worker, not the network', async ({ page, context }) => {
  const first = recordNetwork(page);
  await page.goto(CALC);
  await expect(results(page)).toContainText('56 EVs');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForLoadState('networkidle');
  const firstVisit = await first();
  report('First visit', firstVisit.network, firstVisit.all);

  const second = await context.newPage();
  const record = recordNetwork(second);
  await second.goto(CALC);
  await expect(results(second)).toContainText('56 EVs');
  await second.waitForLoadState('networkidle');
  const { all, network } = await record();
  const total = report('Second visit', network, all);

  expect(all).toBeGreaterThan(5);
  // Only the browser's check for a new service worker, and battle sprites
  // (cached when first seen), may go to the network.
  expect(network.map((r) => new URL(r.url).pathname).filter((p) => !/^\/sprites\/gen5\/|^\/sw\.js$/.test(p))).toEqual([]);
  expect(total).toBeLessThan(20_000);
});
