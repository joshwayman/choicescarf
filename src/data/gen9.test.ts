import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { buildGen9, serialize } from '../../scripts/build-data.ts';
import { getRuleset } from '../engine/index.ts';
import { GEN9_SPECIES, findSpecies, toId } from './index.ts';

const FILE = new URL('./gen9.json', import.meta.url);

/** The size budget for the Generation 9 file, raw and gzipped (#80). */
const BUDGET = { raw: 64_000, gzip: 12_000 };

describe('Generation 9 species data', () => {
  it.each([
    ['regieleki', 'Regieleki', 200],
    ['dragapult', 'Dragapult', 142],
    ['shuckle', 'Shuckle', 5],
    ['garchomp', 'Garchomp', 102],
  ])('%s is %s with base Speed %i', (id, name, spe) => {
    expect(findSpecies(id)).toMatchObject({ id, name, spe });
  });

  it('gives every form whose Speed differs its own entry', () => {
    expect(findSpecies('minior')?.spe).toBe(120);
    expect(findSpecies('miniormeteor')?.spe).toBe(60);
    expect(findSpecies('charizardmegax')?.spe).toBe(100);
    expect(findSpecies('charizard')?.spe).toBe(100);
    expect(findSpecies('charizardmegay')?.spe).toBe(100);
    expect(findSpecies('zygarde10')?.spe).toBe(115);
    expect(findSpecies('zygardecomplete')?.spe).toBe(85);
    expect(findSpecies('palafinhero')?.spe).toBe(100);
  });

  it('keeps forms people search for even when their Speed matches (#50)', () => {
    expect(findSpecies('ogerponwellspring')).toMatchObject({ name: 'Ogerpon-Wellspring', spe: 110 });
  });

  it('lists the Speed abilities each species can have', () => {
    expect(findSpecies('barraskewda')?.abilities).toEqual(['swiftswim']);
    expect(findSpecies('hawlucha')?.abilities).toEqual(['unburden']);
    expect(findSpecies('regigigas')?.abilities).toEqual(['slowstart']);
    expect(findSpecies('raichualola')?.abilities).toEqual(['surgesurfer']);
    expect(findSpecies('ursaring')?.abilities).toEqual(['quickfeet']);
    expect(findSpecies('ursaluna')?.abilities).toBeUndefined(); // Guts, not Quick Feet
    expect(findSpecies('fluttermane')?.abilities).toEqual(['protosynthesis']);
    expect(findSpecies('garchomp')?.abilities).toBeUndefined();
    // Swampert's Mega has Swift Swim; the base form does not.
    expect(findSpecies('swampertmega')?.abilities).toEqual(['swiftswim']);
    expect(findSpecies('swampert')?.abilities).toBeUndefined();
  });

  it('has every ability in the Generation 9 ruleset’s modifier list', () => {
    const inData = new Set(GEN9_SPECIES.flatMap((species) => species.abilities ?? []));
    const inRuleset = getRuleset('gen9')
      .modifiers.filter((modifier) => modifier.slot === 'ability')
      .map((modifier) => modifier.id);
    expect(inRuleset.filter((id) => !inData.has(id))).toEqual([]);
  });

  it('only lists abilities the ruleset knows', () => {
    const known = new Set(getRuleset('gen9').modifiers.map((modifier) => modifier.id));
    const unknown = GEN9_SPECIES.flatMap((species) => species.abilities ?? []).filter((id) => !known.has(id));
    expect(unknown).toEqual([]);
  });

  it('marks species that are only in National Dex', () => {
    expect(findSpecies('shuckle')?.natdex).toBe(true);
    expect(findSpecies('charizardmegax')?.natdex).toBe(true);
    expect(findSpecies('garchomp')?.natdex).toBeUndefined();
  });

  it('leaves out Gigantamax and cosmetic or unreleased forms', () => {
    expect(findSpecies('venusaurgmax')).toBeUndefined();
    expect(findSpecies('pikachucosplay')).toBeUndefined();
    expect(findSpecies('floetteeternal')).toBeUndefined();
  });

  it('works out the same id as Showdown for every species', () => {
    // buildGen9 throws if toId and Showdown disagree; this checks a few by hand.
    expect(toId('Ogerpon-Wellspring')).toBe('ogerponwellspring');
    expect(toId('Zygarde-10%')).toBe('zygarde10');
    expect(toId('Mr. Mime-Galar')).toBe('mrmimegalar');
    expect(toId("Farfetch’d")).toBe('farfetchd');
    expect(toId('Flabébé')).toBe('flabebe');
    expect(() => buildGen9()).not.toThrow();
  });

  it('has unique ids and base Speeds from 1 to 255', () => {
    const ids = GEN9_SPECIES.map((species) => species.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(GEN9_SPECIES.every((species) => Number.isInteger(species.spe) && species.spe >= 1 && species.spe <= 255)).toBe(
      true,
    );
  });

  it(`stays within its size budget (${String(BUDGET.raw / 1000)} kB raw, ${String(BUDGET.gzip / 1000)} kB gzipped)`, () => {
    const bytes = readFileSync(FILE);
    expect(bytes.length).toBeLessThanOrEqual(BUDGET.raw);
    expect(gzipSync(bytes).length).toBeLessThanOrEqual(BUDGET.gzip);
  });

  it('is up to date: `npm run data` would not change the committed file', () => {
    expect(readFileSync(FILE, 'utf8')).toBe(serialize(buildGen9()));
  });
});
