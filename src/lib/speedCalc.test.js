import {
  calculateBasicSpeed,
  bruteForceSpeedEVs,
  returnCompleteSpeed,
} from './speedCalc';

// All expected values are level 50 / 31 IV unless stated, and were checked
// against the in-game stat formula. Cases where the current formula is known
// to disagree with the game are tracked in #23 and are deliberately avoided
// here (see the it.todo at the bottom).

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
  // returnCompleteSpeed logs its output; keep test output clean.
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
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

    it('floors after each modifier', () => {
      // base 101, 0 EVs, neutral = 121; 121 * 1.5 = 181.5 -> 181; * 2 = 362
      expect(
        calculateBasicSpeed(
          base({ baseSpeed: 101, ev: 0, choicescarf: true, tailwind: true })
        )
      ).toBe(362);
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

  it.todo(
    'matches in-game speed for positive/negative natures at odd stat totals (#23)'
  );
});
