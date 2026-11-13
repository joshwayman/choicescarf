import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.tsx';

describe('App', () => {
  it('renders the placeholder page', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'ChoiceScarf' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Use the current calculator' })).toHaveAttribute(
      'href',
      'https://choicescarf.com/',
    );
  });
});
