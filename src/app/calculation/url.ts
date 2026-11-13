import { getRuleset, type Modifier, type Nature, type Ruleset } from '../../engine/index.ts';
import { findSpecies, toId } from '../../data/index.ts';
import {
  LEVEL_DEFAULT,
  emptyCalculation,
  sideDefaults,
  type Calculation,
  type FieldState,
  type Side,
  type TargetSide,
} from './state.ts';

/**
 * Reads and writes a calculation as URL search parameters. The format is a
 * public contract, specified in docs/specs/url.md: keys may be added, never
 * renamed or given a new meaning.
 */

export const SCHEMA_VERSION = 1;

/** Raw search parameters: every value a string, as in the URL. */
export type SearchParams = Partial<Record<string, string>>;

const NATURES: readonly Nature[] = ['plus', 'neutral', 'minus'];
const STATUSES = ['par', 'other'] as const;

/** Every key version 1 knows, in the order they are written. */
const SIDE_KEYS = ['', 'base', 'lv', 'iv', 'ev', 'nat', 'stage', 'item', 'ability', 'on', 'status', 'tw', 'swamp'] as const;
const TARGET_ONLY = new Set<string>(['ev', 'nat']);

function sideKey(prefix: 't' | 'y', key: string): string {
  return key === '' ? prefix : `${prefix}.${key}`;
}

export const SEARCH_KEYS: readonly string[] = [
  'v',
  'r',
  ...SIDE_KEYS.map((key) => sideKey('t', key)),
  ...SIDE_KEYS.filter((key) => !TARGET_ONLY.has(key)).map((key) => sideKey('y', key)),
  'weather',
  'terrain',
  'tr',
];

// Reading

/**
 * Turn search parameters into a calculation. Never throws: anything unknown,
 * malformed or out of range is clamped or falls back to the default
 * (docs/specs/url.md, "Reading a link").
 */
export function decode(params: SearchParams): Calculation {
  const empty = emptyCalculation();
  const ruleset = getRuleset(empty.ruleset);
  const field = decodeField(params, ruleset);
  const defaults = sideDefaults(field.trickRoom);

  const targetSide = decodeSide(params, 't', ruleset, defaults.target.iv);
  const target: TargetSide = {
    ...targetSide,
    ev: evOr(params['t.ev'], ruleset, defaults.target.ev),
    nature: oneOf(params['t.nat'], NATURES) ?? defaults.target.nature,
  };
  const you = decodeSide(params, 'y', ruleset, defaults.you.iv);

  return { ruleset: ruleset.id, target, you, field };
}

function decodeField(params: SearchParams, ruleset: Ruleset): FieldState {
  const field: FieldState = { trickRoom: flag(params.tr) };
  const weather = oneOf(params.weather, ruleset.weathers);
  if (weather) field.weather = weather;
  const terrain = oneOf(params.terrain, ruleset.terrains);
  if (terrain) field.terrain = terrain;
  return field;
}

function decodeSide(params: SearchParams, prefix: 't' | 'y', ruleset: Ruleset, ivDefault: number): Side {
  const get = (key: string) => params[sideKey(prefix, key)];
  const side: Side = {
    level: intIn(get('lv'), ruleset.level.min, ruleset.level.max) ?? LEVEL_DEFAULT,
    iv: intIn(get('iv'), ruleset.iv.min, ruleset.iv.max) ?? ivDefault,
    stage: intIn(get('stage'), ruleset.stage.min, ruleset.stage.max) ?? 0,
    abilityOn: flag(get('on')),
    tailwind: flag(get('tw')),
    swamp: flag(get('swamp')),
  };

  const raw = get('');
  const species = raw === undefined ? undefined : findSpecies(toId(raw));
  if (species) side.species = species.id;

  const base = intIn(get('base'), 1, 255);
  if (base !== undefined && base !== species?.spe) side.baseSpeed = base;

  const item = modifierId(get('item'), ruleset, 'item');
  if (item) side.item = item;
  const ability = modifierId(get('ability'), ruleset, 'ability');
  if (ability) side.ability = ability;
  const status = oneOf(get('status'), STATUSES);
  if (status) side.status = status;

  return side;
}

