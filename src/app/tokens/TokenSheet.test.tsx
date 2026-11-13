import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COLOR_ROLES } from '../../ui/tokens.ts';
import { THEME_STORAGE_KEY } from '../../ui/theme.ts';
import { TokenSheet } from './TokenSheet.tsx';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TokenSheet', () => {
  it('shows every colour role in a dark and a light panel', () => {
    render(<TokenSheet />);

    for (const theme of ['dark', 'light'] as const) {
      const panel = screen.getByRole('region', { name: theme === 'dark' ? 'Dark' : 'Light' });
      expect(panel).toHaveAttribute('data-theme', theme);
      for (const role of COLOR_ROLES) {
        const swatch = within(panel).getByText(role.label).closest('li');
        expect(swatch).not.toBeNull();
        expect(within(swatch as HTMLElement).getByText(role[theme])).toBeInTheDocument();
      }
    }
  });

  it('has the type, radius, spacing and motion sections', () => {
    render(<TokenSheet />);
    for (const name of ['From the logo', 'Colour roles', 'Type', 'Radius', 'Spacing', 'Motion']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
  });

  it('switches and remembers the theme', () => {
    render(<TokenSheet />);

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    fireEvent.click(screen.getByRole('radio', { name: 'System' }));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
