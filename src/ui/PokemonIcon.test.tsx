import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemIcon, PokemonIcon, PokemonSprite } from './PokemonIcon.tsx';

describe('PokemonSprite', () => {
  it('shows the icon at its place on the sheet, 12 to a row', () => {
    const { container } = render(<PokemonSprite icon={445} />);
    const sprite = container.firstElementChild as HTMLElement;
    // 445 is row 37, column 1: 37 × 30 px down, 1 × 40 px across.
    expect(sprite.style.backgroundPosition).toBe('-40px -1110px');
  });

  it('is decorative, so screen readers skip it', () => {
    const { container } = render(<PokemonSprite icon={445} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('PokemonIcon', () => {
  it('shows the sprite before the name when it has one', () => {
    const { container } = render(<PokemonIcon name="Garchomp" icon={445} />);
    expect(screen.getByText('Garchomp')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(container.textContent).toBe('Garchomp');
  });

  it('shows only the name without one, such as for a custom base Speed', () => {
    const { container } = render(<PokemonIcon name="Custom · base 100" />);
    expect(screen.getByText('Custom · base 100')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});

describe('ItemIcon', () => {
  it('renders the name as text, with no image', () => {
    const { container } = render(<ItemIcon name="Choice Scarf" />);
    expect(screen.getByText('Choice Scarf')).toBeInTheDocument();
    expect(container.querySelector('img, [aria-hidden="true"]')).toBeNull();
  });
});
