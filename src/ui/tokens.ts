/**
 * The v5 design tokens as data, transcribed from the design canvas token
 * sheet ("Visual system: tokens") and the colour table in #69.
 *
 * The CSS variables in tokens.css are what components use. This module is
 * here so the token page can label each swatch and so tests can check that
 * tokens.css matches the design and that text passes contrast.
 */

export type ThemeName = 'dark' | 'light';

export interface ColorRole {
  /** The CSS variable is `--color-${token}`. */
  readonly token: string;
  readonly label: string;
  readonly dark: string;
  readonly light: string;
}

/** The colour roles on the token sheet, in its order. Values swap one-to-one between themes. */
export const COLOR_ROLES = [
  { token: 'ground', label: 'Ground', dark: '#10111c', light: '#f3f8fb' },
  { token: 'surface', label: 'Surface', dark: '#191b2b', light: '#ffffff' },
  { token: 'raised', label: 'Raised', dark: '#222539', light: '#e4eff6' },
  { token: 'hairline', label: 'Hairline', dark: '#2b2f48', light: '#cfdee9' },
  { token: 'control-line', label: 'Control line', dark: '#3b6b90', light: '#3b6b90' },
  { token: 'accent', label: 'Accent', dark: '#4696d0', light: '#4696d0' },
  { token: 'accent-text', label: 'Accent text', dark: '#9fd0f2', light: '#2d5f86' },
  { token: 'tint', label: 'Tint', dark: '#1b2c44', light: '#dcedf7' },
  { token: 'text', label: 'Text', dark: '#f4f7fb', light: '#151623' },
  { token: 'text-2', label: 'Text 2', dark: '#b9c6dc', light: '#3a4660' },
  { token: 'text-3', label: 'Text 3', dark: '#8a97b4', light: '#586580' },
  { token: 'primary-edge', label: 'Primary edge', dark: '#fff45c', light: '#151623' },
] as const satisfies readonly ColorRole[];

/**
 * Roles used by the component sheets and sheet boards that aren't swatches on the token sheet.
 * The answer sits on a navy display card in both themes, because yellow text
 * fails on a pale ground (#69): in dark that card is the surface, in light
 * it is the logo's outline ink.
 */
export const DISPLAY_ROLES = [
  { token: 'display', label: 'Display card', dark: '#191b2b', light: '#151623' },
  { token: 'display-line', label: 'Display card line', dark: '#2b2f48', light: '#2f3350' },
  { token: 'display-text', label: 'Display card text', dark: '#f4f7fb', light: '#f4f7fb' },
  { token: 'display-text-2', label: 'Display card text 2', dark: '#b9c6dc', light: '#b9c6dc' },
  { token: 'shimmer', label: 'Shimmer highlight', dark: 'rgba(200, 231, 241, 0.3)', light: 'rgba(255, 255, 255, 0.85)' },
  { token: 'scrim', label: 'Scrim behind a sheet', dark: 'rgba(6, 7, 14, 0.62)', light: 'rgba(21, 22, 35, 0.42)' },
] as const satisfies readonly ColorRole[];

/** Colours that are the same in both themes. */
export const FIXED_COLORS = {
  /** Reserved for the answer, the selected nature and the primary action. */
  answer: '#fff45c',
  /** Text and outlines on the answer yellow: the logo's outline ink. */
  'on-answer': '#151623',
  /** Divider lines on the answer yellow. */
  'on-answer-rule': 'rgba(21, 22, 35, 0.3)',
} as const;

/** The logo colours at the top of the token sheet. Not tokens themselves. */
export const LOGO_COLORS = [
  { label: 'Scarf light', value: '#c8e7f1' },
  { label: 'Scarf', value: '#4696d0' },
  { label: 'Scarf deep', value: '#3b6b90' },
  { label: 'Outline ink', value: '#151623' },
  { label: 'Answer yellow', value: '#fff45c' },
] as const;

export interface TypeStyle {
  /** The CSS variables are `--type-${token}-*`. */
  readonly token: string;
  readonly label: string;
  /** As written on the token sheet. */
  readonly spec: string;
  readonly sample: string;
}

export const TYPE_STYLES = [
  { token: 'answer', label: 'Answer', spec: 'Space Mono 700, 104 / 0.95, −0.04em', sample: '56' },
  { token: 'title', label: 'Title', spec: 'Space Grotesk 700, 32 / 1.1, −0.02em', sample: 'What do you need to outspeed?' },
  { token: 'name', label: 'Name', spec: 'Space Grotesk 700, 17', sample: 'Garchomp' },
  { token: 'stat', label: 'Stat', spec: 'Space Mono 700, 20', sample: '333' },
  { token: 'body', label: 'Body', spec: 'Inter 400, 15 / 1.35', sample: 'Dragapult outspeeds Garchomp with' },
  { token: 'label', label: 'Label', spec: 'Inter 500, 13', sample: 'Worst case · Jolly 252' },
  { token: 'caption', label: 'Caption', spec: 'Inter 500, 12', sample: 'Most used in Gen 9 OU' },
] as const satisfies readonly TypeStyle[];

/** `--space-${n}`, in px. */
export const SPACING = [4, 8, 12, 16, 20, 24, 32, 40] as const;

export const RADII = [
  { token: 'field', value: '12px', label: '12', use: 'Fields, buttons, option rows' },
  { token: 'list', value: '16px', label: '16', use: 'Lists, tab bar' },
  { token: 'card', value: '20px', label: '20', use: 'Cards, answer display' },
  { token: 'pill', value: '999px', label: 'Pill', use: 'Chips, format pill, tabs' },
] as const;
