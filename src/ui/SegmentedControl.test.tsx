import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedControl, type SegmentedControlProps } from './SegmentedControl.tsx';

const NATURES = [
  { id: 'plus', label: '+Spe', value: '0 EVs' },
  { id: 'neutral', label: 'Neutral', value: '56 EVs' },
  { id: 'minus', label: '−Spe', value: '208 EVs' },
];

function Controlled(props: Pick<SegmentedControlProps, 'variant' | 'aria-label'>) {
  const [selected, setSelected] = useState('neutral');
  return <SegmentedControl {...props} options={NATURES} selectedKey={selected} onSelectionChange={setSelected} />;
}

describe('SegmentedControl', () => {
  it('is a radio group of named options', () => {
    render(<Controlled aria-label="Nature" />);
    expect(screen.getByRole('radiogroup', { name: 'Nature' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Neutral' })).toBeChecked();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('names answer buttons with their result too', () => {
    render(<Controlled aria-label="Your nature" variant="answer" />);
    expect(screen.getByRole('radio', { name: 'Neutral 56 EVs' })).toBeChecked();
  });

  it('Tab lands on the selected option and the arrow keys move the selection', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Controlled aria-label="Nature" />
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Neutral' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '−Spe' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: '−Spe' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Neutral' })).not.toBeChecked();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: '+Spe' })).toBeChecked();
  });
});
