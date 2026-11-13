import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, IconButton, TextButton, TextLink } from './Button.tsx';
import { CloseIcon, SwapIcon } from './icons.tsx';

describe('Button', () => {
  it('is named by its text, not its icon, and works from the keyboard', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Button icon={<SwapIcon size={18} />} onPress={onPress}>
        Swap sides
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Swap sides' });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('does nothing when disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Button variant="primary" isDisabled onPress={onPress}>
        Done
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('is named by its aria-label', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <IconButton aria-label="Close" onPress={onPress}>
        <CloseIcon />
      </IconButton>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledOnce();
  });
});

describe('TextButton', () => {
  it('is a button named by its text', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<TextButton onPress={onPress}>Show calc</TextButton>);
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Show calc' })).toHaveFocus();
    expect(onPress).toHaveBeenCalledOnce();
  });
});

describe('TextLink', () => {
  it('is a link named by its text and reachable with Tab', async () => {
    const user = userEvent.setup();
    render(<TextLink href="/privacy">Privacy</TextLink>);
    await user.tab();
    const link = screen.getByRole('link', { name: 'Privacy' });
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('href', '/privacy');
  });
});
