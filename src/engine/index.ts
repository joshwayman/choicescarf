/**
 * The speed engine: pure TypeScript with no React and no browser APIs.
 * The rules it implements are in docs/specs/rulesets.md.
 * Speed for Generation 9 arrives in #79, and solving in #82.
 */

/** The rulesets the engine supports. Generations 3 to 8 and Champions join in v5.1. */
export const RULESETS = ['gen9'] as const;

export type RulesetId = (typeof RULESETS)[number];
