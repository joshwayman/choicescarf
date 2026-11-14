import { test as base, expect, type Page } from '@playwright/test';

/**
 * Shared setup for the browser flows (#88). The e2e build has placeholder
 * analytics and Sentry ids (playwright.config.ts); every test blocks those
 * hosts so nothing leaves the machine. telemetry.spec.ts checks them itself.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/googletagmanager\.com|google-analytics\.com|sentry\.io/, (route) => route.abort('blockedbyclient'));
    await use(page);
  },
});

export { expect };

export const PHONE = { width: 390, height: 844 };
export const DESKTOP = { width: 1280, height: 800 };

/** The results card, whatever the answer. */
export function results(page: Page) {
  return page.getByRole('region', { name: /outspeed|needs a Choice Scarf|can’t outspeed|underspeed|too fast/ });
}

/** Each row of the results table: [answer, Speed]. */
export async function rows(page: Page): Promise<string[][]> {
  const body = results(page).locator('tbody tr');
  const out: string[][] = [];
  for (const row of await body.all()) {
    out.push(await row.getByRole('cell').allInnerTexts());
  }
  return out;
}
