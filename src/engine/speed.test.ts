import { describe, expect, it } from 'vitest';
import { speed } from './speed.ts';
import type { Field, SpeedInput } from './types.ts';

/**
 * Every row of the Speed table in docs/specs/rulesets.md. The expected values
 * were worked out by hand from the in-game formula (the "Working" column) and
 * checked against @smogon/calc; they are not taken from this code's output.
 * All at level 100 with 31 IVs unless stated.
 */
function input(overrides: Partial<SpeedInput> & Pick<SpeedInput, 'baseSpeed'>): SpeedInput {
  return {
    ruleset: 'gen9',
    level: 100,
    iv: 31,
    ev: 252,
    nature: 'neutral',
    stage: 0,
    ...overrides,
  };
}

const noField: Field = {};

const cases: { name: string; input: SpeedInput; field?: Field; expected: number }[] = [
  {
    name: 'Garchomp (base 102), +Spe, 252 EVs',
    input: input({ baseSpeed: 102, nature: 'plus' }),
    expected: 333,
  },
  {
    name: 'Garchomp at level 50',
    input: input({ baseSpeed: 102, nature: 'plus', level: 50 }),
    expected: 169,
  },
  {
    name: 'Garchomp at +1',
    input: input({ baseSpeed: 102, nature: 'plus', stage: 1 }),
    expected: 499,
  },
  {
    name: 'Garchomp at −1',
    input: input({ baseSpeed: 102, nature: 'plus', stage: -1 }),
    expected: 222,
  },
  {
    name: 'Garchomp at −1 with Choice Scarf',
    input: input({ baseSpeed: 102, nature: 'plus', stage: -1, item: 'choicescarf' }),
    expected: 333,
  },
  {
    name: 'Dragapult (142), +Spe, 252 EVs',
    input: input({ baseSpeed: 142, nature: 'plus' }),
    expected: 421,
  },
  {
    name: 'Dragapult with Choice Scarf (631.5 rounds half down)',
    input: input({ baseSpeed: 142, nature: 'plus', item: 'choicescarf' }),
    expected: 631,
  },
  {
    name: 'Dragapult with Choice Scarf, paralysed',
    input: input({ baseSpeed: 142, nature: 'plus', item: 'choicescarf', status: 'par' }),
    expected: 315,
  },
  {
    name: 'Kingambit (50), −Spe, 0 EVs, 0 IVs',
    input: input({ baseSpeed: 50, nature: 'minus', ev: 0, iv: 0 }),
    expected: 94,
  },
  {
    name: 'Kingambit with Iron Ball',
    input: input({ baseSpeed: 50, nature: 'minus', ev: 0, iv: 0, item: 'ironball' }),
    expected: 47,
  },
  {
    name: 'Barraskewda (136), neutral, 252 EVs',
    input: input({ baseSpeed: 136 }),
    expected: 371,
  },
  {
    name: 'Barraskewda, Swift Swim, no rain',
    input: input({ baseSpeed: 136, ability: 'swiftswim' }),
    expected: 371,
  },
  {
    name: 'Barraskewda, Swift Swim, rain',
    input: input({ baseSpeed: 136, ability: 'swiftswim' }),
    field: { weather: 'rain' },
    expected: 742,
  },
  {
    name: 'Barraskewda, +Spe, Swift Swim, rain, Choice Scarf',
    input: input({ baseSpeed: 136, nature: 'plus', ability: 'swiftswim', item: 'choicescarf' }),
    field: { weather: 'rain' },
    expected: 1224,
  },
  {
    name: 'Gardevoir (80), +Spe, 252 EVs, paralysed',
    input: input({ baseSpeed: 80, nature: 'plus', status: 'par' }),
    expected: 142,
  },
  {
    name: 'Ursaluna (50), −Spe, 0 EVs, Quick Feet, burned',
    input: input({ baseSpeed: 50, nature: 'minus', ev: 0, ability: 'quickfeet', status: 'other' }),
    expected: 183,
  },
  {
    name: 'Ursaluna, neutral, 252 EVs, Quick Feet, paralysed (no paralysis drop)',
    input: input({ baseSpeed: 50, ability: 'quickfeet', status: 'par' }),
    expected: 298,
  },
  {
    name: 'Flutter Mane (135), +Spe, 252 EVs, Protosynthesis on',
    input: input({ baseSpeed: 135, nature: 'plus', ability: 'protosynthesis', abilityOn: true }),
    expected: 607,
  },
  {
    name: 'Flutter Mane, Protosynthesis, Choice Scarf, Tailwind (chained, not 1820)',
    input: input({
      baseSpeed: 135,
      nature: 'plus',
      ability: 'protosynthesis',
      abilityOn: true,
      item: 'choicescarf',
      tailwind: true,
    }),
    expected: 1822,
  },
  {
    name: 'Regigigas (100), +Spe, 252 EVs, Slow Start on',
    input: input({ baseSpeed: 100, nature: 'plus', ability: 'slowstart', abilityOn: true }),
    expected: 164,
  },
  {
    name: 'Hawlucha (118), +Spe, 252 EVs, Unburden on',
    input: input({ baseSpeed: 118, nature: 'plus', ability: 'unburden', abilityOn: true }),
    expected: 736,
  },
  {
    name: 'Great Tusk (87), +Spe, 252 EVs, level 50, Tailwind',
    input: input({ baseSpeed: 87, nature: 'plus', level: 50, tailwind: true }),
    expected: 304,
  },
  {
    name: 'Regieleki (200), +Spe, 252 EVs, +6, Choice Scarf, Tailwind',
    input: input({ baseSpeed: 200, nature: 'plus', stage: 6, item: 'choicescarf', tailwind: true }),
    expected: 6576,
  },
];

