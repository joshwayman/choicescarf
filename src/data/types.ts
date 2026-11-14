/** One species or form as stored in a ruleset's data file. */
export interface StoredSpecies {
  /** 'Ogerpon-Wellspring'. The id is worked out from it (see toId). */
  name: string;
  /** Base Speed. */
  spe: number;
  /** Its icon's place on the Pokémon icon sheet, counting along each row from 0 (see PokemonSprite). */
  icon: number;
  /** Speed-modifying abilities it can have, as engine modifier ids. Left out when none. */
  abilities?: string[];
  /** Only in National Dex, not in Scarlet and Violet. Left out otherwise. */
  natdex?: boolean;
}

/** A species with its id, as the app uses it. */
export interface SpeciesEntry extends StoredSpecies {
  /** Showdown id: 'ogerponwellspring' */
  id: string;
}

export interface SpeciesFile {
  ruleset: 'gen9';
  species: StoredSpecies[];
}
