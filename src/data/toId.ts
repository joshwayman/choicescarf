/**
 * Showdown's id for a name: accents folded, lower case, letters and digits only.
 * 'Ogerpon-Wellspring' → 'ogerponwellspring', 'Flabébé' → 'flabebe'.
 */
export function toId(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}