describe('speed: the spec table', () => {
  it.each(cases)('$name → $expected', ({ input: speedInput, field, expected }) => {
    expect(speed(speedInput, field ?? noField).speed).toBe(expected);
  });
});

/**
 * Modifiers in the spec's modifier table that the Speed table above does not
 * reach. Worked by hand from the same formula.
 */
describe('speed: the rest of the modifier table', () => {
  // Barraskewda neutral, 252 EVs: 371 before modifiers.
  const barraskewda = input({ baseSpeed: 136 });

  it.each([
    { ability: 'chlorophyll', weather: 'sun' },
    { ability: 'sandrush', weather: 'sand' },
    { ability: 'slushrush', weather: 'snow' },
  ] as const)('$ability doubles Speed in $weather (371 → 742)', ({ ability, weather }) => {
    expect(speed({ ...barraskewda, ability }, { weather }).speed).toBe(742);
    expect(speed({ ...barraskewda, ability }, {}).speed).toBe(371);
  });

  it('Swift Swim does nothing in the wrong weather', () => {
    expect(speed({ ...barraskewda, ability: 'swiftswim' }, { weather: 'sun' }).speed).toBe(371);
  });

  it('Surge Surfer doubles Speed in Electric Terrain only', () => {
    expect(speed({ ...barraskewda, ability: 'surgesurfer' }, { terrain: 'electric' }).speed).toBe(742);
    expect(speed({ ...barraskewda, ability: 'surgesurfer' }, {}).speed).toBe(371);
  });

  it('Quark Drive is ×1.5 when switched on: 371 × 1.5 = 556.5 → 556', () => {
    expect(speed({ ...barraskewda, ability: 'quarkdrive', abilityOn: true }, {}).speed).toBe(556);
    expect(speed({ ...barraskewda, ability: 'quarkdrive', abilityOn: false }, {}).speed).toBe(371);
  });

  it('switched-on abilities do nothing until switched on', () => {
    for (const ability of ['protosynthesis', 'slowstart', 'unburden']) {
      expect(speed({ ...barraskewda, ability }, {}).speed).toBe(371);
    }
  });

  it.each([
    'machobrace',
    'poweranklet',
    'powerband',
    'powerbelt',
    'powerbracer',
    'powerlens',
    'powerweight',
  ])('%s halves Speed: 371 × 0.5 = 185.5 → 185', (item) => {
    expect(speed({ ...barraskewda, item }, {}).speed).toBe(185);
  });

  it('Quick Powder doubles an untransformed Ditto only', () => {
    // Ditto (48), neutral, 252 EVs: 96 + 31 + 63 = 190; + 5 = 195.
    const ditto = input({ baseSpeed: 48, item: 'quickpowder' });
    expect(speed({ ...ditto, species: 'ditto' }, {}).speed).toBe(390);
    expect(speed({ ...ditto, species: 'mew' }, {}).speed).toBe(195);
    expect(speed(ditto, {}).speed).toBe(195);
  });

  it('Swamp quarters Speed: 371 × 0.25 = 92.75, rounded to nearest → 93', () => {
    // Half down only decides an exact .5; anything else rounds to the nearest.
    expect(speed({ ...barraskewda, swamp: true }, {}).speed).toBe(93);
  });

  it('Unburden switched on ignores the item', () => {
    // 371 × 2 = 742, with no Choice Scarf on top.
    expect(
      speed({ ...barraskewda, ability: 'unburden', abilityOn: true, item: 'choicescarf' }, {}).speed,
    ).toBe(742);
  });

  it('Quick Feet needs a status', () => {
    expect(speed({ ...barraskewda, ability: 'quickfeet' }, {}).speed).toBe(371);
  });

  it('the lowest chain is not clamped: Swamp, Iron Ball, Slow Start', () => {
    // 0.25 × 0.5 × 0.5 = 256/4096. 371 × 256 / 4096 = 23.1875 → 23.
    // (@smogon/calc clamps a chain to 410/4096; the simulator does not.)
    expect(
      speed(
        { ...barraskewda, swamp: true, item: 'ironball', ability: 'slowstart', abilityOn: true },
        {},
      ).speed,
    ).toBe(23);
  });

  it('Speed is capped at 10000', () => {
    // Regieleki at +6 with Scarf and Tailwind is 6576 (above). Add Swift Swim's
    // ×2 by imagining base 200 with it: 548 × 4 = 2192, × 6 = 13152 → 10000.
    expect(
      speed(
        input({
          baseSpeed: 200,
          nature: 'plus',
          stage: 6,
          item: 'choicescarf',
          tailwind: true,
          ability: 'swiftswim',
        }),
        { weather: 'rain' },
      ).speed,
    ).toBe(10000);
  });

  it('Speed can reach 0: there is no floor of 1', () => {
    // Base 5, −Spe, 0 IVs, 0 EVs, level 1: floor(10 / 100) + 5 = 5; × 0.9 = 4.5 → 4;
    // −6: 4 × 2 / 8 = 1; Swamp: 1 × 0.25 = 0.25 → 0; paralysis: 0.
    // The simulator's getStat has no minimum for Speed, so neither does the engine.
    expect(
      speed(input({ baseSpeed: 5, nature: 'minus', iv: 0, ev: 0, level: 1, stage: -6, swamp: true, status: 'par' }), {})
        .speed,
    ).toBe(0);
  });
});

