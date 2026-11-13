import { describe, expect, it } from 'vitest';
import { actionSpeed, movesFirst } from './order.ts';

/**
 * Move order between two Speeds. Pokémon Showdown orders by
 * `trunc(speed, 13)`, i.e. speed mod 8192, after replacing speed with
 * `10000 − speed` in Trick Room (sim/pokemon.ts, getActionSpeed).
 * Expected values worked by hand from that rule.
 */
describe('actionSpeed', () => {
  it.each([
    // [speed, normal, trick room]
    [1, 1, 9999 % 8192], // 1807
    [333, 333, 9667 % 8192], // 1475
    [1807, 1807, 8193 % 8192], // 1
    [1808, 1808, 0],
    [1809, 1809, 8191],
    [1810, 1810, 8190],
    [8191, 8191, 1809],
    [8192, 0, 1808],
    [9792, 1600, 208],
    [10000, 1808, 0],
  ])('speed %i → %i normally, %i in Trick Room', (speed, normal, trickRoom) => {
    expect(actionSpeed(speed, {})).toBe(normal);
    expect(actionSpeed(speed, { trickRoom: true })).toBe(trickRoom);
  });
});

describe('movesFirst', () => {
  it('the faster Pokémon moves first', () => {
    expect(movesFirst(334, 333, {})).toBe('a');
    expect(movesFirst(333, 334, {})).toBe('b');
  });

  it('a tie is a tie, not a win', () => {
    expect(movesFirst(333, 333, {})).toBe('tie');
    expect(movesFirst(333, 333, { trickRoom: true })).toBe('tie');
  });

  it('the slower Pokémon moves first in Trick Room', () => {
    expect(movesFirst(93, 94, { trickRoom: true })).toBe('a');
    expect(movesFirst(94, 93, { trickRoom: true })).toBe('b');
  });

  it('in Trick Room, Speed 1809 or more moves before slower Pokémon', () => {
    expect(movesFirst(1809, 100, { trickRoom: true })).toBe('a');
    expect(movesFirst(1808, 100, { trickRoom: true })).toBe('b');
    // Among Pokémon at 1809 or more, the slower still moves first.
    expect(movesFirst(1809, 1810, { trickRoom: true })).toBe('a');
    // Regieleki at +6 with Scarf and Tailwind (6576) beats a 50 Speed Pokémon.
    expect(movesFirst(6576, 50, { trickRoom: true })).toBe('a');
  });

  it('outside Trick Room, Speed 8192 or more wraps round and moves late', () => {
    // Barraskewda, +Spe, +6, Swift Swim in rain, Scarf and Tailwind: 408 × 4 = 1632; × 6 = 9792.
    // It moves as if its Speed were 9792 − 8192 = 1600.
    expect(movesFirst(9792, 1601, {})).toBe('b');
    expect(movesFirst(9792, 1599, {})).toBe('a');
    expect(movesFirst(8191, 8190, {})).toBe('a');
    expect(movesFirst(8192, 1, {})).toBe('b');
  });
});
