import {
  calculateBasicSpeed,
  bruteForceSpeedEVs,
  returnCompleteSpeed,
} from './speedCalc';

// All expected values are level 50 / 31 IV unless stated, and were worked out
// by hand from the in-game formula (Gen 3+ stats, Gen 5+ battle modifiers).

const base = (overrides = {}) => ({
  ev: 252,
  iv: 31,
  lvl: 50,
  baseSpeed: 100,
  nature: 'neutral',
  boosts: 0,
  choicescarf: false,
  tailwind: false,
  weather: false,
  ...overrides,
});

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calculateBasicSpeed', () => {
  it('calculates a max-speed base 100 at level 50', () => {
    expect(calculateBasicSpeed(base())).toBe(152);
  });

  it('calculates 0 EVs', () => {
    expect(calculateBasicSpeed(base({ ev: 0 }))).toBe(120);
  });

  it('calculates level 100', () => {
    expect(calculateBasicSpeed(base({ lvl: 100 }))).toBe(299);
  });

  it('applies IVs', () => {
    expect(calculateBasicSpeed(base({ iv: 0, ev: 0 }))).toBe(105);
  });

  it('only counts every 4th EV', () => {
    expect(calculateBasicSpeed(base({ ev: 251 }))).toBe(
      calculateBasicSpeed(base({ ev: 248 }))
    );
  });

  describe('natures', () => {
    it.each([
      ['positive', 167],
      ['neutral', 152],
      ['negative', 136],
    ])('%s nature gives %i', (nature, expected) => {
      expect(calculateBasicSpeed(base({ nature }))).toBe(expected);
    });

    it('is case-insensitive', () => {
      expect(calculateBasicSpeed(base({ nature: 'Positive' }))).toBe(167);
    });

    it('treats an unknown nature as neutral', () => {
      expect(calculateBasicSpeed(base({ nature: 'jolly' }))).toBe(152);
    });
  });

  describe('boost stages', () => {
    it.each([
      [-6, 38],
      [-3, 60],
      [-1, 101],
      [0, 152],
      [1, 228],
      [2, 304],
      [6, 608],
    ])('stage %i gives %i', (boosts, expected) => {
      expect(calculateBasicSpeed(base({ boosts }))).toBe(expected);
    });

    it('clamps stages outside -6..+6', () => {
      expect(calculateBasicSpeed(base({ boosts: 7 }))).toBe(608);
      expect(calculateBasicSpeed(base({ boosts: -7 }))).toBe(38);
    });

    it('floors the stat before applying the stage', () => {
      // base 100, 40 EVs, positive = 137; 137 * 1.5 = 205.5 -> 205
      expect(
        calculateBasicSpeed(base({ ev: 40, nature: 'positive', boosts: 1 }))
      ).toBe(205);
    });
  });

  describe('flooring before nature (#23)', () => {
    // Inner value is (2*100 + 31 + 10) * 50 / 100 = 120.5 -> 120, +5 = 125.
    // 125 * 1.1 = 137.5 -> 137. The old formula kept the .5 and returned 138.
    it('positive nature at an odd stat total', () => {
      expect(calculateBasicSpeed(base({ ev: 40, nature: 'positive' }))).toBe(137);
    });

    // (200 + 31 + 2) * 0.5 = 116.5 -> 116, +5 = 121; 121 * 0.9 = 108.9 -> 108 (old: 109)
    it('negative nature at an odd stat total', () => {
      expect(calculateBasicSpeed(base({ ev: 8, nature: 'negative' }))).toBe(108);
    });

    it('neutral nature is unaffected', () => {
      expect(calculateBasicSpeed(base({ ev: 40 }))).toBe(125);
    });
  });

  describe('field and item modifiers', () => {
    it('Choice Scarf is x1.5', () => {
      expect(calculateBasicSpeed(base({ choicescarf: true }))).toBe(228);
    });

    it('Tailwind is x2', () => {
      expect(calculateBasicSpeed(base({ tailwind: true }))).toBe(304);
    });

    it('weather (Swift Swim etc.) is x2', () => {
      expect(calculateBasicSpeed(base({ weather: true }))).toBe(304);
    });

    it('Scarf and Tailwind stack', () => {
      expect(
        calculateBasicSpeed(base({ choicescarf: true, tailwind: true }))
      ).toBe(456);
    });

    it('rounds Choice Scarf half down', () => {
      // base 101, 0 EVs, neutral = 121; 121 * 1.5 = 181.5 -> 181
      expect(
        calculateBasicSpeed(base({ baseSpeed: 101, ev: 0, choicescarf: true }))
      ).toBe(181);
    });

    it('chains modifiers into one multiplier before rounding', () => {
      // Scarf + Tailwind chain to x3: 121 * 3 = 363.
      // (Flooring after each step would give 181 * 2 = 362.)
      expect(
        calculateBasicSpeed(
          base({ baseSpeed: 101, ev: 0, choicescarf: true, tailwind: true })
        )
      ).toBe(363);
    });

    it('applies the stage before modifiers', () => {
      // 152 at +1 = 228; with Scarf 228 * 1.5 = 342
      expect(
        calculateBasicSpeed(base({ boosts: 1, choicescarf: true }))
      ).toBe(342);
    });
  });
});

