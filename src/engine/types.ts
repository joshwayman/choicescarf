/**
 * The engine's types, from docs/specs/rulesets.md. Additions to the spec's
 * types are marked; the spec is updated to match.
 */

/** 'gen3' … 'gen8' and 'champions' join in v5.1. */
export type RulesetId = 'gen9';

export type Weather = 'sun' | 'rain' | 'sand' | 'snow';
export type Terrain = 'electric';
export type Nature = 'plus' | 'neutral' | 'minus';

/** Out of 4096: ×0.25, ×0.5, ×1.5, ×2. */
export type Multiplier = 1024 | 2048 | 6144 | 8192;

export interface Ruleset {
  id: RulesetId;
  /** "Generation 9" */
  name: string;
  /** 'statPoints' is Champions. */
  investment: 'evs' | 'statPoints';
  level: { min: 1; max: 100; default: 100 };
  iv: { min: 0; max: 31; default: 31 };
  ev: { min: 0; max: 252; step: 4 };
  stage: { min: -6; max: 6 };
  /** 50/100 from Generation 7; 25/100 before. */
  paralysis: { numerator: 25 | 50; denominator: 100 };
  speedCap: 10000;
  modifiers: readonly Modifier[];
  weathers: readonly Weather[];
  terrains: readonly Terrain[];
}

export interface Modifier {
  /** 'choicescarf' */
  id: string;
  /** "Choice Scarf" */
  name: string;
  /** One item and one ability per Pokémon. Side modifiers are switched on per side. */
  slot: 'item' | 'ability' | 'side';
  multiplier: Multiplier;
  needs?: {
    /** Swift Swim needs rain. */
    weather?: Weather;
    /** Surge Surfer needs Electric Terrain. */
    terrain?: Terrain;
    /** Quick Feet needs any status. */
    status?: true;
    /** The user says it is active (Unburden, Protosynthesis, Quark Drive, Slow Start). */
    switchedOn?: true;
  };
  /** Species id, for Quick Powder. */
  only?: string;
  /** Unburden: while it is active, no item applies. */
  removesItem?: true;
  /** Added to the spec: Quick Feet cancels the paralysis drop. */
  ignoresParalysis?: true;
}

export interface SpeedInput {
  ruleset: RulesetId;
  /** 1 to 255. */
  baseSpeed: number;
  level: number;
  iv: number;
  ev: number;
  nature: Nature;
  stage: number;
  /** A modifier id with slot 'item'. */
  item?: string;
  /** A modifier id with slot 'ability'. */
  ability?: string;
  /** For abilities that need switching on. */
  abilityOn?: boolean;
  status?: 'par' | 'other';
  tailwind?: boolean;
  swamp?: boolean;
  /** Added to the spec: the species id, which Quick Powder needs. */
  species?: string;
}

export interface Field {
  weather?: Weather;
  terrain?: Terrain;
  trickRoom?: boolean;
}

/** Why a modifier the Pokémon has is not counted. */
export type InactiveReason =
  | 'needs-weather'
  | 'needs-terrain'
  | 'needs-status'
  | 'switched-off'
  | 'wrong-species'
  | 'item-removed';

export interface AppliedModifier {
  id: string;
  name: string;
  slot: Modifier['slot'];
  multiplier: Multiplier;
  active: boolean;
  /** Set when `active` is false. */
  reason?: InactiveReason;
}

/**
 * One step of the calculation, for "Show calc". Each step's `value` is the
 * Speed after that step. Steps that change nothing (a neutral nature, stage 0,
 * no modifiers, no paralysis, no cap) are left out, except `stat`.
 */
export type SpeedStep =
  | { step: 'stat'; value: number }
  | { step: 'nature'; nature: 'plus' | 'minus'; value: number }
  | { step: 'stage'; stage: number; value: number }
  | {
      step: 'modifiers';
      /** The combined modifier, out of 4096. */
      combined: number;
      value: number;
    }
  | { step: 'paralysis'; value: number }
  | { step: 'cap'; value: number };

export interface SpeedResult {
  speed: number;
  steps: SpeedStep[];
  /**
   * Every modifier the input asked for, in the order applied, active or not.
   * Lets the UI say "Swift Swim: waiting for rain".
   */
  modifiers: AppliedModifier[];
}
