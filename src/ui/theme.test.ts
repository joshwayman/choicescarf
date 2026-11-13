import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyThemePreference,
  readThemePreference,
  resolveTheme,
  setThemePreference,
  useTheme,
} from './theme.ts';

/** jsdom has no matchMedia. This one reports a system scheme the test can change. */
function mockSystemScheme(initial: 'light' | 'dark') {
  let scheme = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return query === '(prefers-color-scheme: light)' && scheme === 'light';
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    })),
  );
  return {
    set(next: 'light' | 'dark') {
      scheme = next;
      for (const listener of listeners) listener();
    },
  };
}

function addThemeColorMetas() {
  document.head.innerHTML = `
    <meta name="theme-color" content="#10111c" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#f3f8fb" media="(prefers-color-scheme: light)" />`;
}

function themeColors(): string[] {
  return [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content);
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  addThemeColorMetas();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('readThemePreference', () => {
  it('follows the system when nothing has been chosen', () => {
    expect(readThemePreference()).toBe('system');
  });

  it('returns a remembered choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readThemePreference()).toBe('light');
  });

  it('ignores a value it does not recognise', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readThemePreference()).toBe('system');
  });

  it('follows the system when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(readThemePreference()).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('uses the system scheme for "system"', () => {
    mockSystemScheme('light');
    expect(resolveTheme('system')).toBe('light');
    mockSystemScheme('dark');
    expect(resolveTheme('system')).toBe('dark');
  });

  it('uses a chosen theme whatever the system prefers', () => {
    mockSystemScheme('light');
    expect(resolveTheme('dark')).toBe('dark');
  });
});

describe('applyThemePreference', () => {
  it('sets data-theme and points both theme-colors at that ground', () => {
    applyThemePreference('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(themeColors()).toEqual(['#f3f8fb', '#f3f8fb']);
  });

  it('removes data-theme and restores each scheme its own ground for "system"', () => {
    applyThemePreference('dark');
    applyThemePreference('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(themeColors()).toEqual(['#10111c', '#f3f8fb']);
  });
});

describe('setThemePreference', () => {
  it('remembers a chosen theme and applies it', () => {
    setThemePreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('forgets the choice for "system"', () => {
    setThemePreference('light');
    setThemePreference('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('still applies the theme when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    setThemePreference('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('useTheme', () => {
  it('follows the system until a theme is chosen, then keeps it', () => {
    const system = mockSystemScheme('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current).toMatchObject({ preference: 'system', theme: 'dark' });

    act(() => {
      system.set('light');
    });
    expect(result.current).toMatchObject({ preference: 'system', theme: 'light' });

    act(() => {
      result.current.setPreference('dark');
    });
    expect(result.current).toMatchObject({ preference: 'dark', theme: 'dark' });

    act(() => {
      system.set('light');
    });
    expect(result.current).toMatchObject({ preference: 'dark', theme: 'dark' });
  });

  it('picks up a theme chosen in another tab', () => {
    mockSystemScheme('dark');
    const { result } = renderHook(() => useTheme());
    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }));
    });
    expect(result.current).toMatchObject({ preference: 'light', theme: 'light' });
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
