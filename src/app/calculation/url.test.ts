import { describe, expect, it } from 'vitest';
import { emptyCalculation, withTrickRoom, type Calculation } from './state.ts';
import { SEARCH_KEYS, canonical, decode, encode, parseQuery, stringifyQuery, type SearchParams } from './url.ts';

/** The full trip a link makes: state → query string → state. */
function roundTrip(calc: Calculation): Calculation {
  return decode(parseQuery(stringifyQuery(encode(calc))));
}

function with_(change: (calc: Calculation) => void): Calculation {
  const calc = emptyCalculation();
  change(calc);
  return calc;
}

describe('a fresh calculation', () => {
  it('writes nothing, so the link is just the path', () => {
    expect(encode(emptyCalculation())).toEqual({});
    expect(stringifyQuery(encode(emptyCalculation()))).toBe('');
  });

  it('is what an empty query reads as', () => {
    expect(decode({})).toEqual(emptyCalculation());
  });
});

describe('round trips, field by field', () => {
  const cases: [string, (calc: Calculation) => void, Record<string, string>][] = [
    ['target species', (c) => (c.target.species = 'garchomp'), { 't': 'garchomp' }],
    ['target base Speed, custom', (c) => (c.target.baseSpeed = 77), { 't.base': '77' }],
    ['target base Speed over a species', (c) => ((c.target.species = 'garchomp'), (c.target.baseSpeed = 110)), { 't': 'garchomp', 't.base': '110' }],
    ['target level', (c) => (c.target.level = 50), { 't.lv': '50' }],
    ['target IVs', (c) => (c.target.iv = 0), { 't.iv': '0' }],
    ['target EVs', (c) => (c.target.ev = 148), { 't.ev': '148' }],
    ['target nature', (c) => (c.target.nature = 'neutral'), { 't.nat': 'neutral' }],
    ['target stage', (c) => (c.target.stage = -2), { 't.stage': '-2' }],
    ['target item', (c) => (c.target.item = 'choicescarf'), { 't.item': 'choicescarf' }],
    ['target ability', (c) => (c.target.ability = 'swiftswim'), { 't.ability': 'swiftswim' }],
    ['target ability switched on', (c) => ((c.target.ability = 'unburden'), (c.target.abilityOn = true)), { 't.ability': 'unburden', 't.on': '1' }],
    ['target paralysis', (c) => (c.target.status = 'par'), { 't.status': 'par' }],
    ['target other status', (c) => (c.target.status = 'other'), { 't.status': 'other' }],
    ['target Tailwind', (c) => (c.target.tailwind = true), { 't.tw': '1' }],
    ['target Swamp', (c) => (c.target.swamp = true), { 't.swamp': '1' }],
    ['your species', (c) => (c.you.species = 'dragapult'), { 'y': 'dragapult' }],
    ['your base Speed', (c) => (c.you.baseSpeed = 200), { 'y.base': '200' }],
    ['your level', (c) => (c.you.level = 99), { 'y.lv': '99' }],
    ['your IVs', (c) => (c.you.iv = 20), { 'y.iv': '20' }],
    ['your stage', (c) => (c.you.stage = 6), { 'y.stage': '6' }],
    ['your item', (c) => (c.you.item = 'ironball'), { 'y.item': 'ironball' }],
    ['your ability', (c) => (c.you.ability = 'quickfeet'), { 'y.ability': 'quickfeet' }],
    ['your ability switched on', (c) => ((c.you.ability = 'protosynthesis'), (c.you.abilityOn = true)), { 'y.ability': 'protosynthesis', 'y.on': '1' }],
    ['your status', (c) => (c.you.status = 'other'), { 'y.status': 'other' }],
    ['your Tailwind', (c) => (c.you.tailwind = true), { 'y.tw': '1' }],
    ['your Swamp', (c) => (c.you.swamp = true), { 'y.swamp': '1' }],
    ['weather', (c) => (c.field.weather = 'rain'), { weather: 'rain' }],
    ['terrain', (c) => (c.field.terrain = 'electric'), { terrain: 'electric' }],
    ['Trick Room', (c) => Object.assign(c, withTrickRoom(c, true)), { tr: '1' }],
  ];

  it.each(cases)('%s', (_name, change, written) => {
    const calc = with_(change);
    expect(encode(calc)).toEqual({ v: '1', ...written });
    expect(roundTrip(calc)).toEqual(calc);
  });

  it('every field at once', () => {
    const calc = with_((c) => {
      c.target = {
        species: 'barraskewda',
        baseSpeed: 140,
        level: 77,
        iv: 12,
        ev: 100,
        nature: 'neutral',
        stage: 3,
        item: 'choicescarf',
        ability: 'swiftswim',
        abilityOn: true,
        status: 'par',
        tailwind: true,
        swamp: true,
      };
      c.you = {
        species: 'flutterMane'.toLowerCase(),
        level: 50,
        iv: 0,
        stage: -6,
        item: 'powerweight',
        ability: 'protosynthesis',
        abilityOn: true,
        status: 'other',
        tailwind: true,
        swamp: true,
      };
      c.field = { weather: 'sun', terrain: 'electric', trickRoom: true };
    });
    expect(roundTrip(calc)).toEqual(calc);
  });

  it('writes keys in a fixed order, so the same calculation gives the same link', () => {
    const a = with_((c) => {
      c.field.weather = 'rain';
      c.you.species = 'dragapult';
      c.target.species = 'garchomp';
    });
    expect(stringifyQuery(encode(a))).toBe('?v=1&t=garchomp&y=dragapult&weather=rain');
  });

  it('only knows the keys in the spec', () => {
    expect(SEARCH_KEYS).toEqual([
      'v', 'r',
      't', 't.base', 't.lv', 't.iv', 't.ev', 't.nat', 't.stage', 't.item', 't.ability', 't.on', 't.status', 't.tw', 't.swamp',
      'y', 'y.base', 'y.lv', 'y.iv', 'y.stage', 'y.item', 'y.ability', 'y.on', 'y.status', 'y.tw', 'y.swamp',
      'weather', 'terrain', 'tr',
    ]);
  });
});

