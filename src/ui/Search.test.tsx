import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Search } from './Search.tsx';

const POKEMON = [
  { id: 'garchomp', name: 'Garchomp', value: 102, valueLabel: 'base Speed 102' },
  { id: 'gardevoir', name: 'Gardevoir', value: 80, valueLabel: 'base Speed 80' },
  { id: 'garganacl', name: 'Garganacl', value: 35, valueLabel: 'base Speed 35' },
  { id: 'dragapult', name: 'Dragapult', value: 142, valueLabel: 'base Speed 142' },
];

describe('Search', () => {
  it('names the box and the results', () => {
    render(<Search label="Search Pokémon" placeholder="Search Pokémon" items={POKEMON} onSelect={vi.fn()} />);
    expect(screen.getByRole('searchbox', { name: 'Search Pokémon' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Results' })).toBeInTheDocument();
    const garchomp = screen.getByRole('option', { name: 'Garchomp 102' });
    expect(garchomp).toHaveAccessibleDescription('base Speed 102');
  });

  it('filters as you type, ignoring case and accents', async () => {
    const user = userEvent.setup();
    render(<Search label="Search Pokémon" items={POKEMON} onSelect={vi.fn()} />);
    await user.type(screen.getByRole('searchbox'), 'GAR');
    expect(screen.getAllByRole('option').map((o) => o.getAttribute('data-key'))).toEqual([
      'garchomp',
      'gardevoir',
      'garganacl',
    ]);
  });

  it('picks with the arrow keys and Enter while focus stays in the box', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Search label="Search Pokémon" items={POKEMON} onSelect={onSelect} />);
    const box = screen.getByRole('searchbox');
    // Typing highlights the first match; the down arrow moves to the next.
    await user.type(box, 'gar');
    await user.keyboard('{ArrowDown}');
    expect(box).toHaveFocus();
    // React Aria updates aria-activedescendant a moment later, for screen readers.
    await waitFor(() => {
      expect(box).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /^Gardevoir/ }).id);
    });
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('gardevoir');
  });

  it('picks with a click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Search label="Search Pokémon" items={POKEMON} onSelect={onSelect} />);
    await user.click(screen.getByRole('option', { name: /^Dragapult/ }));
    expect(onSelect).toHaveBeenCalledWith('dragapult');
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Search label="Search Pokémon" items={POKEMON} onSelect={vi.fn()} emptyMessage="No Pokémon match" />);
    await user.type(screen.getByRole('searchbox'), 'zzz');
    // React Aria wraps the empty state in a single option so the list stays valid.
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['No Pokémon match']);
  });

  it('shows the items it is given when the caller filters them', async () => {
    const user = userEvent.setup();
    const onInputChange = vi.fn();
    render(
      <Search label="Search Pokémon" items={POKEMON} inputValue="chomp" onInputChange={onInputChange} prefiltered onSelect={vi.fn()} />,
    );
    // "chomp" is not at the start of any name, but the caller said these match.
    expect(screen.getAllByRole('option')).toHaveLength(POKEMON.length);
    await user.type(screen.getByRole('searchbox'), 'x');
    expect(onInputChange).toHaveBeenCalledWith('chompx');
  });

  it('can focus the box on appearing', () => {
    render(<Search label="Search Pokémon" items={POKEMON} onSelect={vi.fn()} focusOnMount />);
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });
});
