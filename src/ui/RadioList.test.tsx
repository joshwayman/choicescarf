import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioList } from './RadioList.tsx';

const OPTIONS = [
  { id: 'worst', label: 'Worst case', description: 'Jolly · 252 EVs', value: 333, valueLabel: 'Speed 333' },
  { id: 'max', label: 'Max, neutral', description: '252 EVs', value: 303, valueLabel: 'Speed 303' },
  { id: 'none', label: 'No Speed EVs', value: 240 },
] as const;

describe('RadioList', () => {
  it('is a radio group named by its label, each radio named by its own label', () => {
    render(<RadioList label="Garchomp's set" options={OPTIONS} defaultValue="worst" onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: "Garchomp's set" })).toBeInTheDocument();
    const worst = screen.getByRole('radio', { name: 'Worst case' });
    expect(worst).toBeChecked();
    expect(worst).toHaveAccessibleDescription('Jolly · 252 EVs, Speed 333');
  });

  it('moves the selection with the arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioList label="Garchomp's set" options={OPTIONS} defaultValue="worst" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Worst case' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Max, neutral' })).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('max');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'No Speed EVs' })).toBeChecked();
  });

  it('selects a row when any part of it is clicked', async () => {
    const user = userEvent.setup();
    render(<RadioList label="Set" options={OPTIONS} defaultValue="worst" />);
    await user.click(screen.getByText('Max, neutral'));
    expect(screen.getByRole('radio', { name: 'Max, neutral' })).toBeChecked();
  });
});
