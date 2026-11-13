import { describe, expect, it } from 'vitest';
import tokensCss from './tokens.css?raw';
import indexHtml from '../../index.html?raw';
import tokensHtml from '../../tokens.html?raw';
import { COLOR_ROLES, DISPLAY_ROLES, FIXED_COLORS, type ThemeName } from './tokens.ts';
import { THEME_COLOR, THEME_STORAGE_KEY } from './theme.ts';

/** The custom properties declared in the first block that opens with `selector {`. */
function declarations(selector: string): Map<string, string> {
  const start = tokensCss.indexOf(`${selector} {`);
  expect(start, `tokens.css has a "${selector}" block`).toBeGreaterThanOrEqual(0);
  const end = tokensCss.indexOf('}', start);
  const body = tokensCss.slice(start + selector.length + 2, end);
  const props = new Map<string, string>();
  for (const match of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) props.set(name, value.trim());
  }
  return props;
}

const THEMED_ROLES = [...COLOR_ROLES, ...DISPLAY_ROLES];

const BLOCKS: readonly { name: string; selector: string; theme: ThemeName }[] = [
  { name: 'dark (default)', selector: ":root,\n[data-theme='dark']", theme: 'dark' },
  { name: 'light (chosen)', selector: "[data-theme='light']", theme: 'light' },
  { name: 'light (from the system)', selector: ':root:not([data-theme])', theme: 'light' },
];

describe('tokens.css', () => {
  describe.each(BLOCKS)('the $name block', ({ selector, theme }) => {
    const props = declarations(selector);

    it.each(THEMED_ROLES)(`sets --color-$token to the design value`, (role) => {
      expect(props.get(`--color-${role.token}`)).toBe(role[theme]);
    });

    it('sets nothing else', () => {
      expect([...props.keys()].sort()).toEqual(THEMED_ROLES.map((role) => `--color-${role.token}`).sort());
    });
  });

  it('declares the colours that are the same in both themes', () => {
    const root = declarations(':root');
    for (const [token, value] of Object.entries(FIXED_COLORS)) {
      expect(root.get(`--color-${token}`)).toBe(value);
    }
  });

  it('declares the radius, spacing and sizes from the token sheet', () => {
    const root = declarations(':root');
    expect(root.get('--radius-field')).toBe('12px');
    expect(root.get('--radius-list')).toBe('16px');
    expect(root.get('--radius-card')).toBe('20px');
    expect(root.get('--radius-pill')).toBe('999px');
    for (const space of [4, 8, 12, 16, 20, 24, 32, 40]) {
      expect(root.get(`--space-${String(space)}`)).toBe(`${String(space)}px`);
    }
    expect(root.get('--gutter-phone')).toBe('20px');
    expect(root.get('--size-chip')).toBe('36px');
    expect(root.get('--gap-chip')).toBe('8px');
    expect(root.get('--size-control-min')).toBe('44px');
    expect(root.get('--duration-sheet')).toBe('200ms');
  });

  it('turns motion off when reduced motion is on', () => {
    const reduced = tokensCss.slice(tokensCss.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/--duration-sheet:\s*0ms/);
    expect(reduced).toMatch(/--duration-shimmer:\s*0ms/);
  });
});

/** WCAG 2 relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

describe('contrast helper', () => {
  it('matches known WCAG ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });
});

describe.each(['dark', 'light'] as const)('text contrast in the %s theme', (theme) => {
  const color = (token: string): string => {
    const role = THEMED_ROLES.find((r) => r.token === token);
    if (!role) throw new Error(`No colour role ${token}`);
    return role[theme];
  };

  const texts = ['text', 'text-2', 'text-3', 'accent-text'];
  const grounds = ['ground', 'surface', 'raised', 'tint'];
  const pairs = texts.flatMap((text) => grounds.map((ground) => ({ text, ground })));

  it.each(pairs)('$text on $ground passes 4.5:1', ({ text, ground }) => {
    expect(contrast(color(text), color(ground))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['display-text', 'display-text-2'])('%s on the display card passes 4.5:1', (text) => {
    expect(contrast(color(text), color('display'))).toBeGreaterThanOrEqual(4.5);
  });

  it('the answer yellow on the display card passes 4.5:1', () => {
    expect(contrast(FIXED_COLORS.answer, color('display'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('ink on the answer yellow', () => {
  it('passes 4.5:1', () => {
    expect(contrast(FIXED_COLORS['on-answer'], FIXED_COLORS.answer)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the HTML entry points', () => {
  it.each([
    ['index.html', indexHtml],
    ['tokens.html', tokensHtml],
  ])('%s applies the remembered theme before the first paint', (_name, html) => {
    expect(html).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
    expect(html).toContain('document.documentElement.dataset.theme');
  });

  it.each([
    ['index.html', indexHtml],
    ['tokens.html', tokensHtml],
  ])("%s sets the browser chrome to each theme's ground", (_name, html) => {
    expect(html).toContain(`content="${THEME_COLOR.dark}" media="(prefers-color-scheme: dark)"`);
    expect(html).toContain(`content="${THEME_COLOR.light}" media="(prefers-color-scheme: light)"`);
  });

  it('uses the ground colours for the browser chrome', () => {
    expect(THEME_COLOR).toEqual({ dark: '#10111c', light: '#f3f8fb' });
  });
});