describe('speed: steps for "Show calc"', () => {
  it('lists each step that changed the Speed, in order', () => {
    // Flutter Mane, Protosynthesis, Choice Scarf, Tailwind: 369 → 405 → ×4.5 = 1822.
    const result = speed(
      input({
        baseSpeed: 135,
        nature: 'plus',
        ability: 'protosynthesis',
        abilityOn: true,
        item: 'choicescarf',
        tailwind: true,
      }),
      {},
    );
    expect(result.steps).toEqual([
      { step: 'stat', value: 369 },
      { step: 'nature', nature: 'plus', value: 405 },
      { step: 'modifiers', combined: 18432, value: 1822 },
    ]);
    expect(result.modifiers.map((modifier) => [modifier.id, modifier.active])).toEqual([
      ['tailwind', true],
      ['protosynthesis', true],
      ['choicescarf', true],
    ]);
  });

  it('includes the stage, paralysis and cap steps when they apply', () => {
    // Dragapult +1, paralysed: 421 × 3/2 = 631.5 → 631; × 0.5 = 315.
    expect(speed(input({ baseSpeed: 142, nature: 'plus', stage: 1, status: 'par' }), {}).steps).toEqual([
      { step: 'stat', value: 383 },
      { step: 'nature', nature: 'plus', value: 421 },
      { step: 'stage', stage: 1, value: 631 },
      { step: 'paralysis', value: 315 },
    ]);
    const capped = speed(
      input({ baseSpeed: 200, nature: 'plus', stage: 6, item: 'choicescarf', tailwind: true, ability: 'swiftswim' }),
      { weather: 'rain' },
    );
    expect(capped.steps.at(-2)).toEqual({ step: 'modifiers', combined: 24576, value: 13152 });
    expect(capped.steps.at(-1)).toEqual({ step: 'cap', value: 10000 });
  });

  it('only has the stat step for a plain set', () => {
    expect(speed(input({ baseSpeed: 136 }), {}).steps).toEqual([{ step: 'stat', value: 371 }]);
  });
});

