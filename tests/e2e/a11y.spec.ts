import AxeBuilder from '@axe-core/playwright';
import { DESKTOP, expect, PHONE, results, test } from './fixtures.ts';
import type { Page } from '@playwright/test';

/**
 * axe on every route and the Calculator's main states, in both themes, at
 * phone and desktop sizes (#88). Unlike the jsdom tests, this runs in a
 * real browser, so colour contrast is checked too. Zero issues allowed.
 */

const PAGES: { name: string; path: string; ready: (page: Page) => Promise<void>; open?: (page: Page) => Promise<void> }[] = [
  { name: 'Calculator, empty', path: '/', ready: (p) => expect(p.getByRole('heading', { name: /Type a base Speed/ })).toBeVisible() },
  { name: 'Calculator, solved', path: '/?v=1&t=garchomp&y=dragapult', ready: (p) => expect(results(p)).toBeVisible() },
  { name: 'Calculator, Scarf fallback', path: '/?v=1&t=dragapult&y=garchomp', ready: (p) => expect(results(p)).toBeVisible() },
  {
    name: 'Calculator, Trick Room',
    path: '/?v=1&t=kingambit&y=garganacl&tr=1&y.item=ironball',
    ready: (p) => expect(results(p)).toBeVisible(),
  },
  {
    name: 'species picker open',
    path: '/?v=1&t=garchomp&y=dragapult',
    ready: (p) => expect(results(p)).toBeVisible(),
    open: async (p) => {
      await p.getByRole('button', { name: /^Change Pokémon, now Garchomp/ }).first().click();
      await p.getByRole('searchbox', { name: 'Search Pokémon' }).fill('char');
      await expect(p.getByRole('option').first()).toBeVisible();
    },
  },
  {
    name: 'Modifiers sheet open',
    path: '/?v=1&t=garchomp&y=dragapult',
    ready: (p) => expect(results(p)).toBeVisible(),
    open: async (p) => {
      await p.getByRole('button', { name: 'Add Modifier' }).first().click();
      await expect(p.getByRole('dialog', { name: 'Modifiers' })).toBeVisible();
    },
  },
  { name: 'More', path: '/more', ready: (p) => expect(p.getByRole('heading', { level: 1, name: 'More' })).toBeVisible() },
  { name: 'About', path: '/about', ready: (p) => expect(p.getByRole('heading', { level: 1, name: 'About ChoiceScarf' })).toBeVisible() },
  { name: 'Privacy', path: '/privacy', ready: (p) => expect(p.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible() },
];

for (const [size, viewport] of [
  ['phone', PHONE],
  ['desktop', DESKTOP],
] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${size}, ${colorScheme}`, () => {
      test.use({ viewport, colorScheme });
      for (const { name, path, ready, open } of PAGES) {
        test(`${name} has no axe violations`, async ({ page }) => {
          await page.goto(path);
          await ready(page);
          if (open) await open(page);
          // Let transitions finish, so contrast is measured on the final colours.
          await page.waitForTimeout(400);
          const { violations } = await new AxeBuilder({ page }).analyze();
          expect(
            violations.map((v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(' ')} (${n.failureSummary ?? ''})`).join('; ')}`),
          ).toEqual([]);
        });
      }
    });
  }
}
