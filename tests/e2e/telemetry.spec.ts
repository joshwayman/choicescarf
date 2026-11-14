import { expect, test, type Page, type Request } from '@playwright/test';

/**
 * Analytics and error reporting (#86): they never block the app, and
 * nothing they are sent includes the calculation, which is in the URL.
 * The e2e build has placeholder ids (playwright.config.ts).
 */

const THIRD_PARTY = /googletagmanager\.com|google-analytics\.com|sentry\.io/;

/** Blocks Google Analytics and Sentry, recording what was about to be sent. */
async function blockTelemetry(page: Page) {
  const sent: string[] = [];
  const record = (request: Request) => {
    sent.push(`${request.url()} ${request.postData() ?? ''}`);
  };
  await page.route(THIRD_PARTY, async (route) => {
    record(route.request());
    await route.abort('blockedbyclient');
  });
  return sent;
}

test('works the same with Google Analytics and Sentry blocked', async ({ page }) => {
  const sent = await blockTelemetry(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/?v=1&t=garchomp&y=dragapult');
  const results = page.getByRole('region', { name: /outspeeds/ });
  await expect(results).toContainText('56 EVs');
  await page.getByRole('button', { name: 'Change Pokémon, now Garchomp' }).first().click();
  await page.getByRole('searchbox', { name: 'Search Pokémon' }).fill('iron bundle');
  await page.getByRole('option', { name: /^Iron Bundle/ }).click();
  await expect(results).toContainText('Dragapult outspeeds 408 with');

  // Both were tried (so the test means something), and neither broke the page.
  await expect.poll(() => sent.some((s) => s.includes('googletagmanager.com/gtag/js?id=G-E2ETEST'))).toBe(true);
  expect(errors).toEqual([]);
  expect(sent.join('\n')).not.toMatch(/garchomp|dragapult|ironbundle|v=1/i);
});

test('sends page views to Google Analytics by path only', async ({ page }) => {
  await blockTelemetry(page);
  await page.goto('/?v=1&t=garchomp&y=dragapult');
  await expect(page.getByRole('region', { name: /outspeeds/ })).toContainText('56 EVs');
  await page.goto('/about?v=1&t=garchomp&y=dragapult');
  await expect(page.getByRole('heading', { level: 1, name: 'About ChoiceScarf' })).toBeVisible();

  const layer = await page.evaluate(() => JSON.stringify((window.dataLayer ?? []).map((e) => Array.from(e as ArrayLike<unknown>))));
  expect(layer).toContain('"page_view"');
  expect(layer).toContain('"page_path":"/about"');
  expect(layer).not.toMatch(/garchomp|dragapult|v=1/);
});
