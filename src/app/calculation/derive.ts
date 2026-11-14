import {
  getRuleset,
  solveOutspeed,
  solveUnderspeed,
  speed,
  type Field,
  type Modifier,
  type Nature,
  type OutspeedRow,
  type SolverInput,
  type SpeedInput,
  type SpeedResult,
  type SpeedStep,
  type UnderspeedRow,
} from '../../engine/index.ts';
import { findSpecies } from '../../data/index.ts';
import type { Calculation, FieldState, Side, TargetSide } from './state.ts';

/**
 * Everything Calculator shows that is worked out from the calculation: each
 * side's name and Speed, the answer for each nature, and the working for
 * "Show calc". Pure, so it is tested without a screen.
 */

export const NATURE_LABEL: Record<Nature, string> = { plus: '+Spe', neutral: 'Neutral', minus: '−Spe' };

/** The base Speed a side uses: typed by hand, else its species', else none yet. */
export function baseOf(side: Side): number | undefined {
  if (side.baseSpeed !== undefined) return side.baseSpeed;
  return side.species === undefined ? undefined : findSpecies(side.species)?.spe;
}

/** The species, when the side is one and its base Speed hasn't been changed by hand. */
export function speciesOf(side: Side) {
  const species = side.species === undefined ? undefined : findSpecies(side.species);
  if (!species) return undefined;
  if (side.baseSpeed !== undefined && side.baseSpeed !== species.spe) return undefined;
  return species;
}

/** "Garchomp", or "Custom" for a typed base Speed, or undefined before anything is set. */
export function nameOf(side: Side): string | undefined {
  const species = speciesOf(side);
  if (species) return species.name;
  return baseOf(side) === undefined ? undefined : 'Custom';
}

function field(state: FieldState): Field {
  const out: Field = { trickRoom: state.trickRoom };
  if (state.weather) out.weather = state.weather;
  if (state.terrain) out.terrain = state.terrain;
  return out;
}

function solverInput(calc: Calculation, side: Side, base: number): SolverInput {
  const input: SolverInput = {
    ruleset: calc.ruleset,
    baseSpeed: base,
    level: side.level,
    iv: side.iv,
    stage: side.stage,
    abilityOn: side.abilityOn,
    tailwind: side.tailwind,
    swamp: side.swamp,
  };
  if (side.item) input.item = side.item;
  if (side.ability) input.ability = side.ability;
  if (side.status) input.status = side.status;
  if (side.species) input.species = side.species;
  return input;
}

function targetInput(calc: Calculation, target: TargetSide, base: number): SpeedInput {
  return { ...solverInput(calc, target, base), ev: target.ev, nature: target.nature };
}

export interface ResultRow {
  nature: Nature;
  /** The row's label: "+Spe", or "+Spe, Scarf" in the Scarf fallback. */
  label: string;
  /** EVs, or undefined when this nature can't do it. */
  ev?: number;
  /** The Speed this row ends on: the answer, or the best (or slowest) you can do. */
  speed: number;
}

export type Answer =
  | { kind: 'incomplete'; missing: ('target' | 'you')[] }
  | {
      kind: 'outspeed' | 'scarf' | 'cannot-outspeed' | 'underspeed' | 'too-fast';
      targetSpeed: number;
      rows: ResultRow[];
      /** Your Pokémon in the row that "Show calc" explains: neutral. */
      shown: { label: string; result: SpeedResult };
      target: SpeedResult;
      /** Under Trick Room when nothing is slow enough: how slow it gets, and whether an Iron Ball helps. */
      tooFast?: { slowest: number; ironBall?: { speed: number; enough: boolean } };
    };

/**
 * The answer for each nature. Outside Trick Room: the fewest EVs to move
 * first, falling back to a Choice Scarf when no nature can. In Trick Room:
 * the most EVs that still move first (#52 builds its screen; links already work).
 */
