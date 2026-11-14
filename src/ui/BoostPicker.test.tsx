import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { BoostPicker, BoostSteps, boostMultiplier, signed } from './BoostPicker.tsx';

describe('signed', () => {
  it.each([
    [1, '+1'],
    [0, '0'],
    [-2, '−2'],
  ])('%i is %s', (value, text) => {
    expect(signed(value)).toBe(text);
  });
});

describe('boostMultiplier', () => {
  // The game's stage multipliers: (2 + n) / 2 up, 2 / (2 + n) down.
  it.each([
    [0, '×1'],
    [1, '×1.5'],
    [2, '×2'],
    [6, '×4'],
    [-1, '×0.67'],
    [-2, '×0.5'],
    [-6, '×0.25'],
  ])('%i is %s', (stage, text) => {
    expect(boostMultiplier(stage)).toBe(text);
  });
});

function Steps({ start = 0 }: { start?: number }) {
  const [value, setValue] = useState(start);
  return <BoostSteps inline label="Speed boost" value={value} onChange={setValue} />;
}

function Picker({ start = 0 }: { start?: number }) {
  const [value, setValue] = useState(start);
  return <BoostPicker label="Boost" value={value} onChange={setValue} />;
}

describe('BoostSteps', () => {
  it('steps by tapping as often as needed, and stops at +6', async () => {
    const user = userEvent.setup();
    render(<Steps />);
    const group = screen.getByRole('group', { name: 'Speed boost' });
    const up2 = within(group).getByRole('button', { name: 'Raise by 2' });
    await user.click(up2);
    await user.click(up2);
    await user.click(up2);
    expect(group).toHaveTextContent('+6 ×4');
    expect(up2).toBeDisabled();
    expect(within(group).getByRole('button', { name: 'Raise by 1' })).toBeDisabled();
    await user.click(within(group).getByRole('button', { name: 'Lower by 1' }));
    expect(group).toHaveTextContent('+5 ×3.5');
  });

  it('goes negative without a keyboard, stops at −6, and resets to 0', async () => {
    const user = userEvent.setup();
    render(<Steps start={-5} />);
    const group = screen.getByRole('group', { name: 'Speed boost' });
    await user.click(within(group).getByRole('button', { name: 'Lower by 2' }));
    expect(group).toHaveTextContent('−6 ×0.25');
    expect(within(group).getByRole('button', { name: 'Lower by 1' })).toBeDisabled();
    await user.click(within(group).getByRole('button', { name: 'Reset to 0' }));
    expect(group).toHaveTextContent('0 ×1');
    expect(within(group).getByRole('button', { name: 'Reset to 0' })).toBeDisabled();
  });
});

describe('BoostPicker', () => {
  it('is a button named by its label and value, opening the steps without a keyboard', async () => {
    const user = userEvent.setup();
    render(<Picker />);
    const field = screen.getByRole('button', { name: 'Boost 0' });
    expect(field).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await user.click(field);
    const dialog = await screen.findByRole('dialog', { name: 'Speed boost' });
    await user.click(within(dialog).getByRole('button', { name: 'Raise by 1' }));
    await user.click(within(dialog).getByRole('button', { name: 'Raise by 1' }));
    // It stays open while stepping, so the answer behind it can be watched.
    expect(dialog).toHaveTextContent('+2 ×2 Speed');
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Boost +2' })).toBeInTheDocument();
  });

  it('has no axe violations, closed or open', async () => {
    const user = userEvent.setup();
    document.documentElement.lang = 'en';
    document.title = 'ChoiceScarf';
    render(
      <main>
        <Picker start={-1} />
      </main>,
    );
    const rules = { rules: { 'color-contrast': { enabled: false } } };
    expect((await axe.run(document, rules)).violations.map((v) => v.id)).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Boost −1' }));
    await screen.findByRole('dialog');
    expect((await axe.run(document, rules)).violations.map((v) => v.id)).toEqual([]);
  });
});
