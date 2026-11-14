import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateNotice, UpdateNoticeView } from './UpdateNotice.tsx';

const sw = vi.hoisted(() => ({ needRefresh: false, update: vi.fn(() => Promise.resolve()) }));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => {
    const [needRefresh, setNeedRefresh] = useState(sw.needRefresh);
    return { needRefresh: [needRefresh, setNeedRefresh], offlineReady: [false, vi.fn()], updateServiceWorker: sw.update };
  },
}));

beforeEach(() => {
  document.documentElement.lang = 'en';
  // The app always sets one; a bare render has none.
  document.title = 'ChoiceScarf';
  sw.needRefresh = false;
  sw.update.mockClear();
});

describe('UpdateNoticeView', () => {
  it('shows nothing until there is a new version, in a live region that is already there', () => {
    render(<UpdateNoticeView isOpen={false} onUpdate={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('says a new version is ready, with Update and Not now', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const onDismiss = vi.fn();
    render(<UpdateNoticeView isOpen onUpdate={onUpdate} onDismiss={onDismiss} />);
    expect(screen.getByRole('status')).toHaveTextContent('A new version of ChoiceScarf is ready.');
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(onUpdate).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('has no axe violations', async () => {
    render(
      <main>
        <UpdateNoticeView isOpen onUpdate={vi.fn()} onDismiss={vi.fn()} />
      </main>,
    );
    const found = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
    expect(found.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('UpdateNotice', () => {
  it('shows nothing while the version is current', () => {
    render(<UpdateNotice />);
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument();
  });

  it('applies the new version only when asked', async () => {
    sw.needRefresh = true;
    const user = userEvent.setup();
    render(<UpdateNotice />);
    expect(sw.update).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(sw.update).toHaveBeenCalledWith(true);
  });

  it('goes away with Not now, without updating', async () => {
    sw.needRefresh = true;
    const user = userEvent.setup();
    render(<UpdateNotice />);
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument();
    expect(sw.update).not.toHaveBeenCalled();
  });
});