describe('bruteForceSpeedEVs', () => {
  it('finds the minimum EVs to outspeed', () => {
    // base 95 max speed = 147; base 100 neutral needs 220 EVs for 148
    expect(bruteForceSpeedEVs(base({ ev: 0 }), 147)).toEqual({
      ev: 220,
      speed: 148,
      win: true,
      speedToBeat: 147,
    });
  });

  it('returns 0 EVs when already faster', () => {
    expect(bruteForceSpeedEVs(base({ baseSpeed: 130 }), 120)).toEqual({
      ev: 0,
      speed: 150,
      win: true,
      speedToBeat: 120,
    });
  });

  it('treats a speed tie as a loss', () => {
    expect(bruteForceSpeedEVs(base(), 152)).toEqual({
      ev: 252,
      speed: 152,
      win: false,
      speedToBeat: 152,
    });
  });

  it('reports a loss at 252 EVs when it cannot outspeed', () => {
    expect(bruteForceSpeedEVs(base({ baseSpeed: 60 }), 152)).toMatchObject({
      ev: 252,
      win: false,
    });
  });

  it('ignores any EVs passed in', () => {
    expect(bruteForceSpeedEVs(base({ ev: 252 }), 147).ev).toBe(220);
  });
});

describe('returnCompleteSpeed', () => {
  it('returns the speed to beat', () => {
    const out = returnCompleteSpeed(base({ ev: 0 }), base({ baseSpeed: 95 }));
    expect(out.speedToBeat).toBe(147);
  });

  it('returns one result per nature when Scarf is not needed', () => {
    const out = returnCompleteSpeed(base({ ev: 0 }), base({ baseSpeed: 95 }));

    expect(out.choicescarf).toBe(false);
    expect(out.results.map((r) => r.label)).toEqual([
      'negative',
      'neutral',
      'positive',
    ]);
    expect(out.results.every((r) => r.choicescarf === false)).toBe(true);

    const neutral = out.results.find((r) => r.label === 'neutral');
    expect(neutral).toMatchObject({ ev: 220, speed: 148, win: true });
  });

  it('adds Choice Scarf results when no nature can outspeed', () => {
    const out = returnCompleteSpeed(
      base({ baseSpeed: 60, ev: 0 }),
      base({ baseSpeed: 100 })
    );

    expect(out.choicescarf).toBe(true);
    expect(out.results).toHaveLength(6);
    expect(out.results.slice(0, 3).every((r) => !r.win)).toBe(true);
    expect(out.results.slice(3).every((r) => r.choicescarf)).toBe(true);
  });

  it('restores the choicescarf flag on the input', () => {
    const pokemon = base({ baseSpeed: 60, ev: 0, choicescarf: false });
    returnCompleteSpeed(pokemon, base({ baseSpeed: 100 }));
    expect(pokemon.choicescarf).toBe(false);
  });

  // #15: the inputs are React state, so they must not be modified.
  it.each([
    ['without Scarf', base({ ev: 0, nature: 'neutral' }), base({ baseSpeed: 95 })],
    ['with Scarf', base({ baseSpeed: 60, ev: 0, nature: 'neutral' }), base()],
  ])('does not modify its inputs (%s)', (_, pokemon, pokemonToBeat) => {
    const pokemonBefore = structuredClone(pokemon);
    const toBeatBefore = structuredClone(pokemonToBeat);

    returnCompleteSpeed(pokemon, pokemonToBeat);

    expect(pokemon).toEqual(pokemonBefore);
    expect(pokemonToBeat).toEqual(toBeatBefore);
  });

  it('records the stats used for each result', () => {
    const out = returnCompleteSpeed(
      base({ baseSpeed: 60, ev: 0 }),
      base({ baseSpeed: 100 })
    );

    expect(out.results.map((r) => [r.stats.nature, r.stats.choicescarf])).toEqual([
      ['negative', false],
      ['neutral', false],
      ['positive', false],
      ['negative', true],
      ['neutral', true],
      ['positive', true],
    ]);
  });

  it('does not log to the console', () => {
    // The Scarf path is the one that used to log.
    returnCompleteSpeed(base({ baseSpeed: 60, ev: 0 }), base());
    expect(console.log).not.toHaveBeenCalled();
  });

  it('recommends enough EVs to actually outspeed (#23)', () => {
    // Base 100 positive vs. max-speed base 100 neutral (152).
    // 152 EVs: (200+31+38)*0.5 = 134.5 -> 134, +5 = 139, *1.1 = 152 (a tie).
    // 156 EVs: (200+31+39)*0.5 = 135, +5 = 140, *1.1 = 154. Nothing in between helps.
    const out = returnCompleteSpeed(base({ ev: 0 }), base());
    const positive = out.results.find((r) => r.label === 'positive');

    expect(positive).toMatchObject({ ev: 156, speed: 154, win: true });
  });

  describe('when your Pokémon already holds a Choice Scarf (#48)', () => {
    // Base 60 with Scarf vs. max-speed base 100 neutral (152).
    // Neutral:  (120+31+43)/2 = 97, +5 = 102, x1.5 = 153 -> 172 EVs.
    // Positive: (120+31+25)/2 = 88, +5 = 93, x1.1 = 102, x1.5 = 153 -> 100 EVs.
    // Negative: (120+31+63)/2 = 107, +5 = 112, x0.9 = 100, x1.5 = 150 -> can't win.
    const scarfed = () => base({ baseSpeed: 60, ev: 0, choicescarf: true });

    it('marks every result as using a Scarf', () => {
      const out = returnCompleteSpeed(scarfed(), base());
      expect(out.results.map((r) => r.choicescarf)).toEqual([true, true, true]);
    });

    it('calculates with the Scarf', () => {
      const out = returnCompleteSpeed(scarfed(), base());
      expect(out.results.map(({ label, ev, speed, win }) => ({ label, ev, speed, win }))).toEqual([
        { label: 'negative', ev: 252, speed: 150, win: false },
        { label: 'neutral', ev: 172, speed: 153, win: true },
        { label: 'positive', ev: 100, speed: 153, win: true },
      ]);
      expect(out.choicescarf).toBe(false);
    });

    it('does not add duplicate Scarf rows or say a Scarf is required when it still loses', () => {
      // Base 30 with Scarf vs. max-speed base 150 (202): best case is
      // (60+31+63)/2 = 77, +5 = 82, x1.1 = 90, x1.5 = 135.
      const out = returnCompleteSpeed(
        base({ baseSpeed: 30, ev: 0, choicescarf: true }),
        base({ baseSpeed: 150 })
      );

      expect(out.speedToBeat).toBe(202);
      expect(out.results).toHaveLength(3);
      expect(out.results.every((r) => !r.win && r.choicescarf)).toBe(true);
      expect(out.choicescarf).toBe(false);
    });
  });
});
