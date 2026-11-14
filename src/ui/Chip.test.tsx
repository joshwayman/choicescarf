import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip, ChipGroup, ChipToggle, type ChipVariant } from './Chip.tsx';

describe('Chip', () => {
  it.each<[ChipVariant, string, string]>([
    ['suggestion', 'Garchomp', 'Garchomp'],
    ['recent', 'Iron Bundle', 'Iron Bundle'],
    ['assumed', '31 IVs', '31 IVs'],
    ['changed', 'Choice Scarf', 'Choice Scarf'],
    ['add', 'Modifier', 'Add Modifier'],
    ['waiting', 'Swift Swim', 'Swift Swim needs rain'],
    ['added', 'Trick Room', 'Remove Trick Room'],
  ])('a %s chip labelled "%s" is a button named "%s"', (variant, label, name) => {
    render(<Chip variant={variant} label={label} {...(variant === 'waiting' ? { detail: 'needs rain' } : {})} />);
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });

  it('keeps the visible label inside the accessible name', () => {
    render(<Chip variant="add" label="Field" />);
    const chip = screen.getByRole('button', { name: 'Add Field' });
    expect(chip).toHaveTextContent('Field');
  });

  it('works from the keyboard', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Chip variant="added" label="Rain" linked onPress={onPress} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Remove Rain' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('marks a linked chip so it shares the shimmer and ring', () => {
    render(<Chip variant="changed" label="Swift Swim" detail="×2" detailIsNumber linked />);
    expect(screen.getByRole('button', { name: 'Swift Swim ×2' })).toHaveAttribute('data-linked', 'true');
  });
});

describe('ChipToggle', () => {
  it('is a toggle button that Space turns on and off', async () => {
    const user = userEvent.setup();
    render(<ChipToggle label="Tailwind" />);
    const chip = screen.getByRole('button', { name: 'Tailwind' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await user.tab();
    await user.keyboard(' ');
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard(' ');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('reads "+ Tailwind" when off and shows a check when on, keeping the name "Tailwind" (#118)', async () => {
    const user = userEvent.setup();
    render(<ChipToggle label="Tailwind" />);
    const chip = screen.getByRole('button', { name: 'Tailwind' });
    expect(chip).toHaveTextContent(/^\+Tailwind$/);
    expect(chip.querySelector('svg')).toBeNull();
    await user.click(chip);
    expect(chip).toHaveTextContent(/^Tailwind$/);
    expect(chip.querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Tailwind' })).toBe(chip);
  });
});

describe('ChipGroup', () => {
  it('is a named group when given a label, and Tab moves between its chips', async () => {
    const user = userEvent.setup();
    render(
      <ChipGroup aria-label="Garchomp's modifiers">
        <Chip variant="assumed" label="31 IVs" />
        <Chip variant="add" label="Modifier" />
      </ChipGroup>,
    );
    expect(screen.getByRole('group', { name: "Garchomp's modifiers" })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('button', { name: '31 IVs' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Add Modifier' })).toHaveFocus();
  });
});
