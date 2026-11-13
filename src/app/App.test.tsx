import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from '@tanstack/react-router';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { createAppRouter } from './router.tsx';
import { resetPageFocusForTests } from './screens/Page.tsx';

function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createAppRouter(history);
  render(<App router={router} />);
  return { router, history };
}

async function heading(name: string | RegExp) {
  return screen.findByRole('heading', { level: 1, name });
}

beforeEach(() => {
  document.documentElement.lang = 'en';
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  resetPageFocusForTests();
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

describe('routes', () => {
  it('shows Calculator at /', async () => {
    renderAt('/');
    expect(await heading('Calculator')).toBeInTheDocument();
    expect(document.title).toBe('ChoiceScarf | Pokémon Speed EV Calculator');
  });

  it.each([
    ['/more', 'More', 'More | ChoiceScarf'],
    ['/about', 'About ChoiceScarf', 'About | ChoiceScarf'],
    ['/privacy', 'Privacy', 'Privacy | ChoiceScarf'],
  ])('shows %s with its heading and title', async (path, name, title) => {
    renderAt(path);
    expect(await heading(name)).toBeInTheDocument();
    expect(document.title).toBe(title);
  });

  it('sends an unknown path to Calculator, replacing it in history', async () => {
    const { router, history } = renderAt('/battle/nowhere');
    expect(await heading('Calculator')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(history.length).toBe(1);
  });
});

describe('the calculation in the URL', () => {
  it('loads a hand-broken link without crashing', async () => {
    renderAt('/?t.ev=abc&t=missingno&%%%=1&tr=maybe&v=999&t.lv=-4&weather=%E0%A4%A');
    expect(await heading('Calculator')).toBeInTheDocument();
  });

  it('keeps the calculation through the header and the More page', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/?v=1&t=garchomp&y=dragapult');
    await heading('Calculator');
    await user.click(screen.getByRole('link', { name: 'More' }));
    await heading('More');
    await user.click(screen.getByRole('link', { name: 'About ChoiceScarf' }));
    await heading('About ChoiceScarf');
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&y=dragapult');
    await user.click(screen.getByRole('link', { name: 'ChoiceScarf home' }));
    await heading('Calculator');
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&y=dragapult');
  });
});

describe('the back button', () => {
  it('works across every route', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/');
    await heading('Calculator');

    await user.click(screen.getByRole('link', { name: 'More' }));
    expect(await heading('More')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'About ChoiceScarf' }));
    expect(await heading('About ChoiceScarf')).toBeInTheDocument();

    act(() => {
      router.history.back();
    });
    expect(await heading('More')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Privacy' }));
    expect(await heading('Privacy')).toBeInTheDocument();

    act(() => {
      router.history.back();
    });
    expect(await heading('More')).toBeInTheDocument();
    act(() => {
      router.history.back();
    });
    expect(await heading('Calculator')).toBeInTheDocument();

    act(() => {
      router.history.forward();
    });
    expect(await heading('More')).toBeInTheDocument();
  });

  it('goes home from the logo', async () => {
    const user = userEvent.setup();
    renderAt('/privacy');
    await heading('Privacy');
    await user.click(screen.getByRole('link', { name: 'ChoiceScarf home' }));
    expect(await heading('Calculator')).toBeInTheDocument();
  });
});

describe('the header', () => {
  it('shows the logo, the Gen 9 ruleset as plain text, and no mode tabs', async () => {
    renderAt('/');
    await heading('Calculator');
    const header = screen.getByRole('banner');
    expect(header).toHaveTextContent('ChoiceScarf');
    expect(header).toHaveTextContent('Gen 9');
    expect(screen.queryByRole('button', { name: /Gen 9/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Quick' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Mode' })).not.toBeInTheDocument();
  });

  it('has a desktop More menu with About and Privacy, usable from the keyboard', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/');
    await heading('Calculator');

    const trigger = screen.getByRole('button', { name: 'More: About and Privacy' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    trigger.focus();
    await user.keyboard('{Enter}');
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['About ChoiceScarf', 'Privacy']);

    await user.keyboard('{ArrowDown}{Enter}');
    expect(await heading('Privacy')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/privacy');
  });

  it('has a desktop theme toggle that flips the theme and remembers it', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await heading('Calculator');
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('choicescarf:theme')).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('the More page', () => {
  it('has About, Privacy and the theme', async () => {
    const user = userEvent.setup();
    renderAt('/more');
    await heading('More');
    expect(screen.getByRole('navigation', { name: 'More' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About ChoiceScarf' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');

    await user.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('focus', () => {
  it('moves to the new page heading after navigating, but not on first load', async () => {
    const user = userEvent.setup();
    renderAt('/more');
    const more = await heading('More');
    expect(more).not.toHaveFocus();

    await user.click(screen.getByRole('link', { name: 'Privacy' }));
    const privacy = await heading('Privacy');
    await waitFor(() => {
      expect(privacy).toHaveFocus();
    });
  });

  it('offers a skip link to the content', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await heading('Calculator');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
  });
});

describe('accessibility', () => {
  it.each(['/', '/more', '/about', '/privacy'])('%s has no axe violations', async (path) => {
    renderAt(path);
    await screen.findByRole('heading', { level: 1 });
    const results = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual(
      [],
    );
  });
});
