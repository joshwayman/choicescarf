/**
 * Builds src/data/gen9.json from @pkmn/dex and @pkmn/data (#80):
 * one compact entry per species and form, with base Speed and the Speed
 * abilities it can have. The full dex never ships to the browser.
 *
 *   npm run data
 *
 * The output is committed. A test fails if it is out of date.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type Data, Generations, type Specie } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { gen9 } from '../src/engine/rulesets/gen9.ts';
import { toId } from '../src/data/toId.ts';
import type { SpeciesFile, StoredSpecies } from '../src/data/types.ts';

const OUTPUT = new URL('../src/data/gen9.json', import.meta.url);

/**
 * What counts as "in Generation 9" for a Calculator, which picks mechanics
 * rather than a format: everything in Scarlet and Violet, plus National Dex
 * (species from earlier games that Smogon gives a National Dex tier, such as
 * Shuckle and the Megas). Gigantamax, cosmetic and unreleased forms have no
 * National Dex tier and are left out. Formats filter by legality in v5.1.
 */
function exists(d: Data): boolean {
  if (!d.exists) return false;
  if (d.kind === 'Ability' && d.id === 'noability') return false;
  if ('isNonstandard' in d && d.isNonstandard) return d.isNonstandard === 'Past';
  return !('tier' in d && ['Illegal', 'Unreleased'].includes(d.tier));
}

/**
 * @pkmn/data documents `new Generations(Dex)`, and it works, but under this
 * repo's exactOptionalPropertyTypes the two packages' types don't line up.
 */
const dex = Dex as unknown as ConstructorParameters<typeof Generations>[0];

function isNationalDexOnly(species: Specie): boolean {
  return species.isNonstandard === 'Past';
}

export function buildGen9(): SpeciesFile {
  const generation = new Generations(dex, exists).get(9);
  const speedAbilities = new Set(gen9.modifiers.filter((m) => m.slot === 'ability').map((m) => m.id));

  const all = [...generation.species];
  const included = new Set<string>();
  for (const species of all) {
    // The types say natDexTier is always a tier; in the data it is '' for forms with none.
    if (!isNationalDexOnly(species) || (species.natDexTier as string) !== '') included.add(species.name);
  }
  // Battle-only forms (Megas, Primals, Zygarde-Complete) inherit from the form they come from.
  for (const species of all) {
    const from = species.battleOnly;
    const bases = from === undefined ? [] : Array.isArray(from) ? from : [from];
    if (bases.some((name) => included.has(name))) included.add(species.name);
  }

  const entries: { num: number; entry: StoredSpecies }[] = [];
  for (const species of all) {
    if (!included.has(species.name)) continue;
    const names: string[] = Object.values<string>(species.abilities as unknown as Record<string, string>);
    const abilities = [...new Set(names.map((name) => generation.abilities.get(name)?.id ?? ''))]
      .filter((id) => speedAbilities.has(id))
      .sort();
    if (toId(species.name) !== species.id) {
      throw new Error(`${species.name}: toId gives ${toId(species.name)}, Showdown has ${species.id}`);
    }
    const entry: StoredSpecies = { name: species.name, spe: species.baseStats.spe };
    if (abilities.length > 0) entry.abilities = abilities;
    if (isNationalDexOnly(species)) entry.natdex = true;
    entries.push({ num: species.num, entry });
  }

  // Dex order; within a number, the base form first, then forms by name.
  entries.sort(
    (a, b) =>
      a.num - b.num ||
      Number(a.entry.name.includes('-')) - Number(b.entry.name.includes('-')) ||
      a.entry.name.localeCompare(b.entry.name, 'en'),
  );

  return { ruleset: 'gen9', species: entries.map(({ entry }) => entry) };
}

/** One species per line, so a data change is a readable diff. */
export function serialize(file: SpeciesFile): string {
  const lines = file.species.map((entry) => `    ${JSON.stringify(entry)}`);
  return `{\n  "ruleset": ${JSON.stringify(file.ruleset)},\n  "species": [\n${lines.join(',\n')}\n  ]\n}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = buildGen9();
  const text = serialize(file);
  writeFileSync(OUTPUT, text);
  console.log(`Wrote ${String(file.species.length)} species to src/data/gen9.json (${String(text.length)} bytes)`);
}
