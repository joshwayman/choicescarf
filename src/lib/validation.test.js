import { clampStat, sanitizePokemon, DEFAULT_POKEMON } from './validation';

describe('clampStat', () => {
  it.each([
    ['ev', 300, 252],
    ['ev', -4, 0],
    ['iv', 99, 31],
    ['iv', -1, 0],
    ['lvl', 0, 1],
    ['lvl', 150, 100],
    ['baseSpeed', 0, 1],
    ['baseSpeed', 999, 255],
    ['boosts', 9, 6],
    ['boosts', -9, -6],
  ])('clamps %s %s to %s', (field, value, expected) => {
    expect(clampStat(field, value)).toBe(expected);
  });

  it('leaves values in range alone', () => {
    expect(clampStat('ev', 156)).toBe(156);
    expect(clampStat('baseSpeed', 95)).toBe(95);
  });

  it('accepts numeric strings and drops decimals', () => {
    expect(clampStat('ev', '100')).toBe(100);
    expect(clampStat('iv', 30.9)).toBe(30);
  });

  it.each(['', null, undefined, 'abc', NaN])('falls back to the default for %s', (value) => {
    expect(clampStat('lvl', value)).toBe(DEFAULT_POKEMON.lvl);
    expect(clampStat('ev', value, 252)).toBe(252);
  });

  it('passes through fields without limits', () => {
    expect(clampStat('nature', 'positive')).toBe('positive');
  });
});

describe('sanitizePokemon', () => {
  it('clamps every numeric field and keeps the rest', () => {
    const input = { ...DEFAULT_POKEMON, ev: 400, iv: '', lvl: 0, nature: 'positive', tailwind: true };

    expect(sanitizePokemon(input)).toEqual({
      ...DEFAULT_POKEMON,
      ev: 252,
      iv: 31,
      lvl: 1,
      nature: 'positive',
      tailwind: true,
    });
  });

  it('does not modify its input', () => {
    const input = { ...DEFAULT_POKEMON, ev: 400 };
    sanitizePokemon(input);
    expect(input.ev).toBe(400);
  });
});
