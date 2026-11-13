import { Field as CalcField, Generations, Pokemon, Side } from '@smogon/calc';
// Not a public export of @smogon/calc (see docs/specs/rulesets.md, "Checking against Showdown").
// If an update moves it, this import fails loudly; the hand-worked tables still stand.
import { getFinalSpeed } from '@smogon/calc/dist/mechanics/util.js';
import { describe, expect, it } from 'vitest';
import { speed } from './speed.ts';
import type { Field, Nature, SpeedInput, Terrain, Weather } from './types.ts';

/**
 * Property test: the engine agrees with Pokémon Showdown's damage calculator
 * on random Generation 9 inputs. Covers every modifier in the spec except
 * Quick Powder (the calc needs a real Ditto) and Swamp (the calc has no Swamp).
 * Seeded, so a failure is reproducible.
 */
const CASES = 20_000;
const SEED = 0x5ca7f;

/** mulberry32: small, fast, seeded. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ITEMS = [
  undefined,
  'choicescarf',
  'ironball',
  'machobrace',
  'poweranklet',
  'powerband',
  'powerbelt',
  'powerbracer',
  'powerlens',
  'powerweight',
] as const;
const ABILITIES = [
  undefined,
  'swiftswim',
  'chlorophyll',
  'sandrush',
  'slushrush',
  'surgesurfer',
  'unburden',
  'quickfeet',
  'protosynthesis',
  'quarkdrive',
  'slowstart',
] as const;
const WEATHERS = [undefined, 'sun', 'rain', 'sand', 'snow'] as const;
const TERRAINS = [undefined, 'electric'] as const;
const NATURES = ['plus', 'neutral', 'minus'] as const;
const STATUSES = [undefined, 'par', 'other'] as const;

const CALC_NAMES: Record<string, string> = {
  choicescarf: 'Choice Scarf',
  ironball: 'Iron Ball',
  machobrace: 'Macho Brace',
  poweranklet: 'Power Anklet',
  powerband: 'Power Band',
  powerbelt: 'Power Belt',
  powerbracer: 'Power Bracer',
  powerlens: 'Power Lens',
  powerweight: 'Power Weight',
  swiftswim: 'Swift Swim',
  chlorophyll: 'Chlorophyll',
  sandrush: 'Sand Rush',
  slushrush: 'Slush Rush',
  surgesurfer: 'Surge Surfer',
  unburden: 'Unburden',
  quickfeet: 'Quick Feet',
  protosynthesis: 'Protosynthesis',
  quarkdrive: 'Quark Drive',
  slowstart: 'Slow Start',
};
const CALC_NATURE: Record<Nature, string> = { plus: 'Timid', neutral: 'Hardy', minus: 'Brave' };
const CALC_WEATHER: Record<Weather, 'Sun' | 'Rain' | 'Sand' | 'Snow'> = {
  sun: 'Sun',
  rain: 'Rain',
  sand: 'Sand',
  snow: 'Snow',
};

function pick<T>(random: () => number, options: readonly T[]): T {
  return options[Math.floor(random() * options.length)] as T;
}

function int(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

interface Case {
  input: SpeedInput;
  field: Field;
}

function randomCase(random: () => number): Case {
  const input: SpeedInput = {
    ruleset: 'gen9',
    baseSpeed: int(random, 1, 255),
    level: int(random, 1, 100),
    iv: int(random, 0, 31),
    ev: int(random, 0, 252),
    nature: pick(random, NATURES),
    stage: int(random, -6, 6),
  };
  const item = pick(random, ITEMS);
  const ability = pick(random, ABILITIES);
  const status = pick(random, STATUSES);
  if (item) input.item = item;
  if (ability) {
    input.ability = ability;
    input.abilityOn = random() < 0.5;
  }
  if (status) input.status = status;
  if (random() < 0.3) input.tailwind = true;

  const field: Field = {};
  const weather: Weather | undefined = pick(random, WEATHERS);
  const terrain: Terrain | undefined = pick(random, TERRAINS);
  if (weather) field.weather = weather;
  if (terrain) field.terrain = terrain;
  return { input, field };
}

const gen = Generations.get(9);

function calcSpeed({ input, field }: Case): number {
  const qpOn =
    (input.ability === 'protosynthesis' || input.ability === 'quarkdrive') && input.abilityOn === true;
  const pokemon = new Pokemon(gen, 'Mew', {
    level: input.level,
    nature: CALC_NATURE[input.nature],
    ivs: { spe: input.iv },
    evs: { spe: input.ev },
    boosts: { spe: input.stage },
    ...(input.item ? { item: CALC_NAMES[input.item] as never } : {}),
    ...(input.ability ? { ability: CALC_NAMES[input.ability] as never } : {}),
    ...(input.abilityOn !== undefined ? { abilityOn: input.abilityOn } : {}),
    // 'par' is paralysis; any other status stands in as a burn.
    ...(input.status ? { status: input.status === 'par' ? 'par' : 'brn' } : {}),
    // Protosynthesis and Quark Drive: "switched on" means Speed is the boosted stat.
    ...(qpOn ? { boostedStat: 'spe' } : {}),
    overrides: {
      baseStats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: input.baseSpeed },
    },
  });
  const calcField = new CalcField({
    ...(field.weather ? { weather: CALC_WEATHER[field.weather] } : {}),
    ...(field.terrain ? { terrain: 'Electric' } : {}),
  });
  const side = new Side({ isTailwind: input.tailwind === true });
  return getFinalSpeed(gen, pokemon, calcField, side);
}

describe('speed agrees with @smogon/calc', () => {
  it(`on ${CASES.toLocaleString('en')} random Generation 9 inputs`, () => {
    const random = rng(SEED);
    const mismatches: { case: Case; engine: number; calc: number }[] = [];
    for (let i = 0; i < CASES; i++) {
      const c = randomCase(random);
      const engine = speed(c.input, c.field).speed;
      const calc = calcSpeed(c);
      if (engine !== calc) mismatches.push({ case: c, engine, calc });
    }
    // Show the first few mismatches in full if any turn up.
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it('the oracle itself still gives a known value', () => {
    // Garchomp, +Spe, 252 EVs → 333 (spec table). Guards against the calc
    // changing under us in a way that makes every comparison meaningless.
    expect(
      calcSpeed({
        input: { ruleset: 'gen9', baseSpeed: 102, level: 100, iv: 31, ev: 252, nature: 'plus', stage: 0 },
        field: {},
      }),
    ).toBe(333);
  });
});
