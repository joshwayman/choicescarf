import type { Nature, RulesetId, Terrain, Weather } from '../../engine/index.ts';

/**
 * One calculation: both Pokémon, the field and the ruleset. This is what
 * the URL holds (docs/specs/url.md) and what Calculator edits.
 */
export interface Calculation {
  ruleset: RulesetId;
  target: TargetSide;
  you: Side;
  field: FieldState;
}

/** A Pokémon. Its nature and EVs are solved, so only the target has them. */
export interface Side {
  /** Species id from the ruleset's data. */
  species?: string;
  /** Base Speed typed by hand: a custom Pokémon, or a what-if on a species. */
  baseSpeed?: number;
  level: number;
  iv: number;
  stage: number;
  /** Modifier id with slot 'item'. */
  item?: string;
  /** Modifier id with slot 'ability'. */
  ability?: string;
  /** The ability is switched on (Unburden, Protosynthesis, Quark Drive, Slow Start). */
  abilityOn: boolean;
  status?: 'par' | 'other';
  tailwind: boolean;
  swamp: boolean;
}

export interface TargetSide extends Side {
  ev: number;
  nature: Nature;
}

export interface FieldState {
  weather?: Weather;
  terrain?: Terrain;
  trickRoom: boolean;
}

/**
 * The defaults that depend on Trick Room (#67): the target's worst case is
 * its fastest spread without it and its slowest spread in it, and your IVs
 * default to 0 in Trick Room.
 */
export function sideDefaults(trickRoom: boolean) {
  return {
    target: trickRoom
      ? { ev: 0, nature: 'minus' as Nature, iv: 0 }
      : { ev: 252, nature: 'plus' as Nature, iv: 31 },
    you: { iv: trickRoom ? 0 : 31 },
  };
}

export const LEVEL_DEFAULT = 100;

/** A fresh calculation: nothing picked, every value at its default. */
export function emptyCalculation(): Calculation {
  const defaults = sideDefaults(false);
  const side = {
    level: LEVEL_DEFAULT,
    stage: 0,
    abilityOn: false,
    tailwind: false,
    swamp: false,
  };
  return {
    ruleset: 'gen9',
    target: { ...side, ...defaults.target },
    you: { ...side, ...defaults.you },
    field: { trickRoom: false },
  };
}

/**
 * Turn Trick Room on or off. Values still at the old default follow the flip
 * to the new default (#67); values you set stay as they are.
 */
export function withTrickRoom(calc: Calculation, on: boolean): Calculation {
  if (calc.field.trickRoom === on) return calc;
  const before = sideDefaults(calc.field.trickRoom);
  const after = sideDefaults(on);
  const follow = <T>(value: T, oldDefault: T, newDefault: T): T => (value === oldDefault ? newDefault : value);
  return {
    ...calc,
    field: { ...calc.field, trickRoom: on },
    target: {
      ...calc.target,
      ev: follow(calc.target.ev, before.target.ev, after.target.ev),
      nature: follow(calc.target.nature, before.target.nature, after.target.nature),
      iv: follow(calc.target.iv, before.target.iv, after.target.iv),
    },
    you: { ...calc.you, iv: follow(calc.you.iv, before.you.iv, after.you.iv) },
  };
}
