import { expect, PHONE, results, rows, test } from './fixtures.ts';

/**
 * The calculator flows #88 lists, in a real browser against the production
 * build. Expected numbers are worked out from the in-game formula, as in
 * docs/specs/rulesets.md, and match the unit tests.
 */

test.use({ viewport: PHONE });

test('an outspeed calculation, picking both Pokémon with the search', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Type a base Speed for both Pokémon' })).toBeVisible();

  // Target: Garchomp, base 102, +Spe 252 EVs: 2 × 102 + 31 + 63 + 5 = 303, ×1.1 = 333.
  await page.getByRole('button', { name: 'Choose Pokémon' }).click();
  await page.getByRole('searchbox', { name: 'Search Pokémon' }).fill('chomp');
  await page.getByRole('option', { name: 'Garchomp 102' }).click();

  // You: Dragapult, base 142. Neutral needs 334: 2 × 142 + 31 + 5 = 320, so 56 EVs (14 points).
  await page.getByRole('tab', { name: /^You/ }).click();
  await page.getByRole('button', { name: 'Choose Pokémon' }).click();
  await page.getByRole('searchbox', { name: 'Search Pokémon' }).fill('dragapult');
  await page.getByRole('option', { name: 'Dragapult 142' }).click();

  await expect(results(page).getByRole('heading')).toHaveText('Dragapult outspeeds 333 with');
  expect(await rows(page)).toEqual([
    ['0 EVs', '352'],
    ['56 EVs', '334'],
    ['208 EVs', '334'],
  ]);
  await expect(page).toHaveURL(/\?v=1&t=garchomp&y=dragapult$/);
});

test('the Scarf fallback: Garchomp needs a Choice Scarf to outspeed 421', async ({ page }) => {
  // Dragapult +Spe 252: 2 × 142 + 31 + 63 + 5 = 383, ×1.1 = 421. Garchomp tops out at 333, so it
  // needs a Scarf. +Spe with 68 EVs: 2 × 102 + 31 + 17 + 5 = 257, ×1.1 = 282, ×1.5 = 423.
  await page.goto('/?v=1&t=dragapult&y=garchomp');
  await expect(results(page).getByRole('heading')).toHaveText('Garchomp needs a Choice Scarf to outspeed 421');
  expect(await rows(page)).toEqual([
    ['68 EVs', '423'],
    ['168 EVs', '423'],
    ['Can’t reach', '—'],
  ]);
});

test('a Trick Room calculation: Garganacl underspeeds Kingambit with up to 72 EVs', async ({ page }) => {
  await page.goto('/?v=1&t=kingambit&y=garganacl');
  await expect(results(page).getByRole('heading')).toHaveText('Garganacl needs a Choice Scarf to outspeed 218');

  await page.getByRole('button', { name: 'Add Field' }).click();
  const sheet = page.getByRole('dialog', { name: 'Modifiers' });
  await sheet.getByRole('group', { name: 'Room' }).getByRole('button', { name: /^Trick Room/ }).click();
  await sheet.getByRole('button', { name: 'Done' }).click();

  // Kingambit at its slowest: 2 × 50 + 5 = 105, ×0.9 = 94. Garganacl must be below it.
  await expect(results(page).getByRole('heading')).toHaveText('Garganacl underspeeds 94 with up to');
  expect(await rows(page)).toEqual([
    ['40 EVs', '93'],
    ['72 EVs', '93'],
    ['116 EVs', '93'],
  ]);
  await expect(page).toHaveURL(/tr=1/);
  await expect(page.locator('html')).toHaveAttribute('data-trick-room', 'true');
});

test('a share link: Copy link, then open it fresh to the same answer', async ({ page, context, browser }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?v=1&t=garchomp&y=dragapult&t.lv=50&tr=1');
  const heading = await results(page).getByRole('heading').innerText();
  const answer = await rows(page);

  await page.getByRole('button', { name: 'Copy link' }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const url = new URL(link);
  expect(url.origin + url.pathname).toBe('http://localhost:4173/');
  expect(Object.fromEntries(url.searchParams)).toEqual({ v: '1', t: 'garchomp', 't.lv': '50', y: 'dragapult', tr: '1' });

  // Someone else opens it, with nothing saved.
  const other = await browser.newContext({ viewport: PHONE });
  await other.route(/googletagmanager\.com|google-analytics\.com|sentry\.io/, (route) => route.abort('blockedbyclient'));
  const theirs = await other.newPage();
  await theirs.goto(link);
  await expect(results(theirs).getByRole('heading')).toHaveText(heading);
  expect(await rows(theirs)).toEqual(answer);
  await other.close();
});
