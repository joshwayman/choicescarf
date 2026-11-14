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

describe('Species picker (#50)', () => {
  async function pick(user: ReturnType<typeof userEvent.setup>, button: HTMLElement, query: string, option: RegExp) {
    await user.click(button);
    const dialog = await screen.findByRole('dialog', { name: 'Change Pokémon' });
    await user.type(within(dialog).getByRole('searchbox', { name: 'Search Pokémon' }), query);
    await user.click(await within(dialog).findByRole('option', { name: option }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  }

  it('picks a species by a partial name and fills its base Speed', async () => {
    const user = userEvent.setup();
    const { router } = open('/');
    await pick(user, await screen.findByRole('button', { name: 'Choose Pokémon' }), 'chomp', /^Garchomp \d+$/);
    expect(screen.getByRole('button', { name: 'Change Pokémon, now Garchomp' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Base Speed' })).toHaveValue('102');
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp');
  });

  it('shows base Speed in the results and says so when nothing matches', async () => {
    const user = userEvent.setup();
    open('/');
    await user.click(await screen.findByRole('button', { name: 'Choose Pokémon' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change Pokémon' });
    const box = within(dialog).getByRole('searchbox', { name: 'Search Pokémon' });
    expect(box).toHaveFocus();
    await user.type(box, 'chomp');
    expect(within(dialog).getByRole('option', { name: 'Garchomp 102' })).toHaveAccessibleDescription('base Speed 102');
    await user.clear(box);
    await user.type(box, 'qqqqxx');
    expect(within(dialog).getByRole('option')).toHaveTextContent('No Pokémon match');
  });

  it('picks with the keyboard alone: "ogre w", then Enter', async () => {
    const user = userEvent.setup();
    const { router } = open('/');
    (await screen.findByRole('button', { name: 'Choose Pokémon' })).focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Change Pokémon' });
    expect(within(dialog).getByRole('searchbox')).toHaveFocus();
    await user.keyboard('ogre w');
    await waitFor(() => {
      expect(within(dialog).getAllByRole('option')[0]).toHaveTextContent('Ogerpon-Wellspring');
    });
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(router.state.location.searchStr).toBe('?v=1&t=ogerponwellspring');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Change Pokémon, now Ogerpon-Wellspring' })).toHaveFocus();
    });
  });

  it('shows "Custom · base N" when base Speed is edited, and picking again takes the species’ own', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=garchomp&y=dragapult');
    await typeInto(user, await screen.findByRole('textbox', { name: 'Base Speed' }), '120');
    const button = screen.getByRole('button', { name: 'Change Pokémon, now Custom · base 120' });
    expect(button).toHaveTextContent('Custom · base 120');
    await pick(user, button, 'garchomp', /^Garchomp \d+$/);
    expect(screen.getByRole('textbox', { name: 'Base Speed' })).toHaveValue('102');
    expect(screen.getByRole('button', { name: 'Change Pokémon, now Garchomp' })).toBeInTheDocument();
  });

  it('keeps an ability the new species has and drops one it does not', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult&y.ability=swiftswim');
    await user.click(await screen.findByRole('tab', { name: /^You/ }));
    await pick(user, screen.getByRole('button', { name: 'Change Pokémon, now Dragapult' }), 'iron bundle', /^Iron Bundle \d+$/);
    expect(router.state.location.searchStr).not.toContain('ability');
    expect(router.state.location.searchStr).toContain('y=ironbundle');
  });

  it('works on desktop, one picker for each Pokémon', async () => {
    stubWidth(true);
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=garchomp&y=dragapult');
    await results();
    expect(screen.getAllByRole('button', { name: /^Change Pokémon, now/ })).toHaveLength(2);
    await pick(user, screen.getByRole('button', { name: 'Change Pokémon, now Dragapult' }), 'iron bun', /^Iron Bundle \d+$/);
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&y=ironbundle');
    // "base N" sits beside the name.
    expect(screen.getByText('base 136')).toBeInTheDocument();
  });

  it('shows each species’ sprite without changing what is read out (#106)', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=garchomp&y=dragapult');
    const button = await screen.findByRole('button', { name: 'Change Pokémon, now Garchomp' });
    expect(button.querySelector('[data-icon="445"]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('tab', { name: /^You/ }).querySelector('[data-icon="887"]')).not.toBeNull();

    await user.click(button);
    const dialog = await screen.findByRole('dialog', { name: 'Change Pokémon' });
    await user.type(within(dialog).getByRole('searchbox'), 'chomp');
    expect(within(dialog).getByRole('option', { name: 'Garchomp 102' }).querySelector('[data-icon="445"]')).not.toBeNull();
  });

  it('shows no sprite for a custom base Speed', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=garchomp&y=dragapult');
    await typeInto(user, await screen.findByRole('textbox', { name: 'Base Speed' }), '120');
    expect(screen.getByRole('button', { name: 'Change Pokémon, now Custom · base 120' }).querySelector('[data-icon]')).toBeNull();
  });

  it('shows the 96 px battle sprite in each desktop card, beside the heading (#110)', async () => {
    stubWidth(true);
    open('/?v=1&t=garchomp&y=dragapult');
    await results();
    for (const [name, id] of [
      ['Garchomp', 'garchomp'],
      ['Dragapult', 'dragapult'],
    ] as const) {
      const card = screen.getByRole('region', { name });
      const sprite = card.querySelector(`img[src="/sprites/gen5/${id}.png"]`);
      expect(sprite).toHaveAttribute('alt', '');
      expect(sprite).toHaveAttribute('width', '96');
      // The small icon is for lists and tabs, not the card.
      expect(screen.getByRole('heading', { name }).querySelector('[data-icon]')).toBeNull();
    }
  });

  it('shows no battle sprite on a desktop card with a custom base Speed', async () => {
    stubWidth(true);
    open('/?v=1&t=garchomp&y=dragapult&t.base=120');
    await results();
    const card = screen.getByRole('region', { name: 'Custom · base 120' });
    expect(card.querySelector('img')).toBeNull();
  });

  it('has no axe violations with the picker open', async () => {
    const user = userEvent.setup();
    open('/');
    await user.click(await screen.findByRole('button', { name: 'Choose Pokémon' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change Pokémon' });
    await user.type(within(dialog).getByRole('searchbox'), 'gar');
    const found = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});

/**
 * Trick Room (#52). Expected values are worked out from the in-game formula,
 * not read off the code. Kingambit (base 50) under Trick Room defaults to the
 * slowest spread: −Spe, 0 EVs, 0 IVs: floor((2×50)×100/100)+5 = 105, ×0.9 = 94.
 * Garganacl (base 35, 0 IVs) needs to be slower than 94, and a tie is a loss:
 *   neutral: 70 + EVs/4 + 5 → 72 EVs is 93, 76 EVs is 94 (a tie), so up to 72
 *   +Spe: floor(×1.1) → 40 EVs is 85 → 93, 44 EVs is 86 → 94, so up to 40
 *   −Spe: floor(×0.9) → 116 EVs is 104 → 93, 120 EVs is 105 → 94, so up to 116
 * Dragapult (base 142) at its slowest, −Spe 0 EVs 0 IVs: 289 → 260; with an
 * Iron Ball ×0.5 → 130. Both are above 94.
 */
describe('Trick Room', () => {
  async function addTrickRoom(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: 'Add Field' }));
    const sheet = await screen.findByRole('dialog', { name: 'Modifiers' });
    const room = within(sheet).getByRole('group', { name: 'Room' });
    await user.click(within(room).getByRole('button', { name: /^Trick Room/ }));
    await user.click(within(sheet).getByRole('button', { name: 'Done' }));
  }

  it('is added from the Field tab and flips the answer: Garganacl underspeeds Kingambit with up to 72 EVs', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=kingambit&y=garganacl');
    expect(within(await results()).getByRole('heading')).toHaveTextContent('Garganacl needs a Choice Scarf to outspeed 218');

    await addTrickRoom(user);
    const region = await results();
    expect(within(region).getByRole('heading', { name: 'Garganacl underspeeds 94 with up to' })).toBeInTheDocument();
    expect(rows(region)).toEqual([
      ['40 EVs', '93'],
      ['72 EVs', '93'],
      ['116 EVs', '93'],
    ]);
    expect(within(region).getByText('slower moves first')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Trick Room' })).toBeInTheDocument();
    expect(router.state.location.searchStr).toContain('tr=1');
    // The background grid.
    expect(document.documentElement).toHaveAttribute('data-trick-room', 'true');
  });

  it('turns back into an outspeed answer, without the grid, when removed', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=kingambit&y=garganacl&tr=1');
    await results();
    expect(document.documentElement).toHaveAttribute('data-trick-room', 'true');
    await user.click(screen.getByRole('button', { name: 'Remove Trick Room' }));
    expect(within(await results()).getByRole('heading')).toHaveTextContent('Garganacl');
    expect(within(await results()).queryByText('slower moves first')).not.toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute('data-trick-room');
  });

  it('says "can’t underspeed" with its slowest speed when even that is too fast', async () => {
    open('/?v=1&t=kingambit&y=dragapult&tr=1');
    const region = await results();
    expect(within(region).getByRole('heading', { name: 'Dragapult can’t underspeed 94' })).toBeInTheDocument();
    expect(rows(region)).toEqual([
      ['Too fast', '—'],
      ['Too fast', '—'],
      ['Too fast', '—'],
    ]);
    const note = screen.getByText(/Even its slowest spread/);
    expect(note).toHaveTextContent('Even its slowest spread (260) moves after Kingambit in Trick Room.');
    expect(note).toHaveTextContent('An Iron Ball brings it to 130, still too fast.');
  });

  it('says when an Iron Ball would be enough', async () => {
    // Garchomp (base 102) at its slowest, −Spe 0 EVs 0 IVs: 209 → 188; ×0.5 = 94, a tie, so still too fast.
    // Against a base 60 target (125 → 112 slowest): Iron Ball 94 < 112 gets it under.
    open('/?v=1&t.base=60&y=garchomp&tr=1');
    const note = await screen.findByText(/Even its slowest spread/);
    expect(note).toHaveTextContent('An Iron Ball brings it to 94, which is slow enough.');
  });

  it('counts a tie as a loss', async () => {
    // Garchomp with an Iron Ball against a 94: slowest is 94, a tie, so it can't underspeed.
    open('/?v=1&t=kingambit&y=garchomp&y.item=ironball&tr=1');
    const region = await results();
    expect(within(region).getByRole('heading')).toHaveTextContent('Garchomp can’t underspeed 94');
  });

  it('suggests 0 IVs and an Iron Ball while it is on, and hides the Choice Scarf', async () => {
    const user = userEvent.setup();
    const { router } = open('/?v=1&t=kingambit&y=garganacl');
    await results();
    expect(screen.getByRole('button', { name: 'Choice Scarf' })).toBeInTheDocument();
    await addTrickRoom(user);

    await user.click(screen.getByRole('tab', { name: /^You/ }));
    expect(screen.queryByRole('button', { name: 'Choice Scarf' })).not.toBeInTheDocument();
    // Your IVs default to 0 in Trick Room, so that chip starts on.
    expect(screen.getByRole('button', { name: '0 IVs' })).toHaveAttribute('aria-pressed', 'true');
    const ball = screen.getByRole('button', { name: 'Iron Ball' });
    expect(ball).toHaveAttribute('aria-pressed', 'false');

    await user.click(ball);
    expect(router.state.location.searchStr).toContain('y.item=ironball');
    // 70 + 63 + 5 = 138 × 0.5 = 69 for 252 EVs: well under 94, so every nature reaches 252 EVs.
    const region = await results();
    expect(rows(region).map((row) => row[0])).toEqual(['252 EVs', '252 EVs', '252 EVs']);

    await user.click(screen.getByRole('button', { name: '0 IVs' }));
    expect(screen.getByRole('button', { name: '0 IVs' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('has the same flow on desktop', async () => {
    stubWidth(true);
    open('/?v=1&t=kingambit&y=dragapult&tr=1');
    const region = await results();
    expect(within(region).getByRole('heading')).toHaveTextContent('Dragapult can’t underspeed 94');
    expect(screen.getAllByRole('button', { name: 'Iron Ball' })).toHaveLength(2);
  });

  it('has no axe violations under Trick Room', async () => {
    open('/?v=1&t=kingambit&y=dragapult&tr=1');
    await results();
    const found = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});

describe('Item icons (#108)', () => {
  it('shows the Choice Scarf icon on its chip and in the Scarf fallback (#108)', async () => {
    open('/?v=1&t=dragapult&y=garchomp');
    const region = await results();
    // Choice Scarf is row 4, column 5 of the item sheet: 4 × 16 + 5 = 69.
    const answers = within(region)
      .getAllByRole('cell')
      .filter((cell) => cell.textContent.endsWith('EVs'));
    expect(answers).toHaveLength(2);
    for (const cell of answers) {
      expect(cell.querySelector('[data-item-icon="69"]')).toHaveAttribute('aria-hidden', 'true');
    }
    expect(rows(region)[0]).toEqual(['68 EVs', '423']);
    expect(screen.getByRole('button', { name: 'Choice Scarf' }).querySelector('[data-item-icon="69"]')).not.toBeNull();
  });

  it('shows no Scarf icon in the results when no Scarf is needed', async () => {
    open('/?v=1&t=garchomp&y=dragapult');
    expect((await results()).querySelector('[data-item-icon]')).toBeNull();
  });

  it('shows item icons on other item chips and in the Modifiers sheet (#108)', async () => {
    const user = userEvent.setup();
    open('/?v=1&t=garchomp&y=dragapult&t.item=ironball');
    await results();
    const ironBall = screen.getByRole('button', { name: /^Iron Ball/ });
    expect(ironBall.querySelector('[data-item-icon="224"]')).not.toBeNull();

    await user.click(ironBall);
    const items = within(await screen.findByRole('dialog', { name: 'Modifiers' })).getByRole('group', { name: 'Item' });
    expect(within(items).getByRole('button', { name: 'Choice Scarf ×1.5' }).querySelector('[data-item-icon="69"]')).not.toBeNull();
    expect(within(items).getByRole('button', { name: /^Power item/ }).querySelector('[data-item-icon="354"]')).not.toBeNull();
  });
});
