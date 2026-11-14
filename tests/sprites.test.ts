import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ICON_HEIGHT, ICON_WIDTH, ICONS_PER_ROW, iconIndex } from '../scripts/build-data.ts';
import { GEN9_SPECIES, findSpecies } from '../src/data/index.ts';

/**
 * The Pokémon icon sheet is a copy of Pokémon Showdown's, served by the site
 * (ADR 0001, decision 6; #106). Its positions come from @pkmn/img, so the copy
 * and the package are pinned together: when one changes, so must the other.
 */
const SHEET = new URL('../src/ui/sprites/pokemonicons-sheet.png', import.meta.url);
const PINNED = {
  img: '0.3.5',
  sha256: '81c713b8f4d94f7f577c546974e3d562d90b38c98b38b1b63b2a953b9acfca2a',
};

function pngSize(bytes: Buffer): { width: number; height: number } {
  // The IHDR chunk comes first: width and height are at bytes 16 and 20.
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('Pokémon icon sheet', () => {
  const bytes = readFileSync(SHEET);

  it('is the copy that matches the installed @pkmn/img', () => {
    const pkg = JSON.parse(readFileSync(new URL('../node_modules/@pkmn/img/package.json', import.meta.url), 'utf8')) as {
      version: string;
    };
    expect(pkg.version).toBe(PINNED.img);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(PINNED.sha256);
  });

  it('is a grid of 40 × 30 icons, 12 to a row', () => {
    const { width, height } = pngSize(bytes);
    expect(width).toBe(ICON_WIDTH * ICONS_PER_ROW);
    expect(height % ICON_HEIGHT).toBe(0);
  });

  it('has a place for every species', () => {
    const cells = (pngSize(bytes).height / ICON_HEIGHT) * ICONS_PER_ROW;
    for (const species of GEN9_SPECIES) {
      expect(Number.isInteger(species.icon) && species.icon > 0 && species.icon < cells, species.name).toBe(true);
    }
  });

  it.each([
    // A base species sits at its National Dex number.
    ['garchomp', 445],
    ['dragapult', 887],
    // Forms come after every numbered species, at the place @pkmn/img gives them.
    ['ogerponwellspring', iconIndex('Ogerpon-Wellspring')],
    ['charizardmegax', iconIndex('Charizard-Mega-X')],
  ])('puts %s at %i', (id, icon) => {
    expect(findSpecies(id)?.icon).toBe(icon);
  });

  it('gives forms that look different their own icon', () => {
    expect(findSpecies('ogerponwellspring')?.icon).not.toBe(findSpecies('ogerpon')?.icon);
    expect(findSpecies('charizardmegax')?.icon).not.toBe(findSpecies('charizard')?.icon);
  });
});
