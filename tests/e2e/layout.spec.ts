import type { Page } from '@playwright/test';
import { DESKTOP, expect, PHONE, results, test } from './fixtures.ts';

/**
 * Layout checks from the quality bar (#88): Calculator fits a 390 × 844
 * phone screen without scrolling, and every tap target is at least 44 px
 * (chips 36 px). Inline text links in sentences are exempt, as WCAG 2.5.8 allows.
 */

const CALCULATOR: { name: string; path: string; overflows?: string }[] = [
  { name: 'empty', path: '/' },
  { name: 'solved', path: '/?v=1&t=garchomp&y=dragapult' },
  { name: 'Scarf fallback', path: '/?v=1&t=dragapult&y=garchomp' },
  // Two rows of modifier chips on the side being edited don't fit yet.
  { name: 'Trick Room', path: '/?v=1&t=kingambit&y=garganacl&tr=1', overflows: '#116' },
  {
    name: 'with modifiers',
    // Item, ability, paralysis and Swamp: several rows of chips in any browser.
    path: '/?v=1&t=garchomp&t.item=ironball&t.ability=sandrush&t.status=par&t.swamp=1&weather=sand&y=dragapult',
    overflows: '#116',
  },
];

async function ready(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
  await expect(results(page).or(page.getByRole('heading', { name: /Type a base Speed/ }))).toBeVisible();
}

/** Every visible control smaller than it should be, with its size. */
async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const selector = 'a[href], button, input, select, textarea, [role="tab"], [role="option"], [role="menuitem"], [role="switch"]';
    const out: string[] = [];
    /** Visually hidden for screen readers only, such as React Aria's Dismiss buttons. */
    const visuallyHidden = (el: Element) => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.clipPath === 'inset(50%)') return true;
      }
      return false;
    };
    for (const control of document.querySelectorAll<HTMLElement>(selector)) {
      // A hidden native input (radio, checkbox) is tapped through its label.
      const el = control.tagName === 'INPUT' && control.closest('label') ? (control.closest('label') as HTMLElement) : control;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0 || getComputedStyle(el).visibility === 'hidden' || visuallyHidden(el)) continue;
      // A text link inside a sentence is exempt (WCAG 2.5.8, inline).
      if (el.tagName === 'A' && el.closest('p, li') && !el.closest('nav')) continue;
      // The skip link only shows when focused.
      if (el.getAttribute('href') === '#main') continue;
      const isChip = /(^|\s)_chip_/.test(el.className);
      const min = isChip ? 36 : 44;
      if (box.height < min - 0.5 || box.width < min - 0.5) {
        const label = el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 30);
        out.push(`${el.tagName.toLowerCase()} "${label}" ${String(Math.round(box.width))}×${String(Math.round(box.height))} (min ${String(min)})`);
      }
    }
    return out;
  });
}

test.describe('phone, 390 × 844', () => {
  test.use({ viewport: PHONE });

  for (const { name, path, overflows } of CALCULATOR) {
    test(`Calculator ${name} fits the screen`, async ({ page }) => {
      // A known failure, tracked in its issue. Playwright fails this test as
      // soon as it starts passing, so the mark is removed with the fix.
      test.fail(overflows !== undefined, `Doesn't fit yet: ${overflows ?? ''}`);
      await page.goto(path);
      await ready(page);
      const height = await page.evaluate(() => document.scrollingElement?.scrollHeight ?? 0);
      expect(height, 'page height').toBeLessThanOrEqual(PHONE.height);
    });

    test(`Calculator ${name} has no small tap targets`, async ({ page }) => {
      await page.goto(path);
      await ready(page);
      expect(await smallTargets(page)).toEqual([]);
    });
  }

  test('the species picker and Modifiers sheet have no small tap targets', async ({ page }) => {
    await page.goto('/?v=1&t=garchomp&y=dragapult');
    await ready(page);
    await page.getByRole('button', { name: /^Change Pokémon, now Garchomp/ }).click();
    await page.getByRole('searchbox', { name: 'Search Pokémon' }).fill('char');
    await expect(page.getByRole('option').first()).toBeVisible();
    expect(await smallTargets(page)).toEqual([]);
    // The first Escape clears the search; the next closes the sheet.
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Change Pokémon' })).toBeHidden();

    await page.getByRole('button', { name: 'Add Modifier' }).click();
    await expect(page.getByRole('dialog', { name: 'Modifiers' })).toBeVisible();
    expect(await smallTargets(page)).toEqual([]);
  });

  for (const path of ['/more', '/about', '/privacy']) {
    test(`${path} has no small tap targets`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await smallTargets(page)).toEqual([]);
    });
  }
});

test.describe('desktop', () => {
  test.use({ viewport: DESKTOP });

  for (const { name, path } of CALCULATOR) {
    test(`Calculator ${name} has no small tap targets`, async ({ page }) => {
      await page.goto(path);
      await ready(page);
      expect(await smallTargets(page)).toEqual([]);
    });
  }

  test('the More menu has no small tap targets', async ({ page }) => {
    await page.goto('/?v=1&t=garchomp&y=dragapult');
    await ready(page);
    await page.getByRole('button', { name: 'More: About and Privacy' }).click();
    await expect(page.getByRole('menu', { name: 'More' })).toBeVisible();
    expect(await smallTargets(page)).toEqual([]);
  });
});
