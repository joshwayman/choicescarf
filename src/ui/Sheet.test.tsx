import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogTrigger } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { Button } from './Button.tsx';
import { Chip } from './Chip.tsx';
import { Sheet, SheetNote, SheetSection } from './Sheet.tsx';

function FieldSheet() {
  return (
    <DialogTrigger>
      <Chip variant="add" label="Field" />
      <Sheet
        title="Field"
        subtitle="Applies to both Pokémon"
        footer={
          <Button variant="primary" slot="close" grow>
            Done
          </Button>
        }
      >
        <SheetSection label="Room">
          <Button>Trick Room</Button>
        </SheetSection>
        <SheetNote>Weather changes Speed only with a matching ability.</SheetNote>
      </Sheet>
    </DialogTrigger>
  );
}

describe('Sheet', () => {
  it('opens from its trigger as a dialog named by its title, with focus inside', async () => {
    const user = userEvent.setup();
    render(<FieldSheet />);
    const trigger = screen.getByRole('button', { name: 'Add Field' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.tab();
    await user.keyboard('{Enter}');

    const dialog = screen.getByRole('dialog', { name: 'Field' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('group', { name: 'Room' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<FieldSheet />);
    const trigger = screen.getByRole('button', { name: 'Add Field' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // React Aria restores focus on the next frame.
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('closes with the close button and with a slot="close" action', async () => {
    const user = userEvent.setup();
    render(<FieldSheet />);
    await user.click(screen.getByRole('button', { name: 'Add Field' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Field' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps Tab inside the sheet while it is open', async () => {
    const user = userEvent.setup();
    render(<FieldSheet />);
    await user.click(screen.getByRole('button', { name: 'Add Field' }));
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });
});
