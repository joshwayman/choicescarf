import { GEN9_SPECIES } from './index.ts';
import { toId } from './toId.ts';
import type { SpeciesEntry } from './types.ts';

/**
 * Forgiving search over the species list (#50): partial names, any word of a
 * form, words in any order, a letter or two out of place. Pure, so the picker
 * works offline and the ranking is tested without a screen.
 */

/** What people say for a regional form, as the data writes it: "Raichu-Alola". */
const ALIASES: Record<string, string> = { alolan: 'alola', galarian: 'galar', hisuian: 'hisui', paldean: 'paldea' };

interface Indexed {
  species: SpeciesEntry;
  /** Each word of the name, as an id: 'ogerpon', 'wellspring'. */
  words: string[];
  order: number;
}

const INDEX: readonly Indexed[] = GEN9_SPECIES.map((species, order) => ({
  species,
  words: species.name
    .split(/[\s-]+/)
    .map(toId)
    .filter((word) => word !== ''),
  order,
}));

function tokensOf(query: string): string[] {
  return query
    .split(/[\s\-_]+/)
    .map(toId)
    .filter((token) => token !== '')
    .map((token) => ALIASES[token] ?? token);
}

/** Edit distance counting a swapped pair of neighbouring letters as one change. */
function distance(a: string, b: string): number {
  const cell = (rows: number[][], i: number, j: number) => rows[i]?.[j] ?? 0;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i += 1) {
    const row: number[] = [];
    for (let j = 0; j <= b.length; j += 1) {
      if (i === 0 || j === 0) {
        row.push(i + j);
        continue;
      }
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(cell(rows, i - 1, j) + 1, (row[j - 1] ?? 0) + 1, cell(rows, i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, cell(rows, i - 2, j - 2) + 1);
      }
      row.push(best);
    }
    rows.push(row);
  }
  return cell(rows, a.length, b.length);
}

/** How well one typed word matches one word of a name; lower is better, undefined is no match. */
function scoreWord(token: string, word: string): number | undefined {
  if (word === token) return 0;
  if (word.startsWith(token)) return 1;
  // One-letter and two-letter words only count as the start of a word, or "w" would find everything.
  if (token.length < 3) return undefined;
  if (word.includes(token)) return 3;
  if (token.length < 4) return undefined;
  for (const length of [token.length, token.length - 1, token.length + 1]) {
    if (distance(token, word.slice(0, length)) <= 1) return 4;
  }
  return undefined;
}

function scoreToken(token: string, entry: Indexed): number | undefined {
  let best: number | undefined;
  for (const word of entry.words) {
    const score = scoreWord(token, word);
    if (score !== undefined && (best === undefined || score < best)) best = score;
  }
  // A token that runs across words ("ironbundle") is checked against the whole id.
  if (best === undefined || best > 2) {
    const id = entry.species.id;
    const whole = id.startsWith(token) ? 1 : token.length >= 3 && id.includes(token) ? 2 : undefined;
    if (whole !== undefined && (best === undefined || whole < best)) best = whole;
  }
  return best;
}

/**
 * The species that match what was typed, best first: the exact name, then
 * names that start with it, then words that start with it, then the rest. A
 * tie goes to the shorter name (the base form before "-Tera"), then Dex order.
 */
export function searchSpecies(query: string, limit = 30): SpeciesEntry[] {
  const tokens = tokensOf(query);
  if (tokens.length === 0) return [];
  const exact = toId(query);
  const matches: { entry: Indexed; score: number }[] = [];
  for (const entry of INDEX) {
    let score = 0;
    let matched = true;
    for (const token of tokens) {
      const part = scoreToken(token, entry);
      if (part === undefined) {
        matched = false;
        break;
      }
      score += part;
    }
    if (!matched) continue;
    matches.push({ entry, score: entry.species.id === exact ? -10 : score });
  }
  matches.sort(
    (a, b) =>
      a.score - b.score || a.entry.species.name.length - b.entry.species.name.length || a.entry.order - b.entry.order,
  );
  return matches.slice(0, limit).map(({ entry }) => entry.species);
}
