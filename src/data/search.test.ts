import { describe, expect, it } from 'vitest';
import { searchSpecies } from './search.ts';

const names = (query: string, limit?: number) => searchSpecies(query, limit).map((species) => species.name);

describe('searchSpecies', () => {
  it('finds nothing for an empty or blank query', () => {
    expect(names('')).toEqual([]);
    expect(names('   ')).toEqual([]);
    expect(names('-')).toEqual([]);
  });

  it('finds a species from the middle of its name ("chomp" finds Garchomp)', () => {
    expect(names('chomp')).toContain('Garchomp');
  });

  it('finds a form from partial words ("ogre w" finds Ogerpon-Wellspring)', () => {
    const found = names('ogre w');
    expect(found[0]).toBe('Ogerpon-Wellspring');
    expect(found).toContain('Ogerpon-Wellspring-Tera');
    expect(found).not.toContain('Ogerpon-Hearthflame');
  });

  it('puts an exact name first, then names that start with the query', () => {
    expect(names('garchomp')[0]).toBe('Garchomp');
    const found = names('gar');
    expect(found).toEqual(expect.arrayContaining(['Garchomp', 'Gardevoir', 'Garganacl']));
    // Names starting with it come before names that only contain it.
    const starts = found.findIndex((name) => !name.toLowerCase().startsWith('gar'));
    if (starts !== -1) expect(found.slice(starts).every((name) => !name.toLowerCase().startsWith('gar'))).toBe(true);
  });

  it('ignores case, accents, spaces and hyphens', () => {
    expect(names('GARCHOMP')[0]).toBe('Garchomp');
    expect(searchSpecies('flabebe')[0]?.id).toBe('flabebe');
    expect(searchSpecies('Flabébé')[0]?.id).toBe('flabebe');
    expect(names('iron bundle')[0]).toBe('Iron Bundle');
    expect(names('iron-bundle')[0]).toBe('Iron Bundle');
    expect(names('ironbundle')[0]).toBe('Iron Bundle');
    expect(names('Ogerpon Wellspring')[0]).toBe('Ogerpon-Wellspring');
  });

  it('forgives a swapped pair of letters in a longer word', () => {
    expect(names('garcohmp')).toContain('Garchomp');
    expect(names('dragpault')).toContain('Dragapult');
  });

  it('understands "Alolan", "Galarian", "Hisuian" and "Paldean" for forms', () => {
    expect(names('alolan raichu')[0]).toBe('Raichu-Alola');
    expect(names('galarian slowbro')[0]).toBe('Slowbro-Galar');
    expect(names('hisuian zorua')[0]).toBe('Zorua-Hisui');
  });

  it('matches every word, in any order', () => {
    expect(names('wellspring ogerpon')[0]).toBe('Ogerpon-Wellspring');
  });

  it('does not match on a single stray letter inside a word', () => {
    expect(names('z')).not.toContain('Garchomp');
    expect(names('zz')).toEqual([]);
  });

  it('returns nothing for gibberish', () => {
    expect(names('qqqqxx')).toEqual([]);
  });

  it('caps the number of results, and every result has an id and a base Speed', () => {
    const found = searchSpecies('a', 5);
    expect(found).toHaveLength(5);
    expect(searchSpecies('chomp')[0]).toMatchObject({ id: 'garchomp', spe: 102 });
  });
});
