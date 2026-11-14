import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from '@tanstack/react-router';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App.tsx';
import { createAppRouter } from '../router.tsx';
import { resetPageFocusForTests } from './Page.tsx';

/**
 * Calculator flows, as the v4 parity checklist on #87: base Speed, IVs, EVs,
 * nature, level, stage, Choice Scarf, Tailwind, weather, results per nature
 * and the Scarf fallback. Expected numbers are from docs/specs/rulesets.md.
 */

function stubWidth(desktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: desktop && query === '(min-width: 720px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function open(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createAppRouter(history);
  render(<App router={router} />);
  return { router, history };
}

async function results() {
  return screen.findByRole('region', { name: /outspeed|needs a Choice Scarf|can’t outspeed|underspeed|too fast/ });
}

function rows(region: HTMLElement) {
  return within(region)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent));
}

/** Type into a number field and commit it, as leaving the field does. */
async function typeInto(user: ReturnType<typeof userEvent.setup>, field: HTMLElement, value: string) {
  await user.tripleClick(field);
  await user.keyboard(`${value}{Enter}`);
}

beforeEach(() => {
  document.documentElement.lang = 'en';
  localStorage.clear();
  resetPageFocusForTests();
  stubWidth(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Calculator on a phone', () => {
  it('asks for both base Speeds to start', async () => {
    open('/');
    expect(await screen.findByRole('heading', { name: 'Type a base Speed for both Pokémon' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Target/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('solves from typed base Speeds: 102 (+Spe, 252) against 142 gives 0, 56 and 208 EVs', async () => {
    const user = userEvent.setup();
    const { router } = open('/');
    await typeInto(user, await screen.findByRole('textbox', { name: 'Base Speed' }), '102');
    expect(await screen.findByRole('heading', { name: 'Type your base Speed' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^You/ }));
    await typeInto(user, screen.getByRole('textbox', { name: 'Base Speed' }), '142');

    const region = await results();
    expect(within(region).getByRole('heading')).toHaveTextContent('Your Pokémon outspeeds 333 with');
    expect(rows(region)).toEqual([
      ['0 EVs', '352'],
      ['56 EVs', '334'],
      ['208 EVs', '334'],
    ]);
    expect(router.state.location.searchStr).toBe('?v=1&t.base=102&y.base=142');
  });

  it('opens a shared link with species', async () => {
    open('/?v=1&t=garchomp&y=dragapult');
    const region = await results();
    expect(within(region).getByRole('heading')).toHaveTextContent('Dragapult outspeeds 333 with');
    expect(screen.getByRole('tab', { name: 'Target Garchomp 333' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'You Dragapult 334' })).toBeInTheDocument();
  });

  it('shows the Scarf fallback: Garchomp needs a Choice Scarf to outspeed 421', async () => {
    open('/?v=1&t=dragapult&y=garchomp');
    const region = await results();
    expect(within(region).getByRole('heading')).toHaveTextContent('Garchomp needs a Choice Scarf to outspeed 421');
    expect(within(region).getAllByRole('rowheader').map((h) => h.textContent)).toEqual([
      '+Spe, Scarf',
      'Neutral, Scarf',
      '−Spe, Scarf',
    ]);
    expect(rows(region)).toEqual([
      ['68 EVs', '423'],
      ['168 EVs', '423'],
      ['Can’t reach', '—'],
    ]);
  });

  it('follows the target’s nature, EVs, IVs, level and stage', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult');
    await results();

    await user.click(screen.getByRole('radio', { name: 'Neutral' }));
    await typeInto(user, screen.getByRole('textbox', { name: 'EVs' }), '0');
    await typeInto(user, screen.getByRole('textbox', { name: 'IVs' }), '0');
    await typeInto(user, screen.getByRole('textbox', { name: 'Level' }), '50');
    await typeInto(user, screen.getByRole('textbox', { name: 'Stage' }), '1');
    // Garchomp, neutral, 0 EVs, 0 IVs, level 50: floor(204×50/100)+5 = 107; +1 = 160
    expect(within(await results()).getByRole('heading')).toHaveTextContent('Dragapult outspeeds 160 with');
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&t.lv=50&t.iv=0&t.ev=0&t.nat=neutral&t.stage=1&y=dragapult');
  });

  it('marks your nature and EVs as solved', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=garchomp&y=dragapult');
    await user.click(await screen.findByRole('tab', { name: /^You/ }));
    const panel = screen.getByRole('region', { name: 'Your settings' });
    expect(within(panel).getByText('Nature and EVs are solved in the results')).toBeInTheDocument();
    expect(within(panel).queryByRole('radiogroup', { name: 'Nature' })).not.toBeInTheDocument();
    expect(within(panel).getByText('Solved')).toHaveAccessibleDescription('Nature and EVs are solved in the results');
  });

  it('toggles Choice Scarf and Tailwind from the chips', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult');
    await results();
    // Garchomp 333 × 1.5 = 499: past Dragapult's 421 without a Scarf.
    await user.click(screen.getByRole('button', { name: 'Choice Scarf' }));
    expect(within(await results()).getByRole('heading')).toHaveTextContent('Dragapult needs a Choice Scarf to outspeed 499');
    // With Tailwind too, ×3 = 999: past even Dragapult's Scarf 631.
    await user.click(screen.getByRole('button', { name: 'Tailwind' }));
    expect(within(await results()).getByRole('heading')).toHaveTextContent('Dragapult can’t outspeed 999');
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&t.item=choicescarf&t.tw=1&y=dragapult');
  });

  it('adds an ability, then rain from the Field tab of the same sheet', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=barraskewda&t.nat=neutral&y=dragapult');
    expect(within(await results()).getByRole('heading')).toHaveTextContent('outspeeds 371 with');

    await user.click(screen.getByRole('button', { name: 'Add Modifier' }));
    const sheet = await screen.findByRole('dialog', { name: 'Modifiers' });
    // It opens on the Pokémon whose chip was pressed.
    expect(within(sheet).getByRole('tab', { name: 'Barraskewda' })).toHaveAttribute('aria-selected', 'true');
    // Its own ability is listed first.
    const abilityGroup = within(sheet).getByRole('group', { name: 'Ability' });
    expect(within(abilityGroup).getAllByRole('button')[0]).toHaveAccessibleName(/^Swift Swim Its ability/);
    await user.click(within(abilityGroup).getByRole('button', { name: /^Swift Swim/ }));
    // The page behind the open sheet is hidden from assistive tech, so this looks past that.
    expect(await screen.findByRole('button', { name: 'Swift Swim needs rain', hidden: true })).toBeInTheDocument();

    // Rain without closing the sheet.
    await user.click(within(sheet).getByRole('tab', { name: 'Field' }));
    await user.click(within(sheet).getByRole('button', { name: /^Rain/ }));
    await user.click(within(sheet).getByRole('button', { name: 'Done' }));

    // 371 × 2 = 742: past Dragapult's best even with a Scarf (631).
    expect(within(await results()).getByRole('heading')).toHaveTextContent('Dragapult can’t outspeed 742');
    const ability = await screen.findByRole('button', { name: 'Swift Swim ×2' });
    expect(ability).toHaveAttribute('data-linked', 'true');
    expect(screen.getByRole('button', { name: 'Remove Rain' })).toHaveAttribute('data-linked', 'true');
  });

  it('switches between the Pokémon and the field in one sheet', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult');
    await user.click(await screen.findByRole('button', { name: 'Add Field' }));
    const sheet = await screen.findByRole('dialog', { name: 'Modifiers' });
    expect(within(sheet).getByRole('tab', { name: 'Field' })).toHaveAttribute('aria-selected', 'true');

    await user.click(within(sheet).getByRole('tab', { name: 'Dragapult' }));
    await user.click(within(sheet).getByRole('button', { name: /^Paralysis/ }));
    await user.click(within(sheet).getByRole('tab', { name: 'Garchomp' }));
    await user.click(within(sheet).getByRole('button', { name: /^Iron Ball/ }));
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&t.item=ironball&y=dragapult&y.status=par');
  });

  it('offers the six Power items as one row', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult');
    await user.click(await screen.findByRole('button', { name: 'Add Modifier' }));
    const items = within(await screen.findByRole('dialog', { name: 'Modifiers' })).getByRole('group', { name: 'Item' });
    expect(within(items).queryByRole('button', { name: /^Power Band/ })).not.toBeInTheDocument();
    const power = within(items).getByRole('button', {
      name: 'Power item Power Anklet, Band, Belt, Bracer, Lens or Weight ×0.5',
    });
    await user.click(power);
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&t.item=poweranklet&y=dragapult');
    await user.keyboard('{Escape}');
    expect(await screen.findByRole('button', { name: 'Power item' })).toBeInTheDocument();
  });

  it('shows any Power item from a link as a Power item', async () => {
    open('/?v=1&t=garchomp&t.item=powerbracer&y=dragapult');
    expect(await screen.findByRole('button', { name: 'Power item' })).toBeInTheDocument();
    // 333 × 0.5 = 166.5, rounded half down.
    expect(within(await results()).getByRole('heading')).toHaveTextContent('outspeeds 166 with');
  });

  it('removes a weather from the FIELD row', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult&weather=sun');
    await user.click(await screen.findByRole('button', { name: 'Remove Sun' }));
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&y=dragapult');
  });

  it('swaps sides, and Back undoes it', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult');
    await results();
    await user.click(screen.getByRole('button', { name: 'Swap sides' }));
    expect(within(await results()).getByRole('heading')).toHaveTextContent('Garchomp needs a Choice Scarf to outspeed 421');
    act(() => {
      router.history.back();
    });
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /outspeeds 333/ })).toBeInTheDocument();
    });
  });

  it('shows the working behind Show calc', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=garchomp&y=dragapult');
    await user.click(await screen.findByRole('button', { name: 'Show calc' }));
    expect(screen.getByText('303 → ×1.1 +Spe = 333')).toBeVisible();
    expect(screen.getByText('334 → ×1.0 = 334')).toBeVisible();
    expect(screen.getByText('Dragapult, neutral')).toBeVisible();
  });

  it('copies the link', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    open('/?t=garchomp&y=dragapult&junk=1');
    await user.click(await screen.findByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/?v=1&t=garchomp&y=dragapult');
  });

  it('has no axe violations, empty or solved', async () => {
    for (const path of ['/', '/?v=1&t=dragapult&y=garchomp&weather=rain&y.ability=swiftswim']) {
      const { unmount } = render(<App router={createAppRouter(createMemoryHistory({ initialEntries: [path] }))} />);
      await screen.findAllByRole('heading', { level: 1 });
      const found = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
      expect(found.violations.map((v) => v.id)).toEqual([]);
      unmount();
    }
  });
});

describe('Calculator on desktop', () => {
  beforeEach(() => {
    stubWidth(true);
  });

  it('shows Target, You and the results side by side', async () => {
    open('/?v=1&t=garchomp&y=dragapult');
    expect(await screen.findByRole('region', { name: 'Garchomp' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Dragapult' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(await results()).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: 'Base Speed' })).toHaveLength(2);
    expect(screen.getAllByRole('textbox', { name: 'Speed stage' })).toHaveLength(2);
  });

  it('has no axe violations', async () => {
    open('/?v=1&t=dragapult&y=garchomp');
    await results();
    const found = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});