describe('defaults under Trick Room', () => {
  it('flip the target to its slowest spread and your IVs to 0', () => {
    const calc = decode({ v: '1', t: 'kingambit', tr: '1' });
    expect(calc.target).toMatchObject({ species: 'kingambit', ev: 0, nature: 'minus', iv: 0 });
    expect(calc.you.iv).toBe(0);
  });

  it('keep values you set', () => {
    const calc = decode({ v: '1', 't.ev': '252', 't.nat': 'plus', 't.iv': '31', 'y.iv': '31', tr: '1' });
    expect(calc.target).toMatchObject({ ev: 252, nature: 'plus', iv: 31 });
    expect(calc.you.iv).toBe(31);
    expect(roundTrip(calc)).toEqual(calc);
  });

  it('omit values that equal the Trick Room default', () => {
    const calc = with_((c) => {
      c.field.trickRoom = true;
      c.target = { ...c.target, ev: 0, nature: 'minus', iv: 0 };
      c.you.iv = 0;
    });
    expect(encode(calc)).toEqual({ v: '1', tr: '1' });
  });
});

describe('withTrickRoom', () => {
  it('moves values at the old defaults to the new ones, and back', () => {
    const on = withTrickRoom(emptyCalculation(), true);
    expect(on.target).toMatchObject({ ev: 0, nature: 'minus', iv: 0 });
    expect(on.you.iv).toBe(0);
    expect(withTrickRoom(on, false)).toEqual(emptyCalculation());
  });

  it('leaves values you changed alone', () => {
    const calc = emptyCalculation();
    calc.target.ev = 100;
    calc.you.iv = 15;
    const on = withTrickRoom(calc, true);
    expect(on.target).toMatchObject({ ev: 100, nature: 'minus', iv: 0 });
    expect(on.you.iv).toBe(15);
  });
});

describe('species and base Speed', () => {
  it('stores a species by id and reads names in any case or punctuation', () => {
    expect(decode({ t: 'Ogerpon-Wellspring' }).target.species).toBe('ogerponwellspring');
    expect(decode({ y: 'FLABÉBÉ' }).you.species).toBe('flabebe');
  });

  it('drops a base Speed equal to the species’ own', () => {
    const calc = decode({ t: 'garchomp', 't.base': '102' });
    expect(calc.target.baseSpeed).toBeUndefined();
    expect(canonical({ t: 'garchomp', 't.base': '102' })).toEqual({ v: '1', t: 'garchomp' });
  });

  it('keeps a base Speed with no species, as a custom Pokémon', () => {
    expect(decode({ 't.base': '130' }).target).toMatchObject({ baseSpeed: 130 });
    expect(decode({ 't.base': '130' }).target.species).toBeUndefined();
  });
});

