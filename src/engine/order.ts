import type { Field } from './types.ts';

/**
 * The number Pokémon Showdown sorts by when deciding who moves first
 * (sim/pokemon.ts, getActionSpeed): in Trick Room the Speed becomes
 * 10000 − Speed, and either way only the low 13 bits count (mod 8192).
 *
 * So in Trick Room a Speed of 1809 or more moves before slower Pokémon, and
 * outside it a Speed of 8192 or more moves as if it were 8192 lower.
 */
export function actionSpeed(speed: number, field: Field): number {
  const value = field.trickRoom === true ? 10000 - speed : speed;
  return (value >>> 0) % 8192;
}

/**
 * Who moves first between two Pokémon with Speeds `a` and `b`, ignoring
 * priority. A tie is a tie: it never counts as a win (the games pick at random).
 */
export function movesFirst(a: number, b: number, field: Field): 'a' | 'b' | 'tie' {
  const first = actionSpeed(a, field);
  const second = actionSpeed(b, field);
  if (first === second) return 'tie';
  return first > second ? 'a' : 'b';
}
