import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SideSwitcher } from './SideSwitcher.tsx';

const SIDES = [
  { id: 'target', role: 'Target', name: 'Garchomp', speed: 333 },
  { id: 'you', role: 'You', name: 'Dragapult', speed: 334 },
];

function Switcher() {
  const [side, setSide] = useState('target');
  return (
    <SideSwitcher aria-label="Which Pokémon to edit" sides={SIDES} selectedKey={side} onSelectionChange={setSide}>
      {(s) => <p>Editing {s.name}</p>}
    </SideSwitcher>
  );
}

describe('SideSwitcher', () => {
  it('is a named tab list whose tabs say the role, Pokémon and Speed, in the visible words', () => {
    render(<Switcher />);
    expect(screen.getByRole('tablist', { name: 'Which Pokémon to edit' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Target Garchomp 333' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'You Dragapult 334' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Editing Garchomp');
  });

  it('switches sides with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Switcher />);
    await user.tab();
    expect(screen.getByRole('tab', { name: /^Target/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /^You/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Editing Dragapult');
  });
});
