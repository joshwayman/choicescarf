import { describe, expect, it } from 'vitest';
import { solveOutspeed } from './solve.ts';
import { speed } from './speed.ts';
import type { SolverInput, SpeedInput } from './types.ts';

/**
 * Parity with v4. Every case in v4's src/lib/speedCalc.test.js (on `main`)
 * that solves for EVs, with v4's hand-worked values. v4 defaults to level 50
 * and 31 IVs; its "weather" checkbox is Swift Swim in rain here.
 */
function you(overrides: Partial<SolverInput> = {}): SolverInput {
  return { ruleset: 'gen9', level: 50, iv: 31, stage: 0, baseSpeed: 100, ...overrides };
}

function maxSpeed(baseSpeed: number, extra: Partial<SpeedInput> = {}): number {
  return speed({ ruleset: 'gen9', level: 50, iv: 31, ev: 252, nature: 'neutral', stage: 0, baseSpeed, ...extra }, {})
    .speed;
}

describe('v4 parity: bruteForceSpeedEVs', () => {
  it('finds the minimum EVs to outspeed: base 100 needs 220 EVs for 148 against 147', () => {
    expect(maxSpeed(95)).toBe(147);
    expect(solveOutspeed(you(), 147, {}).rows[1]).toEqual({ nature: 'neutral', result: 'reaches', ev: 220, speed: 148 });
  });

  it('returns 0 EVs when already faster: base 130 is 150 against 120', () => {
    expect(solveOutspeed(you({ baseSpeed: 130 }), 120, {}).rows[1]).toEqual({
      nature: 'neutral',
      result: 'reaches',
      ev: 0,
      speed: 150,
    });
  });

  it('treats a speed tie as a loss: base 100 at 252 EVs ties 152', () => {
    expect(solveOutspeed(you(), 152, {}).rows[1]).toEqual({ nature: 'neutral', result: 'cannot-reach', speed: 152 });
  });

  it('reports a loss when it cannot outspeed: base 60 against 152', () => {
    expect(solveOutspeed(you({ baseSpeed: 60 }), 152, {}).rows[1]?.result).toBe('cannot-reach');
  });
});

describe('v4 parity: returnCompleteSpeed', () => {
  it('no Scarf needed: neutral needs 220 EVs (148) against base 95 (147)', () => {
    const result = solveOutspeed(you(), 147, {});
    expect(result.scarf).toBeNull();
    expect(result.rows.map((row) => row.nature)).toEqual(['plus', 'neutral', 'minus']);
    expect(result.rows[1]).toMatchObject({ ev: 220, speed: 148 });
  });

  it('adds Choice Scarf rows when no nature can outspeed: base 60 against 152', () => {
    const result = solveOutspeed(you({ baseSpeed: 60 }), 152, {});
    expect(result.rows.every((row) => row.result === 'cannot-reach')).toBe(true);
    expect(result.scarf).toHaveLength(3);
  });

  it('recommends enough EVs to actually outspeed (#23): +Spe base 100 needs 156 EVs (154) against 152', () => {
    // 152 EVs: 134 + 5 = 139 × 1.1 = 152.9 → 152, a tie. 156 EVs: 140 × 1.1 = 154.
    expect(solveOutspeed(you(), 152, {}).rows[0]).toEqual({ nature: 'plus', result: 'reaches', ev: 156, speed: 154 });
  });

  describe('when your Pokémon already holds a Choice Scarf (#48)', () => {
    // Base 60 with Scarf against max-speed base 100 neutral (152).
    const scarfed = you({ baseSpeed: 60, item: 'choicescarf' });

    it('calculates with the Scarf: −Spe cannot (150), neutral 172 (153), +Spe 100 (153)', () => {
      const result = solveOutspeed(scarfed, 152, {});
      expect(result.rows).toEqual([
        { nature: 'plus', result: 'reaches', ev: 100, speed: 153 },
        { nature: 'neutral', result: 'reaches', ev: 172, speed: 153 },
        { nature: 'minus', result: 'cannot-reach', speed: 150 },
      ]);
      expect(result.scarf).toBeNull();
    });

    it('does not add Scarf rows when it still loses: base 30 with Scarf against base 150 (202)', () => {
      expect(maxSpeed(150)).toBe(202);
      const result = solveOutspeed(you({ baseSpeed: 30, item: 'choicescarf' }), 202, {});
      expect(result.rows.every((row) => row.result === 'cannot-reach')).toBe(true);
      expect(result.scarf).toBeNull();
    });
  });
});

describe('v4 parity: the Speed values its solver relied on', () => {
  // calculateBasicSpeed cases from v4, through v5's speed().
  it.each([
    ['max-speed base 100', {}, 152],
    ['0 EVs', { ev: 0 }, 120],
    ['level 100', { level: 100 }, 299],
    ['0 IVs and EVs', { iv: 0, ev: 0 }, 105],
    ['+Spe', { nature: 'plus' }, 167],
    ['−Spe', { nature: 'minus' }, 136],
    ['stage −6', { stage: -6 }, 38],
    ['stage −3', { stage: -3 }, 60],
    ['stage −1', { stage: -1 }, 101],
    ['stage +1', { stage: 1 }, 228],
    ['stage +2', { stage: 2 }, 304],
    ['stage +6', { stage: 6 }, 608],
    ['floors the stat before the stage', { ev: 40, nature: 'plus', stage: 1 }, 205],
    ['floors before nature (#23), +Spe', { ev: 40, nature: 'plus' }, 137],
    ['floors before nature (#23), −Spe', { ev: 8, nature: 'minus' }, 108],
    ['Choice Scarf', { item: 'choicescarf' }, 228],
    ['Tailwind', { tailwind: true }, 304],
    ['Scarf and Tailwind', { item: 'choicescarf', tailwind: true }, 456],
    ['Scarf rounds half down (base 101, 0 EVs)', { baseSpeed: 101, ev: 0, item: 'choicescarf' }, 181],
    ['Scarf and Tailwind chain (base 101, 0 EVs)', { baseSpeed: 101, ev: 0, item: 'choicescarf', tailwind: true }, 363],
    ['stage before modifiers', { stage: 1, item: 'choicescarf' }, 342],
  ] as const)('%s → %i', (_, extra, expected) => {
    expect(maxSpeed('baseSpeed' in extra ? extra.baseSpeed : 100, extra)).toBe(expected);
  });

  it('weather (Swift Swim in rain) → 304', () => {
    expect(
      speed(
        { ruleset: 'gen9', level: 50, iv: 31, ev: 252, nature: 'neutral', stage: 0, baseSpeed: 100, ability: 'swiftswim' },
        { weather: 'rain' },
      ).speed,
    ).toBe(304);
  });
});
