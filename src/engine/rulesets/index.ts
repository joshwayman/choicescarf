import type { Ruleset, RulesetId } from '../types.ts';
import { gen9 } from './gen9.ts';

/** Every ruleset the engine supports. Generations 3 to 8 and Champions join in v5.1. */
export const RULESETS: Readonly<Record<RulesetId, Ruleset>> = { gen9 };

export const RULESET_IDS: readonly RulesetId[] = ['gen9'];

export function getRuleset(id: RulesetId): Ruleset {
  // RULESETS is typed by RulesetId, but a value from a URL may not be one.
  const ruleset = (RULESETS as Partial<Record<string, Ruleset>>)[id];
  if (!ruleset) throw new Error(`Unknown ruleset "${id}"`);
  return ruleset;
}
