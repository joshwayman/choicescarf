import { getRuleset } from './rulesets/index.ts';
import type {
  AppliedModifier,
  Field,
  InactiveReason,
  Modifier,
  Ruleset,
  SpeedInput,
  SpeedResult,
  SpeedStep,
} from './types.ts';

/**
 * A Pokémon's Speed, exactly as the games work it out, with the steps that
 * produced it. The formula and its sources are in docs/specs/rulesets.md.
 *
 * Throws a RangeError for values outside the ruleset's ranges and an Error
 * for an unknown item or ability: callers (the URL schema, the forms) clamp
 * and validate before calling.
 */
export function speed(input: SpeedInput, field: Field): SpeedResult {
  const ruleset = getRuleset(input.ruleset);
  validate(input, ruleset);

  const steps: SpeedStep[] = [];

  // 1. Stat: floor((2 × base + IV + floor(EV / 4)) × level / 100) + 5
  let value =
    Math.floor(((2 * input.baseSpeed + input.iv + Math.floor(input.ev / 4)) * input.level) / 100) + 5;
  steps.push({ step: 'stat', value });

  // 2. Nature: ×110/100 or ×90/100, rounded down.
  if (input.nature !== 'neutral') {
    value = Math.floor((value * (input.nature === 'plus' ? 110 : 90)) / 100);
    steps.push({ step: 'nature', nature: input.nature, value });
  }

  // 3. Stage: ×(2 + stage)/2 or ×2/(2 − stage), rounded down.
  if (input.stage !== 0) {
    value =
      input.stage > 0
        ? Math.floor((value * (2 + input.stage)) / 2)
        : Math.floor((value * 2) / (2 - input.stage));
    steps.push({ step: 'stage', stage: input.stage, value });
  }

  // 4. Modifiers: chained into one number out of 4096, applied once, rounded half down.
  const modifiers = resolveModifiers(input, field, ruleset);
  const active = modifiers.filter((modifier) => modifier.active);
  if (active.length > 0) {
    const combined = chain(active.map((modifier) => modifier.multiplier));
    value = applyModifier(value, combined);
    steps.push({ step: 'modifiers', combined, value });
  }

  // 5. Paralysis, after the chain. Skipped by an active modifier that ignores it (Quick Feet).
  const ignoresParalysis = active.some(
    (modifier) => find(ruleset, modifier.id, modifier.slot).ignoresParalysis === true,
  );
  if (input.status === 'par' && !ignoresParalysis) {
    value = Math.floor((value * ruleset.paralysis.numerator) / ruleset.paralysis.denominator);
    steps.push({ step: 'paralysis', value });
  }

  // 6. Cap.
  if (value > ruleset.speedCap) {
    value = ruleset.speedCap;
    steps.push({ step: 'cap', value });
  }

  return { speed: value, steps, modifiers };
}

/** Combine modifiers out of 4096: for each, (running × modifier + 2048) >> 12. No clamp. */
export function chain(multipliers: readonly number[]): number {
  let combined = 4096;
  for (const multiplier of multipliers) {
    combined = Math.floor((combined * multiplier + 2048) / 4096);
  }
  return combined;
}

/** speed × combined / 4096, rounded half down (499.5 becomes 499). */
export function applyModifier(value: number, combined: number): number {
  return Math.floor((value * combined + 2047) / 4096);
}

/**
 * Every modifier the input asks for, in chain order (side, ability, item), and
 * whether it counts. With the Generation 9 multipliers every chain is exact,
 * so the order does not change the result.
 */
function resolveModifiers(input: SpeedInput, field: Field, ruleset: Ruleset): AppliedModifier[] {
  const resolved: AppliedModifier[] = [];
  const add = (modifier: Modifier, reason: InactiveReason | undefined) => {
    resolved.push({
      id: modifier.id,
      name: modifier.name,
      slot: modifier.slot,
      multiplier: modifier.multiplier,
      active: reason === undefined,
      ...(reason === undefined ? {} : { reason }),
    });
  };

  if (input.tailwind === true) add(find(ruleset, 'tailwind', 'side'), undefined);
  if (input.swamp === true) add(find(ruleset, 'swamp', 'side'), undefined);

  let itemRemoved = false;
  if (input.ability !== undefined) {
    const ability = find(ruleset, input.ability, 'ability');
    const reason = inactiveReason(ability, input, field);
    add(ability, reason);
    itemRemoved = reason === undefined && ability.removesItem === true;
  }

  if (input.item !== undefined) {
    const item = find(ruleset, input.item, 'item');
    add(item, itemRemoved ? 'item-removed' : inactiveReason(item, input, field));
  }

  return resolved;
}

function inactiveReason(modifier: Modifier, input: SpeedInput, field: Field): InactiveReason | undefined {
  const needs = modifier.needs;
  if (needs?.weather !== undefined && field.weather !== needs.weather) return 'needs-weather';
  if (needs?.terrain !== undefined && field.terrain !== needs.terrain) return 'needs-terrain';
  if (needs?.status === true && input.status === undefined) return 'needs-status';
  if (needs?.switchedOn === true && input.abilityOn !== true) return 'switched-off';
  if (modifier.only !== undefined && input.species !== modifier.only) return 'wrong-species';
  return undefined;
}

function find(ruleset: Ruleset, id: string, slot: Modifier['slot']): Modifier {
  const modifier = ruleset.modifiers.find((m) => m.id === id);
  if (!modifier) throw new Error(`${ruleset.name} has no modifier "${id}"`);
  if (modifier.slot !== slot) {
    throw new Error(`"${id}" is ${article(modifier.slot)} ${modifier.slot} modifier, not ${article(slot)} ${slot} one`);
  }
  return modifier;
}

function article(slot: Modifier['slot']): 'a' | 'an' {
  return slot === 'side' ? 'a' : 'an';
}

function validate(input: SpeedInput, ruleset: Ruleset): void {
  checkRange('baseSpeed', input.baseSpeed, 1, 255);
  checkRange('level', input.level, ruleset.level.min, ruleset.level.max);
  checkRange('iv', input.iv, ruleset.iv.min, ruleset.iv.max);
  checkRange('ev', input.ev, ruleset.ev.min, ruleset.ev.max);
  checkRange('stage', input.stage, ruleset.stage.min, ruleset.stage.max);
}

function checkRange(name: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a whole number from ${String(min)} to ${String(max)}, got ${String(value)}`);
  }
}