describe('hand-broken links', () => {
  const cases: [string, SearchParams, (calc: Calculation) => void][] = [
    ['EVs above the maximum', { 't.ev': '999' }, (c) => { expect(c.target.ev).toBe(252); }],
    ['negative EVs', { 't.ev': '-40' }, (c) => { expect(c.target.ev).toBe(0); }],
    ['EVs between steps', { 't.ev': '250' }, (c) => { expect(c.target.ev).toBe(248); }],
    ['EVs that are not a number', { 't.ev': 'lots' }, (c) => { expect(c.target.ev).toBe(252); }],
    ['a decimal', { 't.lv': '50.5' }, (c) => { expect(c.target.level).toBe(100); }],
    ['level 0', { 't.lv': '0' }, (c) => { expect(c.target.level).toBe(1); }],
    ['level 1000', { 'y.lv': '1000' }, (c) => { expect(c.you.level).toBe(100); }],
    ['a huge number', { 'y.lv': '99999999999999999999' }, (c) => { expect(c.you.level).toBe(100); }],
    ['IVs of 32', { 'y.iv': '32' }, (c) => { expect(c.you.iv).toBe(31); }],
    ['stage +9', { 't.stage': '+9' }, (c) => { expect(c.target.stage).toBe(6); }],
    ['stage −9', { 't.stage': '-9' }, (c) => { expect(c.target.stage).toBe(-6); }],
    ['base Speed 0', { 't.base': '0' }, (c) => { expect(c.target.baseSpeed).toBe(1); }],
    ['base Speed 999', { 't.base': '999' }, (c) => { expect(c.target.baseSpeed).toBe(255); }],
    ['an unknown species', { t: 'missingno' }, (c) => { expect(c.target.species).toBeUndefined(); }],
    ['an unknown nature', { 't.nat': 'fast' }, (c) => { expect(c.target.nature).toBe('plus'); }],
    ['an unknown item', { 't.item': 'rarecandy' }, (c) => { expect(c.target.item).toBeUndefined(); }],
    ['an ability in the item slot', { 't.item': 'swiftswim' }, (c) => { expect(c.target.item).toBeUndefined(); }],
    ['an item in the ability slot', { 'y.ability': 'choicescarf' }, (c) => { expect(c.you.ability).toBeUndefined(); }],
    ['an unknown status', { 't.status': 'asleep' }, (c) => { expect(c.target.status).toBeUndefined(); }],
    ['hail, which is snow in Generation 9', { weather: 'hail' }, (c) => { expect(c.field.weather).toBeUndefined(); }],
    ['an unknown terrain', { terrain: 'psychic' }, (c) => { expect(c.field.terrain).toBeUndefined(); }],
    ['a boolean that is not 1', { tr: 'yes' }, (c) => { expect(c.field.trickRoom).toBe(false); }],
    ['an empty value', { 't.ev': '', t: '' }, (c) => { expect(c.target).toMatchObject({ ev: 252 }); }],
    ['a future version', { v: '2', t: 'garchomp' }, (c) => { expect(c.target.species).toBe('garchomp'); }],
    ['a nonsense version', { v: 'banana', t: 'garchomp' }, (c) => { expect(c.target.species).toBe('garchomp'); }],
    ['an unknown ruleset', { r: 'gen1', t: 'garchomp' }, (c) => { expect(c.ruleset).toBe('gen9'); }],
  ];

  it.each(cases)('%s', (_name, params, check) => {
    check(decode(params));
  });

  it('ignores keys it does not know', () => {
    expect(canonical({ t: 'garchomp', utm_source: 'discord', 'x.ev': '4' })).toEqual({ v: '1', t: 'garchomp' });
  });

  it('keeps the first value of a key given twice', () => {
    expect(parseQuery('?t=garchomp&t=dragapult')).toEqual({ t: 'garchomp' });
  });

  it('reads malformed escapes and odd characters without throwing', () => {
    for (const query of ['?t=%E0%A4%A', '?t=%', '?%%%=1', '?t=garchomp&&&', '?=&=&', '?t.ev=%00', '?weather=rain%20%F0%9F%8C%A7']) {
      expect(() => decode(parseQuery(query))).not.toThrow();
    }
  });

  it('survives random junk in every key', () => {
    const junk = ['', ' ', '-', '+', '0', '-0', '1e3', 'NaN', 'Infinity', 'null', 'undefined', '[]', '{}', '<script>', '%', '٣', '１００', '252abc', '  44  ', 'true', '1'];
    let seed = 7;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed;
    };
    for (let i = 0; i < 2000; i += 1) {
      const params: SearchParams = {};
      for (const key of SEARCH_KEYS) {
        if (next() % 3 === 0) params[key] = junk[next() % junk.length] ?? '';
      }
      const calc = decode(params);
      // Always a valid calculation...
      expect(calc.target.ev % 4).toBe(0);
      expect(calc.target.ev).toBeGreaterThanOrEqual(0);
      expect(calc.target.ev).toBeLessThanOrEqual(252);
      for (const side of [calc.target, calc.you]) {
        expect(side.level).toBeGreaterThanOrEqual(1);
        expect(side.level).toBeLessThanOrEqual(100);
        expect(side.iv).toBeGreaterThanOrEqual(0);
        expect(side.iv).toBeLessThanOrEqual(31);
        expect(Math.abs(side.stage)).toBeLessThanOrEqual(6);
      }
      // ...and writing it again is stable.
      expect(canonical(encode(calc))).toEqual(encode(calc));
    }
  });
});