describe('speed: modifiers that do not count, and why', () => {
  const barraskewda = input({ baseSpeed: 136 });

  it.each([
    [{ ability: 'swiftswim' }, {}, 'needs-weather'],
    [{ ability: 'surgesurfer' }, {}, 'needs-terrain'],
    [{ ability: 'quickfeet' }, {}, 'needs-status'],
    [{ ability: 'protosynthesis' }, {}, 'switched-off'],
    [{ ability: 'slowstart', abilityOn: false }, {}, 'switched-off'],
    [{ item: 'quickpowder', species: 'mew' }, {}, 'wrong-species'],
  ] as const)('%o in %o is inactive: %s', (extra, field, reason) => {
    const result = speed({ ...barraskewda, ...extra }, field);
    expect(result.modifiers).toHaveLength(1);
    expect(result.modifiers[0]).toMatchObject({ active: false, reason });
    expect(result.speed).toBe(371);
  });

  it('marks the item as removed while Unburden is on', () => {
    const result = speed({ ...barraskewda, ability: 'unburden', abilityOn: true, item: 'choicescarf' }, {});
    expect(result.modifiers).toEqual([
      { id: 'unburden', name: 'Unburden', slot: 'ability', multiplier: 8192, active: true },
      {
        id: 'choicescarf',
        name: 'Choice Scarf',
        slot: 'item',
        multiplier: 6144,
        active: false,
        reason: 'item-removed',
      },
    ]);
  });
});

describe('speed: input checks', () => {
  const valid = input({ baseSpeed: 100 });

  it.each([
    ['baseSpeed', 0],
    ['baseSpeed', 256],
    ['level', 0],
    ['level', 101],
    ['iv', -1],
    ['iv', 32],
    ['ev', -4],
    ['ev', 253],
    ['stage', -7],
    ['stage', 7],
    ['level', 50.5],
    ['ev', Number.NaN],
  ] as const)('rejects %s = %d', (key, value) => {
    expect(() => speed({ ...valid, [key]: value }, {})).toThrow(RangeError);
  });

  it('accepts EVs that are not a multiple of 4, as the games do', () => {
    // floor(251 / 4) = 62 = floor(248 / 4).
    expect(speed({ ...valid, ev: 251 }, {}).speed).toBe(speed({ ...valid, ev: 248 }, {}).speed);
  });

  it('rejects an unknown item or ability, or one in the wrong slot', () => {
    expect(() => speed({ ...valid, item: 'lifeorb' }, {})).toThrow('Generation 9 has no modifier "lifeorb"');
    expect(() => speed({ ...valid, ability: 'choicescarf' }, {})).toThrow('"choicescarf" is an item modifier, not an ability one');
    expect(() => speed({ ...valid, item: 'tailwind' }, {})).toThrow('"tailwind" is a side modifier, not an item one');
  });
});