/** A whole number, clamped into range. Undefined when it isn't a whole number at all. */
function intIn(value: string | undefined, min: number, max: number): number | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!/^[+-]?\d{1,12}$/.test(trimmed)) return undefined;
  return Math.min(max, Math.max(min, Number(trimmed)));
}

function evOr(value: string | undefined, ruleset: Ruleset, fallback: number): number {
  const ev = intIn(value, ruleset.ev.min, ruleset.ev.max);
  if (ev === undefined) return fallback;
  return ev - ((ev - ruleset.ev.min) % ruleset.ev.step);
}

function flag(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  const id = toId(value);
  return allowed.find((option) => option === id);
}

function modifierId(value: string | undefined, ruleset: Ruleset, slot: Modifier['slot']): string | undefined {
  if (value === undefined) return undefined;
  const id = toId(value);
  return ruleset.modifiers.find((modifier) => modifier.slot === slot && modifier.id === id)?.id;
}

// Writing

/**
 * Turn a calculation into search parameters, writing only what differs from
 * the defaults, in a fixed order. A fresh calculation gives `{}`.
 */
export function encode(calc: Calculation): Record<string, string> {
  const out: Record<string, string> = {};
  const defaults = sideDefaults(calc.field.trickRoom);

  // `r` is never written yet: Generation 9 is the only ruleset, and the default (#54 adds others).
  encodeSide(out, 't', calc.target, defaults.target.iv);
  if (calc.target.ev !== defaults.target.ev) out['t.ev'] = String(calc.target.ev);
  if (calc.target.nature !== defaults.target.nature) out['t.nat'] = calc.target.nature;
  encodeSide(out, 'y', calc.you, defaults.you.iv);
  if (calc.field.weather) out.weather = calc.field.weather;
  if (calc.field.terrain) out.terrain = calc.field.terrain;
  if (calc.field.trickRoom) out.tr = '1';

  if (Object.keys(out).length === 0) return out;
  return sortKeys({ v: String(SCHEMA_VERSION), ...out });
}

function encodeSide(out: Record<string, string>, prefix: 't' | 'y', side: Side, ivDefault: number) {
  const set = (key: string, value: string) => {
    out[sideKey(prefix, key)] = value;
  };
  const species = side.species === undefined ? undefined : findSpecies(side.species);
  if (species) set('', species.id);
  if (side.baseSpeed !== undefined && side.baseSpeed !== species?.spe) set('base', String(side.baseSpeed));
  if (side.level !== LEVEL_DEFAULT) set('lv', String(side.level));
  if (side.iv !== ivDefault) set('iv', String(side.iv));
  if (side.stage !== 0) set('stage', String(side.stage));
  if (side.item) set('item', side.item);
  if (side.ability) set('ability', side.ability);
  if (side.abilityOn) set('on', '1');
  if (side.status) set('status', side.status);
  if (side.tailwind) set('tw', '1');
  if (side.swamp) set('swamp', '1');
}

function sortKeys(params: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  for (const key of SEARCH_KEYS) {
    const value = params[key];
    if (value !== undefined) sorted[key] = value;
  }
  return sorted;
}

/** The canonical form of any search parameters: unknown keys dropped, values cleaned. */
export function canonical(params: SearchParams): Record<string, string> {
  return encode(decode(params));
}

// The query string itself

/**
 * Parse a query string. Values stay strings, and a key given twice keeps its
 * first value. Malformed escapes don't throw.
 */
export function parseQuery(query: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)) {
    if (!(key in out)) out[key] = value;
  }
  return out;
}

/** Write search parameters as a query string, with the leading "?" (or "" when empty). */
export function stringifyQuery(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    query.append(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}
