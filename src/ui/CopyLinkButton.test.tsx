import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CopyLinkButton } from './CopyLinkButton.tsx';

describe('CopyLinkButton', () => {
  it('copies the link from the keyboard and says so', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<CopyLinkButton getUrl={() => 'https://choicescarf.com/?v=1&t=garchomp'} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy link' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(writeText).toHaveBeenCalledWith('https://choicescarf.com/?v=1&t=garchomp');
    expect(await screen.findByRole('button', { name: 'Link copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Link copied');
  });

  it('works out the link when pressed, not when drawn', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    let url = 'first';
    render(<CopyLinkButton getUrl={() => url} />);
    url = 'second';
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith('second');
  });

  it('says what to do when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    render(<CopyLinkButton getUrl={() => 'x'} />);
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Copy the address from the address bar instead.');
  });
});
