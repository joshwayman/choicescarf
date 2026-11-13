import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogTrigger } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { HeaderPill } from './HeaderPill.tsx';
import { Sheet } from './Sheet.tsx';

describe('HeaderPill', () => {
  it('is named by its label and detail', () => {
    render(<HeaderPill label="Gen 9 OU" detail="Lv 100" />);
    expect(screen.getByRole('button', { name: 'Gen 9 OU Lv 100' })).toBeInTheDocument();
  });

  it('opens its menu from the keyboard', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <HeaderPill label="Gen 9 OU" detail="Lv 100" />
        <Sheet title="Format">
          <p>Formats</p>
        </Sheet>
      </DialogTrigger>,
    );
    const pill = screen.getByRole('button', { name: /^Gen 9 OU/ });
    expect(pill).toHaveAttribute('aria-haspopup', 'dialog');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Format' })).toBeInTheDocument();
    expect(pill).toHaveAttribute('aria-expanded', 'true');
  });
});
