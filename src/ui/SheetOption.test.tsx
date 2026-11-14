import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SheetOption } from './SheetOption.tsx';

describe('SheetOption', () => {
  it('is a toggle button named by its label, description and value, in visible order', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SheetOption label="Rain" description="Swift Swim" value="×2" onChange={onChange} />);
    const option = screen.getByRole('button', { name: 'Rain Swift Swim ×2' });
    expect(option).toHaveAttribute('aria-pressed', 'false');
    await user.tab();
    await user.keyboard(' ');
    expect(option).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
