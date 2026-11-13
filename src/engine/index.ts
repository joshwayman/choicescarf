/**
 * The speed engine: pure TypeScript with no React and no browser APIs.
 * The rules it implements are in docs/specs/rulesets.md. Solving arrives in #82.
 */
export { speed, chain, applyModifier } from './speed.ts';
export { actionSpeed, movesFirst } from './order.ts';
export { RULESETS, RULESET_IDS, getRuleset } from './rulesets/index.ts';
export type * from './types.ts';
