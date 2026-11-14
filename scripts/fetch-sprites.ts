/**
 * Copies Pokémon Showdown's 96 × 96 "gen5" battle sprite for every species in
 * src/data/gen9.json into public/sprites/gen5/<id>.png (#110), so the site
 * serves its own copies and never hotlinks (ADR 0001, decision 6). Addresses
 * come from @pkmn/img, so run this again whenever it or the data changes:
 *
 *   npm run sprites
 *
 * Files that are already there are kept. The images are © Nintendo/Creatures
 * Inc./GAME FREAK Inc. A test fails if a species has no sprite.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Dex } from '@pkmn/dex';
import { Sprites } from '@pkmn/img';
import { toId } from '../src/data/toId.ts';
import type { SpeciesFile } from '../src/data/types.ts';

export const BATTLE_SPRITE_DIR = new URL('../public/sprites/gen5/', import.meta.url);

/** Where Showdown keeps a species' gen5 sprite. */
export function battleSpriteUrl(name: string): string {
  return Sprites.getPokemon(name, { gen: 'gen5' }).url;
}

async function main() {
  const file = JSON.parse(readFileSync(new URL('../src/data/gen9.json', import.meta.url), 'utf8')) as SpeciesFile;
  const GEN9_SPECIES = file.species.map((species) => ({ id: toId(species.name), name: species.name }));
  mkdirSync(BATTLE_SPRITE_DIR, { recursive: true });
  const todo = GEN9_SPECIES.filter((species) => !existsSync(new URL(`${species.id}.png`, BATTLE_SPRITE_DIR)));
  const failed: string[] = [];
  // A few at a time, to be gentle on Showdown's servers.
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(
      todo.slice(i, i + 4).map(async (species) => {
        let response = await fetch(battleSpriteUrl(species.name));
        // A few forms that look like their base form have no sprite of their own: Greninja-Bond, Rockruff-Dusk.
        const base = Dex.species.get(species.name).baseSpecies;
        if (response.status === 404 && base !== species.name) response = await fetch(battleSpriteUrl(base));
        if (!response.ok) {
          failed.push(`${species.name} (${String(response.status)})`);
          return;
        }
        writeFileSync(new URL(`${species.id}.png`, BATTLE_SPRITE_DIR), Buffer.from(await response.arrayBuffer()));
      }),
    );
  }
  console.log(`Copied ${String(todo.length - failed.length)} sprites; ${String(GEN9_SPECIES.length - todo.length)} were already there.`);
  if (failed.length > 0) {
    console.error(`No sprite for: ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
