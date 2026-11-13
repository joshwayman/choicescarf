import { describe, expect, it } from 'vitest';
import { solveOutspeed, solveUnderspeed } from './solve.ts';
import { speed } from './speed.ts';
import type { SolverInput, SpeedInput } from './types.ts';

/**
 * The Solving table in docs/specs/rulesets.md, worked by hand from the
 * in-game formula and checked against @smogon/calc. Level 100, 31 IVs unless stated.
 */
function you(overrides: Partial<SolverInput> & Pick<SolverInput, 'baseSpeed'>): SolverInput {
  return { ruleset: 'gen9', level: 100, iv: 31, stage: 0, ...overrides };
}

function pokemon(overrides: Partial<SpeedInput> & Pick<SpeedInput, 'baseSpeed'>): SpeedInput {
  return { ruleset: 'gen9', level: 100, iv: 31, ev: 252, nature: 'neutral', stage: 0, ...overrides };
}

describe('solveOutspeed: the spec table', () => {
  it('Dragapult outspeeding 333: 0 / 56 / 208 EVs', () => {
    const result = solveOutspeed(you({ baseSpeed: 142 }), 333, {});
    expect(result.target).toBe(333);
    expect(result.rows).toEqual([
      { nature: 'plus', result: 'reaches', ev: 0, speed: 352 },
      { nature: 'neutral', result: 'reaches', ev: 56, speed: 334 },
      { nature: 'minus', result: 'reaches', ev: 208, speed: 334 },
    ]);
    expect(result.scarf).toBeNull();
  });

  it('Garchomp outspeeding 421 cannot, so it tries a Choice Scarf: 68 / 168 / cannot', () => {
    // Without Scarf, at 252 EVs: 333 / 303 / 272.
    // With Scarf: +Spe 68 EVs: 257 × 1.1 = 282.7 → 282; × 1.5 = 423.
    //   Neutral 168 EVs: 204 + 31 + 42 = 277 + 5 = 282; × 1.5 = 423.
    //   −Spe at 252: 272 × 1.5 = 408. Cannot.
    const result = solveOutspeed(you({ baseSpeed: 102 }), 421, {});
    expect(result.rows).toEqual([
      { nature: 'plus', result: 'cannot-reach', speed: 333 },
      { nature: 'neutral', result: 'cannot-reach', speed: 303 },
      { nature: 'minus', result: 'cannot-reach', speed: 272 },
    ]);
    expect(result.scarf).toEqual([
      { nature: 'plus', result: 'reaches', ev: 68, speed: 423 },
      { nature: 'neutral', result: 'reaches', ev: 168, speed: 423 },
      { nature: 'minus', result: 'cannot-reach', speed: 408 },
    ]);
  });

  it('takes the target as a Pokémon as well as a number', () => {
    // Dragapult, +Spe, 252 EVs = 421.
    const target = pokemon({ baseSpeed: 142, nature: 'plus' });
    expect(solveOutspeed(you({ baseSpeed: 102 }), target, {}).target).toBe(421);
  });
});

describe('solveUnderspeed: the spec table', () => {
  it('Garganacl, 0 IVs, underspeeding 94: up to 40 / 72 / 116 EVs', () => {
    const result = solveUnderspeed(you({ baseSpeed: 35, iv: 0 }), 94, {});
    expect(result.target).toBe(94);
    expect(result.rows).toEqual([
      { nature: 'plus', result: 'reaches', ev: 40, speed: 93 },
      { nature: 'neutral', result: 'reaches', ev: 72, speed: 93 },
      { nature: 'minus', result: 'reaches', ev: 116, speed: 93 },
    ]);
  });

  it('the same at level 99: up to 44 / 76 / 124 EVs', () => {
    expect(solveUnderspeed(you({ baseSpeed: 35, iv: 0, level: 99 }), 94, {}).rows).toEqual([
      { nature: 'plus', result: 'reaches', ev: 44, speed: 93 },
      { nature: 'neutral', result: 'reaches', ev: 76, speed: 93 },
      { nature: 'minus', result: 'reaches', ev: 124, speed: 93 },
    ]);
  });

  it('Gardevoir, 0 IVs, underspeeding 61: too fast with every nature', () => {
    // At 0 EVs: 160 + 5 = 165; +Spe 181, −Spe 148. All above 61.
    expect(solveUnderspeed(you({ baseSpeed: 80, iv: 0 }), 61, {}).rows).toEqual([
      { nature: 'plus', result: 'too-fast', speed: 181 },
      { nature: 'neutral', result: 'too-fast', speed: 165 },
      { nature: 'minus', result: 'too-fast', speed: 148 },
    ]);
  });

  it('Kingambit as the target (−Spe, 0 EVs, 0 IVs = 94)', () => {
    const target = pokemon({ baseSpeed: 50, nature: 'minus', ev: 0, iv: 0 });
    expect(solveUnderspeed(you({ baseSpeed: 35, iv: 0 }), target, {}).target).toBe(94);
  });

  it('can underspeed with all 252 EVs', () => {
    // Shuckle-like base 5, 0 IVs, 252 EVs, neutral: 10 + 63 = 73 + 5 = 78 < 94.
    expect(solveUnderspeed(you({ baseSpeed: 5, iv: 0 }), 94, {}).rows[1]).toEqual({
      nature: 'neutral',
      result: 'reaches',
      ev: 252,
      speed: 78,
    });
  });
});

