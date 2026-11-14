import { classes } from './classes.ts';
import styles from './PokemonIcon.module.css';

export interface PokemonIconProps {
  /** The species or form, as it is written: "Ogerpon-Wellspring". */
  name: string;
}

/**
 * A Pokémon, as it is shown wherever one is named. v5.0 is text-only, so this
 * renders the name; when sprites are licensed (after v5.0) they slot in here
 * and callers don't change.
 */
export function PokemonIcon({ name }: PokemonIconProps) {
  return <span className={classes(styles.icon)}>{name}</span>;
}

export interface ItemIconProps {
  /** The item, as it is written: "Choice Scarf". */
  name: string;
}

/** An item, text only for now, for the same reason as PokemonIcon. */
export function ItemIcon({ name }: ItemIconProps) {
  return <span className={classes(styles.icon)}>{name}</span>;
}
