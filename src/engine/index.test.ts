import { describe, expect, it } from 'vitest';
import { RULESET_IDS, getRuleset } from './index.ts';

describe('rulesets', () => {
  it('supports Generation 9 only in v5.0', () => {
    expect(RULESET_IDS).toEqual(['gen9']);
    expect(getRuleset('gen9').name).toBe('Generation 9');
  });

  it('rejects an unknown ruleset', () => {
    expect(() => getRuleset('gen1' as never)).toThrow('Unknown ruleset "gen1"');
  });

  it('gives every Generation 9 modifier a unique id', () => {
    const ids = getRuleset('gen9').modifiers.map((modifier) => modifier.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