export function solve(calc: Calculation): Answer {
  const targetBase = baseOf(calc.target);
  const yourBase = baseOf(calc.you);
  if (targetBase === undefined || yourBase === undefined) {
    const missing: ('target' | 'you')[] = [];
    if (targetBase === undefined) missing.push('target');
    if (yourBase === undefined) missing.push('you');
    return { kind: 'incomplete', missing };
  }

  const theField = field(calc.field);
  const target = speed(targetInput(calc, calc.target, targetBase), theField);
  const you = solverInput(calc, calc.you, yourBase);

  if (calc.field.trickRoom) {
    const result = solveUnderspeed(you, target.speed, theField);
    const rows = result.rows.map((row) => underRow(row));
    const reaches = result.rows.some((row) => row.result === 'reaches');
    const answer: Answer = {
      kind: reaches ? 'underspeed' : 'too-fast',
      targetSpeed: result.target,
      rows,
      shown: shownRow(you, result.rows, theField, ''),
      target,
    };
    if (!reaches) {
      const slowest = Math.min(...rows.map((row) => row.speed));
      answer.tooFast = { slowest };
      if (you.item !== 'ironball') {
        // The slowest spread there is, holding an Iron Ball.
        const held = speed({ ...you, item: 'ironball', ev: 0, nature: 'minus' }, theField).speed;
        answer.tooFast.ironBall = { speed: held, enough: held < result.target };
      }
    }
    return answer;
  }

  const result = solveOutspeed(you, target.speed, theField);
  if (result.scarf) {
    const scarfed: SolverInput = { ...you, item: 'choicescarf' };
    const anyReaches = result.scarf.some((row) => row.result === 'reaches');
    return {
      kind: anyReaches ? 'scarf' : 'cannot-outspeed',
      targetSpeed: result.target,
      rows: (anyReaches ? result.scarf : result.rows).map((row) => outRow(row, anyReaches ? ', Scarf' : '')),
      shown: anyReaches
        ? shownRow(scarfed, result.scarf, theField, ', Scarf')
        : shownRow(you, result.rows, theField, ''),
      target,
    };
  }
  const anyReaches = result.rows.some((row) => row.result === 'reaches');
  return {
    kind: anyReaches ? 'outspeed' : 'cannot-outspeed',
    targetSpeed: result.target,
    rows: result.rows.map((row) => outRow(row, '')),
    shown: shownRow(you, result.rows, theField, ''),
    target,
  };
}

function outRow(row: OutspeedRow, suffix: string): ResultRow {
  const out: ResultRow = { nature: row.nature, label: NATURE_LABEL[row.nature] + suffix, speed: row.speed };
  if (row.result === 'reaches') out.ev = row.ev;
  return out;
}

function underRow(row: UnderspeedRow): ResultRow {
  const out: ResultRow = { nature: row.nature, label: NATURE_LABEL[row.nature], speed: row.speed };
  if (row.result === 'reaches') out.ev = row.ev;
  return out;
}

/** Your neutral row, worked through `speed` for its steps. */
function shownRow(
  you: SolverInput,
  rows: readonly (OutspeedRow | UnderspeedRow)[],
  theField: Field,
  suffix: string,
): { label: string; result: SpeedResult } {
  const neutral = rows.find((row) => row.nature === 'neutral');
  const ev = neutral?.result === 'reaches' ? neutral.ev : neutral?.result === 'too-fast' ? 0 : 252;
  return {
    label: `neutral${suffix.toLowerCase()}`,
    result: speed({ ...you, ev, nature: 'neutral' }, theField),
  };
}

/** A side's own Speed, for the switcher and the desktop card. Undefined until it has a base Speed. */
export function sideSpeed(calc: Calculation, which: 'target' | 'you', answer: Answer): number | undefined {
  if (answer.kind === 'incomplete') {
    if (which === 'target' && !answer.missing.includes('target')) {
      const base = baseOf(calc.target);
      return base === undefined ? undefined : speed(targetInput(calc, calc.target, base), field(calc.field)).speed;
    }
    return undefined;
  }
  return which === 'target' ? answer.target.speed : answer.shown.result.speed;
}

const MULTIPLIER_TEXT: Record<number, string> = { 1024: '×0.25', 2048: '×0.5', 6144: '×1.5', 8192: '×2' };

/**
 * One line of "Show calc": the stat, each step that changed it, the result.
 * "303 → ×1.1 +Spe = 333"; "334 → ×1.0 = 334" when nothing changed it.
 */
export function working(result: SpeedResult): string {
  const [first] = result.steps;
  const parts: string[] = [];
  for (const step of result.steps.slice(1)) parts.push(stepText(step, result));
  const start = first?.value ?? result.speed;
  return parts.length === 0 ? `${String(start)} → ×1.0 = ${String(result.speed)}` : `${String(start)} → ${parts.join(' → ')} = ${String(result.speed)}`;
}

function stepText(step: SpeedStep, result: SpeedResult): string {
  switch (step.step) {
    case 'stat':
      return String(step.value);
    case 'nature':
      return step.nature === 'plus' ? '×1.1 +Spe' : '×0.9 −Spe';
    case 'stage':
      return `${step.stage > 0 ? '+' : '−'}${String(Math.abs(step.stage))} stage`;
    case 'modifiers': {
      // "Scarf" for Choice Scarf keeps a line on one row on a phone; the card heading names it in full.
      const names = result.modifiers
        .filter((m) => m.active)
        .map((m) => `${MULTIPLIER_TEXT[m.multiplier] ?? ''} ${m.name.replace(/^Choice /, '')}`);
      return names.join(' ');
    }
    case 'paralysis':
      return '×0.5 paralysis';
    case 'cap':
      return 'capped at 10000';
  }
}

/** The ruleset's modifiers in one slot, in the order the sheet lists them. */
export function modifiersIn(calc: Calculation, slot: Modifier['slot']): readonly Modifier[] {
  return getRuleset(calc.ruleset).modifiers.filter((modifier) => modifier.slot === slot);
}

export function multiplierText(modifier: Modifier): string {
  return MULTIPLIER_TEXT[modifier.multiplier] ?? '';
}
