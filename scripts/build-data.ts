/**
 * Builds src/data/gen9.json from @pkmn/dex and @pkmn/data (#80):
 * one compact entry per species and form, with base Speed, the Speed
 * abilities it can have and its place on the icon sheet. The full dex never ships to the browser.
 *
 *   npm run data
 *
 * The output is committed. A test fails if it is out of date.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type Data, Generations, type Specie } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
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
    const entry: StoredSpecies = { name: species.name, spe: species.baseStats.spe, icon: iconIndex(species.name) };
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

/** Each icon on Showdown's sheet is 40 by 30 pixels, 12 to a row. */
export const ICON_WIDTH = 40;
export const ICON_HEIGHT = 30;
export const ICONS_PER_ROW = 12;

/**
 * Where a species' icon is on the sheet in src/ui/sprites (ADR 0001, decision 6),
 * as @pkmn/img places it. The sheet is a copy pinned to the @pkmn/img version
 * installed, so the two must be updated together.
 */
export function iconIndex(name: string): number {
  const { left, top } = Icons.getPokemon(name);
  return (-top / ICON_HEIGHT) * ICONS_PER_ROW + -left / ICON_WIDTH;
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
