import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentsPage } from './ComponentsPage.tsx';

/** axe in jsdom can't see colour, so contrast is checked in a real browser instead (see the PR). */
async function axeViolations(context: Element | Document = document) {
  const results = await axe.run(context, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

beforeEach(() => {
  // As components.html sets them.
  document.documentElement.lang = 'en';
  document.title = 'Components | ChoiceScarf';
  localStorage.clear();
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

describe('ComponentsPage', () => {
  it('renders every component in a dark and a light panel', () => {
    render(<ComponentsPage />);
    for (const name of ['Dark', 'Light']) {
      const panel = screen.getByRole('region', { name });
      expect(panel).toHaveAttribute('data-theme', name.toLowerCase());
      for (const group of [
        'Buttons and links',
        'Header pills',
        'Chips',
        'Nature: answer buttons and a plain picker',
        'Target and You switcher',
        'Number fields and steppers',
        'Search with results',
        'Answer display and results card',
      ]) {
        expect(within(panel).getByRole('heading', { level: 3, name: group })).toBeInTheDocument();
      }
    }
  });

  it('has no axe violations', async () => {
    render(<ComponentsPage />);
    expect(await axeViolations()).toEqual([]);
  });

  it('has no axe violations with a sheet open', async () => {
    const user = userEvent.setup();
    render(<ComponentsPage />);
    const [firstFieldChip] = screen.getAllByRole('button', { name: 'Add Field' });
    if (!firstFieldChip) throw new Error('No + Field chip');
    await user.click(firstFieldChip);
    expect(screen.getByRole('dialog', { name: 'Field' })).toBeInTheDocument();
    expect(await axeViolations()).toEqual([]);
  });
});
