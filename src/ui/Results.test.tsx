import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AnswerDisplay, ResultsCard } from './Results.tsx';

describe('AnswerDisplay', () => {
  it('is a live region named by its heading, with the answer and unit as text', () => {
    render(
      <AnswerDisplay
        heading="Dragapult outspeeds Garchomp with"
        value={56}
        footnote="Neutral nature"
        comparison={
          <>
            <strong>334</strong> vs 333
          </>
        }
      />,
    );
    const region = screen.getByRole('region', { name: 'Dragapult outspeeds Garchomp with' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(within(region).getByText('56')).toBeInTheDocument();
    expect(region).toHaveTextContent('56 EVs');
    expect(region).toHaveTextContent('334 vs 333');
  });

  it('can be named apart from its heading', () => {
    render(<AnswerDisplay heading="Dragapult outspeeds Garchomp with" value={56} label="Left matchup" />);
    expect(screen.getByRole('region', { name: 'Left matchup' })).toBeInTheDocument();
  });

  it('says Trick Room is on when it is', () => {
    render(<AnswerDisplay heading="Garganacl underspeeds Kingambit with up to" value={72} trickRoom />);
    expect(screen.getByRole('region', { name: /underspeeds/ })).toHaveTextContent(/^Trick Room slower moves first/);
  });
});

describe('ResultsCard', () => {
  const props = {
    heading: 'Dragapult outspeeds 333 with',
    rows: [
      { id: 'plus', label: '+Spe', answer: '0 EVs', stat: 352 },
      { id: 'neutral', label: 'Neutral', answer: '56 EVs', stat: 334 },
      { id: 'minus', label: '−Spe', answer: '208 EVs', stat: 334 },
    ],
    calc: [
      { label: 'Garchomp', working: '303 → ×1.1 +Spe = 333' },
      { label: 'Dragapult, neutral', working: '334 → ×1.0 = 334' },
    ],
  };

  it('is a named region with a table of every nature', () => {
    render(<ResultsCard {...props} />);
    const region = screen.getByRole('region', { name: 'Dragapult outspeeds 333 with' });
    const table = within(region).getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Neutral' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Answer' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(4);
  });

  it('shows and hides the working with the keyboard, and says which', async () => {
    const user = userEvent.setup();
    render(<ResultsCard {...props} />);
    const toggle = screen.getByRole('button', { name: 'Show calc' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('303 → ×1.1 +Spe = 333')).not.toBeVisible();

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Hide calc' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('303 → ×1.1 +Spe = 333')).toBeVisible();

    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Show calc' })).toHaveAttribute('aria-expanded', 'false');
  });
});
