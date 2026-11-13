import { describe, expect, it } from 'vitest';
import { movesFirst } from './order.ts';
import { solveOutspeed, solveUnderspeed } from './solve.ts';
import { speed } from './speed.ts';
import type { Field, Nature, SolverInput } from './types.ts';

/**
 * Property tests: for random inputs, every answer wins, and one EV step the
 * other way does not. "Cannot reach" and "too fast" mean no EV value wins.
 * Seeded, so a failure is reproducible.
 */
const CASES = 3_000;
const SEED = 0x82;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function int(random: () => number, min: number, max: number) {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(random: () => number, options: readonly T[]): T {
  return options[Math.floor(random() * options.length)] as T;
}

function randomYou(random: () => number): SolverInput {
  const input: SolverInput = {
    ruleset: 'gen9',
    baseSpeed: int(random, 1, 255),
    level: pick(random, [50, 100, int(random, 1, 100)]),
    iv: pick(random, [0, 31, int(random, 0, 31)]),
    stage: random() < 0.7 ? 0 : int(random, -6, 6),
  };
  const item = pick(random, [undefined, undefined, 'choicescarf', 'ironball']);
  if (item) input.item = item;
  if (random() < 0.2) input.tailwind = true;
  if (random() < 0.15) input.status = 'par';
  return input;
}

const field: Field = {};

function wins(you: SolverInput, ev: number, nature: Nature, target: number, trickRoom: boolean): boolean {
  const yours = speed({ ...you, ev, nature }, field).speed;
  return movesFirst(yours, target, { trickRoom }) === 'a';
}

describe('solveOutspeed properties', () => {
  it(`the fewest EVs win and 4 fewer do not, on ${CASES.toLocaleString('en')} random cases`, () => {
    const random = rng(SEED);
    const failures: unknown[] = [];
    for (let i = 0; i < CASES; i++) {
      const you = randomYou(random);
      const target = int(random, 1, 1200);
      const result = solveOutspeed(you, target, field);
      const sets: [SolverInput, typeof result.rows][] = [[you, result.rows]];
      if (result.scarf) sets.push([{ ...you, item: 'choicescarf' }, result.scarf]);
      for (const [pokemon, rows] of sets) {
        for (const row of rows) {
          if (row.result === 'reaches') {
            const ok = wins(pokemon, row.ev, row.nature, target, false) &&
              (row.ev === 0 || !wins(pokemon, row.ev - 4, row.nature, target, false));
            if (!ok) failures.push({ pokemon, target, row });
          } else {
            for (let ev = 0; ev <= 252; ev += 4) {
              if (wins(pokemon, ev, row.nature, target, false)) failures.push({ pokemon, target, row, ev });
            }
          }
        }
      }
      // The Scarf rows appear only when nothing reached, and you held no item.
      const anyReached = result.rows.some((row) => row.result === 'reaches');
      if ((result.scarf !== null) !== (!anyReached && you.item === undefined)) failures.push({ you, target, result });
    }
    expect(failures.slice(0, 5)).toEqual([]);
  });
});

describe('solveUnderspeed properties', () => {
  it(`the most EVs still move first in Trick Room and 4 more do not, on ${CASES.toLocaleString('en')} random cases`, () => {
    const random = rng(SEED + 1);
    const failures: unknown[] = [];
    for (let i = 0; i < CASES; i++) {
      const you = randomYou(random);
      const target = int(random, 1, 1200);
      for (const row of solveUnderspeed(you, target, field).rows) {
        if (row.result === 'reaches') {
          const ok = wins(you, row.ev, row.nature, target, true) &&
            (row.ev === 252 || !wins(you, row.ev + 4, row.nature, target, true));
          if (!ok) failures.push({ you, target, row });
        } else {
          for (let ev = 0; ev <= 252; ev += 4) {
            if (wins(you, ev, row.nature, target, true)) failures.push({ you, target, row, ev });
          }
        }
      }
    }
    expect(failures.slice(0, 5)).toEqual([]);
  });
});
