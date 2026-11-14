import { classes } from './classes.ts';
import styles from './PokemonIcon.module.css';

/** Each icon on the sheet is 40 by 30 pixels, 12 to a row. */
const ICON_WIDTH = 40;
const ICON_HEIGHT = 30;
const ICONS_PER_ROW = 12;

export interface PokemonSpriteProps {
  /** The icon's place on the sheet, from the species data (`icon`). */
  icon: number;
}

/**
 * A Pokémon's icon from Pokémon Showdown's sheet, via @pkmn/img (ADR 0001,
 * decision 6). The sheet is a copy in ./sprites, served by the site and never
 * hotlinked. It is decorative: the name is always written beside it.
 * The images are © Nintendo/Creatures Inc./GAME FREAK Inc.
 */
export function PokemonSprite({ icon }: PokemonSpriteProps) {
  const x = (icon % ICONS_PER_ROW) * ICON_WIDTH;
  const y = Math.floor(icon / ICONS_PER_ROW) * ICON_HEIGHT;
  return (
    <span
      aria-hidden="true"
      data-icon={icon}
      className={classes(styles.sprite)}
      style={{ backgroundPosition: `-${String(x)}px -${String(y)}px` }}
    />
  );
}

export interface PokemonIconProps {
  /** The species or form, as it is written: "Ogerpon-Wellspring". */
  name: string;
  /** Its icon from the species data. Left out, only the name shows (a custom base Speed, say). */
  icon?: number | undefined;
}

/** A Pokémon, as it is shown wherever one is named: its icon, then its name. */
export function PokemonIcon({ name, icon }: PokemonIconProps) {
  return (
    <span className={classes(styles.pokemon)}>
      {icon === undefined ? null : <PokemonSprite icon={icon} />}
      <span className={classes(styles.icon)}>{name}</span>
    </span>
  );
}

/** Each icon on the item sheet is 24 by 24 pixels, 16 to a row. */
const ITEM_ICON_SIZE = 24;
const ITEM_ICONS_PER_ROW = 16;

export interface ItemSpriteProps {
  /** The icon's place on the item sheet, from the data (`itemIcon`). */
  icon: number;
}

/**
 * An item's icon from Pokémon Showdown's item sheet, via @pkmn/img (#108).
 * Self-hosted and decorative, like PokemonSprite.
 */
export function ItemSprite({ icon }: ItemSpriteProps) {
  const x = (icon % ITEM_ICONS_PER_ROW) * ITEM_ICON_SIZE;
  const y = Math.floor(icon / ITEM_ICONS_PER_ROW) * ITEM_ICON_SIZE;
  return (
    <span
      aria-hidden="true"
      data-item-icon={icon}
      className={classes(styles.itemSprite)}
      style={{ backgroundPosition: `-${String(x)}px -${String(y)}px` }}
    />
  );
}

export interface ItemIconProps {
  /** The item, as it is written: "Choice Scarf". */
  name: string;
  /** Its icon from the data. Left out, only the name shows. */
  icon?: number | undefined;
}

/** An item, as it is shown wherever one is named: its icon, then its name. */
export function ItemIcon({ name, icon }: ItemIconProps) {
  return (
    <span className={classes(styles.pokemon)}>
      {icon === undefined ? null : <ItemSprite icon={icon} />}
      <span className={classes(styles.icon)}>{name}</span>
    </span>
  );
}
