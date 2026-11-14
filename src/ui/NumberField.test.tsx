import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField.tsx';

describe('NumberField', () => {
  it('a plain field is named by its label and takes typed numbers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="IVs" defaultValue={31} minValue={0} maxValue={31} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'IVs' });
    await user.tripleClick(input);
    await user.keyboard('20{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(20);
  });

  it('clamps to its range when the value is committed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="IVs" defaultValue={31} minValue={0} maxValue={31} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'IVs' });
    await user.tripleClick(input);
    await user.keyboard('99');
    await user.tab();
    expect(input).toHaveValue('31');
  });

  it('steps with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<NumberField variant="stepper" label="Speed stage" defaultValue={0} minValue={-6} maxValue={6} />);
    await user.tab();
    const input = screen.getByRole('textbox', { name: 'Speed stage' });
    expect(input).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(input).toHaveValue('2');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('1');
  });

  it('names the stepper buttons "Lower <label>" and "Raise <label>"', async () => {
    const user = userEvent.setup();
    render(
      <NumberField
        variant="row"
        label="EVs"
        description="0 to 252, in steps of 4"
        defaultValue={248}
        minValue={0}
        maxValue={252}
        step={4}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'EVs' });
    expect(input).toHaveAccessibleDescription('0 to 252, in steps of 4');
    const raise = screen.getByRole('button', { name: 'Raise EVs' });
    await user.click(raise);
    expect(input).toHaveValue('252');
    expect(raise).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Lower EVs' }));
    expect(input).toHaveValue('248');
  });
});

describe('NumberField description (#119)', () => {
  it('shows the hint under the label, read as the description', () => {
    render(<NumberField variant="stepper" label="Speed boost" description="−6 to +6" defaultValue={0} />);
    expect(screen.getByRole('textbox', { name: 'Speed boost' })).toHaveAccessibleDescription('−6 to +6');
    expect(screen.getByText('−6 to +6')).toBeVisible();
  });
});