describe('ties never count as a win', () => {
  it('outspeeding: a tie is not enough', () => {
    // Base 100, level 100, neutral, 252 EVs = 299: a tie with 299, so "cannot reach".
    expect(solveOutspeed(you({ baseSpeed: 100 }), 299, {}).rows[1]).toEqual({
      nature: 'neutral',
      result: 'cannot-reach',
      speed: 299,
    });
  });

  it('underspeeding: a tie is not enough', () => {
    // Base 100, level 100, neutral, 0 EVs = 236; a target of 236 is a tie, so "too fast".
    expect(solveUnderspeed(you({ baseSpeed: 100 }), 236, {}).rows[1]).toEqual({
      nature: 'neutral',
      result: 'too-fast',
      speed: 236,
    });
  });
});

describe('the Choice Scarf fallback', () => {
  it('is skipped when you already hold an item', () => {
    const result = solveOutspeed(you({ baseSpeed: 102, item: 'ironball' }), 421, {});
    expect(result.rows.every((row) => row.result === 'cannot-reach')).toBe(true);
    expect(result.scarf).toBeNull();
  });

  it('is skipped while Unburden is on, which would remove the Scarf', () => {
    // Base 30, Unburden on (×2): neutral 252 EVs = 60 + 31 + 63 = 154 + 5 = 159 × 2 = 318.
    const result = solveOutspeed(you({ baseSpeed: 30, ability: 'unburden', abilityOn: true }), 421, {});
    expect(result.rows.every((row) => row.result === 'cannot-reach')).toBe(true);
    expect(result.scarf).toBeNull();
  });

  it('is not tried when some nature already reaches', () => {
    expect(solveOutspeed(you({ baseSpeed: 142 }), 333, {}).scarf).toBeNull();
  });
});

describe('modifiers and the field', () => {
  it('uses your modifiers and the shared field for both sides', () => {
    // Barraskewda (136) with Swift Swim in rain vs. a Dragapult with Choice Scarf (631).
    // Neutral, 0 EVs: 272 + 31 = 303 + 5 = 308 × 2 = 616. Needs 316+:
    // 8 EVs: 305 + 5 = 310 → 620 … 32 EVs: 311 + 5 = 316 → 632.
    const target = pokemon({ baseSpeed: 142, nature: 'plus', item: 'choicescarf' });
    const result = solveOutspeed(you({ baseSpeed: 136, ability: 'swiftswim' }), target, { weather: 'rain' });
    expect(result.target).toBe(631);
    expect(result.rows[1]).toEqual({ nature: 'neutral', result: 'reaches', ev: 32, speed: 632 });
  });

  it('ignores the field’s Trick Room setting: each solver sets its own', () => {
    const plain = solveOutspeed(you({ baseSpeed: 142 }), 333, {});
    expect(solveOutspeed(you({ baseSpeed: 142 }), 333, { trickRoom: true })).toEqual(plain);
    const under = solveUnderspeed(you({ baseSpeed: 35, iv: 0 }), 94, {});
    expect(solveUnderspeed(you({ baseSpeed: 35, iv: 0 }), 94, { trickRoom: true })).toEqual(under);
  });
});

describe('move order above 1809 in Trick Room', () => {
  it('a target at 1809 or more moves before slower Pokémon, so nothing underspeeds it', () => {
    // In Trick Room a target at 2000 acts at (10000 − 2000) mod 8192 = 8000, ahead of
    // anything slower than 1809, so "most EVs that still move first" has no answer.
    expect(solveUnderspeed(you({ baseSpeed: 100 }), 2000, {}).rows.every((row) => row.result === 'too-fast')).toBe(
      true,
    );
  });
});

describe('inputs', () => {
  it('does not change the objects passed in', () => {
    const yours = you({ baseSpeed: 102 });
    const before = { ...yours };
    solveOutspeed(yours, 421, {});
    expect(yours).toEqual(before);
  });

  it('rejects a target Speed that is not a whole number from 0 to 10000', () => {
    expect(() => solveOutspeed(you({ baseSpeed: 100 }), -1, {})).toThrow(RangeError);
    expect(() => solveOutspeed(you({ baseSpeed: 100 }), 10001, {})).toThrow(RangeError);
    expect(() => solveUnderspeed(you({ baseSpeed: 100 }), 1.5, {})).toThrow(RangeError);
  });

  it('agrees with speed() for the EVs it reports', () => {
    const row = solveOutspeed(you({ baseSpeed: 142 }), 333, {}).rows[1];
    expect(row?.result).toBe('reaches');
    if (row?.result === 'reaches') {
      expect(speed({ ...you({ baseSpeed: 142 }), ev: row.ev, nature: row.nature }, {}).speed).toBe(row.speed);
    }
  });
});
