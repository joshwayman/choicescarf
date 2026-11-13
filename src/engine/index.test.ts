import { describe, expect, it } from 'vitest';
import { RULESETS } from './index.ts';

describe('engine', () => {
  it('supports Generation 9 only in v5.0', () => {
    expect(RULESETS).toEqual(['gen9']);
  });
});
