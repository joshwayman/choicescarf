import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemIcon, PokemonIcon } from './PokemonIcon.tsx';

describe('PokemonIcon and ItemIcon', () => {
  it('render the name as text, with no image', () => {
    const { container } = render(
      <>
        <PokemonIcon name="Ogerpon-Wellspring" />
        <ItemIcon name="Choice Scarf" />
      </>,
    );
    expect(screen.getByText('Ogerpon-Wellspring')).toBeInTheDocument();
    expect(screen.getByText('Choice Scarf')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
