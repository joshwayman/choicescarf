import { movesFirst } from './order.ts';
import { getRuleset } from './rulesets/index.ts';
import { speed } from './speed.ts';
import type {
  Field,
  Nature,
  OutspeedResult,
  OutspeedRow,
  Ruleset,
  SolverInput,
  SpeedInput,
  UnderspeedResult,
  UnderspeedRow,
} from './types.ts';

/** In the order the results show them. */
const NATURES: readonly Nature[] = ['plus', 'neutral', 'minus'];

/**
 * The fewest EVs, for each nature, that make you move before the target
 * outside Trick Room. A tie never counts. If no nature can, the same again
 * holding a Choice Scarf (unless you already hold an item, or Unburden is on).
 *
 * `target` is a Speed or a Pokémon. `field.trickRoom` is ignored: this asks
 * who moves first without it. Move order uses Pokémon Showdown's rule, so a
 * Speed of 8192 or more wraps round (see order.ts).
 */
export function solveOutspeed(you: SolverInput, target: number | SpeedInput, field: Field): OutspeedResult {
  const ruleset = getRuleset(you.ruleset);
  const normal: Field = { ...field, trickRoom: false };
  const targetSpeed = resolveTarget(target, normal);

  const rows = NATURES.map((nature) => fewestEvs(you, nature, targetSpeed, normal, ruleset));
  const anyReaches = rows.some((row) => row.result === 'reaches');

  let scarf: OutspeedRow[] | null = null;
  if (!anyReaches && you.item === undefined && !itemWouldBeRemoved(you, normal)) {
    const scarfed: SolverInput = { ...you, item: 'choicescarf' };
    scarf = NATURES.map((nature) => fewestEvs(scarfed, nature, targetSpeed, normal, ruleset));
  }

  return { target: targetSpeed, rows, scarf };
}

/**
 * The most EVs, for each nature, that still let you move before the target in
 * Trick Room, or "too fast" if even 0 EVs does not. A tie never counts. Uses
 * the IVs you give it: suggesting 0 IVs is the Calculator's job.
 *
 * `field.trickRoom` is ignored: this always asks about Trick Room. A target at
 * 1809 or more moves before slower Pokémon in Trick Room (see order.ts).
 */
export function solveUnderspeed(you: SolverInput, target: number | SpeedInput, field: Field): UnderspeedResult {
  const ruleset = getRuleset(you.ruleset);
  const trickRoom: Field = { ...field, trickRoom: true };
  const targetSpeed = resolveTarget(target, trickRoom);

  return {
    target: targetSpeed,
    rows: NATURES.map((nature) => mostEvs(you, nature, targetSpeed, trickRoom, ruleset)),
  };
}

function fewestEvs(you: SolverInput, nature: Nature, target: number, field: Field, ruleset: Ruleset): OutspeedRow {
  let best = 0;
  for (const ev of evSteps(ruleset)) {
    best = speed({ ...you, ev, nature }, field).speed;
    if (movesFirst(best, target, field) === 'a') return { nature, result: 'reaches', ev, speed: best };
  }
  return { nature, result: 'cannot-reach', speed: best };
}

function mostEvs(you: SolverInput, nature: Nature, target: number, field: Field, ruleset: Ruleset): UnderspeedRow {
  const steps = evSteps(ruleset).reverse();
  let slowest = 0;
  for (const ev of steps) {
    slowest = speed({ ...you, ev, nature }, field).speed;
    if (movesFirst(slowest, target, field) === 'a') return { nature, result: 'reaches', ev, speed: slowest };
  }
  return { nature, result: 'too-fast', speed: slowest };
}

/** 0, 4, 8 … 252. */
function evSteps(ruleset: Ruleset): number[] {
  const steps: number[] = [];
  for (let ev: number = ruleset.ev.min; ev <= ruleset.ev.max; ev += ruleset.ev.step) steps.push(ev);
  return steps;
}

function resolveTarget(target: number | SpeedInput, field: Field): number {
  if (typeof target !== 'number') return speed(target, field).speed;
  if (!Number.isInteger(target) || target < 0 || target > 10000) {
    throw new RangeError(`target must be a whole number from 0 to 10000, got ${String(target)}`);
  }
  return target;
}

/** True when your active ability would make a Choice Scarf do nothing (Unburden). */
function itemWouldBeRemoved(you: SolverInput, field: Field): boolean {
  const result = speed({ ...you, ev: 0, nature: 'neutral', item: 'choicescarf' }, field);
  return result.modifiers.some((modifier) => modifier.id === 'choicescarf' && modifier.reason === 'item-removed');
}
