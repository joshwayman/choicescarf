import { useCallback, useSyncExternalStore } from 'react';
import { COLOR_ROLES, type ThemeName } from './tokens.ts';

/**
 * Theme preference: follow the system until someone picks a theme, then
 * remember it.
 *
 * The choice is kept in localStorage, not with the rest of the library in
 * IndexedDB (ADR 0001, section 3), because it has to be read synchronously
 * before the first paint. The inline script in index.html and tokens.html
 * applies it then, so the page never flashes the other theme. That script
 * repeats THEME_STORAGE_KEY; a test checks they agree.
 */

export type ThemePreference = 'system' | ThemeName;

export const THEME_STORAGE_KEY = 'choicescarf:theme';

const PREFERS_LIGHT = '(prefers-color-scheme: light)';

const ground = COLOR_ROLES[0];
/** The browser chrome colour (theme-color) for each theme: its ground. */
export const THEME_COLOR: Readonly<Record<ThemeName, string>> = {
  dark: ground.dark,
  light: ground.light,
};

function isThemeName(value: unknown): value is ThemeName {
  return value === 'dark' || value === 'light';
}

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (some private modes) throws on access.
    return undefined;
  }
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = storage()?.getItem(THEME_STORAGE_KEY);
    return isThemeName(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function systemTheme(): ThemeName {
  return window.matchMedia(PREFERS_LIGHT).matches ? 'light' : 'dark';
}

export function resolveTheme(preference: ThemePreference): ThemeName {
  return preference === 'system' ? systemTheme() : preference;
}

/** Set data-theme on the page and the browser chrome colour to match. */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = preference;
  }

  // index.html has a theme-color tag per system scheme. Following the system,
  // each shows its own theme's ground; with a chosen theme, both show it.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme: ThemeName = meta.getAttribute('media')?.includes('light') ? 'light' : 'dark';
    meta.content = THEME_COLOR[preference === 'system' ? scheme : preference];
  }
}

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Remember a preference ('system' forgets it) and apply it. */
export function setThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      storage()?.removeItem(THEME_STORAGE_KEY);
    } else {
      storage()?.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Storage full or blocked: the theme still applies for this visit.
  }
  applyThemePreference(preference);
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const query = window.matchMedia(PREFERS_LIGHT);
  query.addEventListener('change', listener);
  // Another tab changed the theme.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyThemePreference(readThemePreference());
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    query.removeEventListener('change', listener);
    window.removeEventListener('storage', onStorage);
  };
}

export interface ThemeState {
  /** What was chosen: 'system' until someone picks a theme. */
  preference: ThemePreference;
  /** The theme on screen. */
  theme: ThemeName;
  setPreference: (preference: ThemePreference) => void;
}

export function useTheme(): ThemeState {
  const preference = useSyncExternalStore(subscribe, readThemePreference, () => 'system' as const);
  const theme = useSyncExternalStore(
    subscribe,
    () => resolveTheme(readThemePreference()),
    () => 'dark' as const,
  );
  const setPreference = useCallback((next: ThemePreference) => {
    setThemePreference(next);
  }, []);
  return { preference, theme, setPreference };
}
