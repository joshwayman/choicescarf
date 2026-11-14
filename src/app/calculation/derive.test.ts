import { describe, expect, it } from 'vitest';
import { baseOf, nameOf, sideSpeed, solve, working } from './derive.ts';
import { emptyCalculation, withTrickRoom, type Calculation } from './state.ts';

/** Expected values are the hand-worked table in docs/specs/rulesets.md, not this code's output. */

function calc(change: (c: Calculation) => void): Calculation {
  const c = emptyCalculation();
  change(c);
  return c;
}

describe('names and base Speeds', () => {
  it('uses the species until a different base Speed is typed', () => {
    const c = calc((x) => (x.target.species = 'garchomp'));
    expect(baseOf(c.target)).toBe(102);
    expect(nameOf(c.target)).toBe('Garchomp');
    c.target.baseSpeed = 110;
    expect(baseOf(c.target)).toBe(110);
    expect(nameOf(c.target)).toBe('Custom');
  });

  it('has no name or base before anything is set', () => {
    expect(baseOf(emptyCalculation().you)).toBeUndefined();
    expect(nameOf(emptyCalculation().you)).toBeUndefined();
  });
});

describe('solve', () => {
  it('asks for whatever is missing', () => {
    expect(solve(emptyCalculation())).toEqual({ kind: 'incomplete', missing: ['target', 'you'] });
    expect(solve(calc((x) => (x.target.species = 'garchomp')))).toEqual({ kind: 'incomplete', missing: ['you'] });
  });

  it('Dragapult outspeeding Garchomp (+Spe, 252): 0, 56 and 208 EVs', () => {
    const answer = solve(
      calc((x) => {
        x.target.species = 'garchomp';
        x.you.species = 'dragapult';
      }),
    );
    expect(answer.kind).toBe('outspeed');
    if (answer.kind === 'incomplete') return;
    expect(answer.targetSpeed).toBe(333);
    expect(answer.rows).toEqual([
      { nature: 'plus', label: '+Spe', ev: 0, speed: 352 },
      { nature: 'neutral', label: 'Neutral', ev: 56, speed: 334 },
      { nature: 'minus', label: '−Spe', ev: 208, speed: 334 },
    ]);
  });

  it('Garchomp outspeeding 421 needs a Scarf: 68 and 168 EVs, −Spe can’t', () => {
    const answer = solve(
      calc((x) => {
        x.target.species = 'dragapult';
        x.you.species = 'garchomp';
      }),
    );
    expect(answer.kind).toBe('scarf');
    if (answer.kind === 'incomplete') return;
    expect(answer.targetSpeed).toBe(421);
    expect(answer.rows).toEqual([
      { nature: 'plus', label: '+Spe, Scarf', ev: 68, speed: 423 },
      { nature: 'neutral', label: 'Neutral, Scarf', ev: 168, speed: 423 },
      { nature: 'minus', label: '−Spe, Scarf', speed: expect.any(Number) as number },
    ]);
    expect(answer.shown.result.speed).toBe(423);
  });

  it('says when even a Scarf can’t, or when there is no Scarf to try', () => {
    const noScarfHelps = solve(
      calc((x) => {
        x.target.baseSpeed = 200;
        x.target.item = 'choicescarf';
        x.you.baseSpeed = 30;
      }),
    );
    expect(noScarfHelps.kind).toBe('cannot-outspeed');

    const alreadyHolding = solve(
      calc((x) => {
        x.target.species = 'dragapult';
        x.you.species = 'garchomp';
        x.you.item = 'ironball';
      }),
    );
    expect(alreadyHolding.kind).toBe('cannot-outspeed');
    if (alreadyHolding.kind === 'incomplete') return;
    expect(alreadyHolding.rows.every((row) => row.ev === undefined)).toBe(true);
  });

  it('Garganacl (0 IVs) underspeeding 94 in Trick Room: up to 40, 72 and 116 EVs', () => {
    // Kingambit, −Spe, 0 EVs, 0 IVs is 94: the Trick Room defaults.
    const answer = solve(
      withTrickRoom(
        calc((x) => {
          x.target.species = 'kingambit';
          x.you.species = 'garganacl';
        }),
        true,
      ),
    );
    expect(answer.kind).toBe('underspeed');
    if (answer.kind === 'incomplete') return;
    expect(answer.targetSpeed).toBe(94);
    expect(answer.rows.map((row) => row.ev)).toEqual([40, 72, 116]);
  });

  it('Gardevoir (0 IVs) is too fast to underspeed a Speed of 7', () => {
    const answer = solve(
      calc((x) => {
        x.field.trickRoom = true;
        x.target.baseSpeed = 1;
        x.target.ev = 0;
        x.target.nature = 'neutral';
        x.target.iv = 0;
        x.target.level = 100;
        x.you.species = 'gardevoir';
        x.you.iv = 0;
      }),
    );
    expect(answer.kind).toBe('too-fast');
  });

  it('follows the field: Swift Swim only in rain', () => {
    const base = calc((x) => {
      x.target.species = 'barraskewda';
      x.target.ability = 'swiftswim';
      x.target.nature = 'neutral';
      x.you.species = 'dragapult';
    });
    expect(solve(base)).toMatchObject({ targetSpeed: 371 });
    expect(solve({ ...base, field: { ...base.field, weather: 'rain' } })).toMatchObject({ targetSpeed: 742 });
  });
});

describe('side Speeds', () => {
  it('shows the target’s Speed as soon as it has a base, and yours once both do', () => {
    const c = calc((x) => (x.target.species = 'garchomp'));
    expect(sideSpeed(c, 'target', solve(c))).toBe(333);
    expect(sideSpeed(c, 'you', solve(c))).toBeUndefined();
    c.you.species = 'dragapult';
    expect(sideSpeed(c, 'you', solve(c))).toBe(334);
  });
});

describe('Show calc', () => {
  it('writes the working as the boards do', () => {
    const answer = solve(
      calc((x) => {
        x.target.species = 'garchomp';
        x.you.species = 'dragapult';
      }),
    );
    if (answer.kind === 'incomplete') throw new Error('incomplete');
    expect(working(answer.target)).toBe('303 → ×1.1 +Spe = 333');
    expect(working(answer.shown.result)).toBe('334 → ×1.0 = 334');
  });

  it('names stages, modifiers and paralysis', () => {
    const answer = solve(
      calc((x) => {
        x.target.species = 'dragapult';
        x.target.item = 'choicescarf';
        x.target.status = 'par';
        x.target.stage = 1;
        x.you.baseSpeed = 255;
      }),
    );
    if (answer.kind === 'incomplete') throw new Error('incomplete');
    // 383 → ×1.1 = 421 → +1 = 631 → ×1.5 = 946 → ×0.5 = 473
    expect(working(answer.target)).toBe('383 → ×1.1 +Spe → +1 stage → ×1.5 Scarf → ×0.5 paralysis = 473');
  });
});
