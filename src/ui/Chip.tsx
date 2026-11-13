import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  ToggleButton as AriaToggleButton,
  type ButtonProps as AriaButtonProps,
  type ToggleButtonProps as AriaToggleButtonProps,
} from 'react-aria-components';
import { ChevronDownIcon, CloseIcon } from './icons.tsx';
import { classes } from './classes.ts';
import styles from './Chip.module.css';

/**
 * The chip states on the component sheet:
 * - suggestion: a Pokémon to pick, from the format's most used.
 * - recent: a Pokémon picked before; quieter than a suggestion.
 * - assumed: a value ChoiceScarf assumed ("31 IVs"). Opens a sheet to change it.
 * - changed: a value someone changed ("Choice Scarf", "Lv 99"). Opens a sheet.
 *   Both are marked aria-haspopup="dialog".
 * - add: adds something ("+ Modifier", "+ Field"). Pass the label without the plus.
 * - waiting: an ability that does nothing until the field matches ("Swift Swim, needs rain").
 * - added: a field effect that is on ("Trick Room"). Pressing it removes it.
 */
export type ChipVariant = 'suggestion' | 'recent' | 'assumed' | 'changed' | 'add' | 'waiting' | 'added';

export interface ChipProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children' | 'aria-label'> {
  variant: ChipVariant;
  /**
   * The visible text, and the accessible name. An add chip is named "Add <label>"
   * and an added chip "Remove <label>".
   */
  label: string;
  /** Quieter text after the label: "needs rain", or a multiplier such as "×2". */
  detail?: ReactNode;
  /** Render the detail in the number face (for multipliers). */
  detailIsNumber?: boolean;
  /** A decorative image before the label: a sprite or item icon, when there are images. */
  icon?: ReactNode;
  /**
   * Linked to another chip by a shared shimmer and ring: a weather and the
   * ability it powers. Reduced motion stops the shimmer and keeps the ring.
   */
  linked?: boolean;
}

const TRAILING: Partial<Record<ChipVariant, 'chevron' | 'remove'>> = {
  assumed: 'chevron',
  changed: 'chevron',
  added: 'remove',
};

/** A 36 px chip. Chips sit 8 px apart (ChipGroup), keeping a 44 px tap pitch. */
export function Chip({ variant, label, detail, detailIsNumber = false, icon, linked = false, ...props }: ChipProps) {
  const trailing = TRAILING[variant];
  const name = trailing === 'remove' ? `Remove ${label}` : variant === 'add' ? `Add ${label}` : undefined;
  return (
    <AriaButton
      {...props}
      {...(name === undefined ? {} : { 'aria-label': name })}
      {...(trailing === 'chevron' ? { 'aria-haspopup': 'dialog' as const } : {})}
      className={classes(styles.chip, styles[variant])}
      data-linked={linked || undefined}
      data-has-icon={icon ? true : undefined}
    >
      {icon ? <span className={classes(styles.icon)}>{icon}</span> : null}
      {variant === 'add' ? <span aria-hidden="true">+</span> : null}
      <span>{label}</span>
      {detail !== undefined ? ' ' : null}
      {detail !== undefined ? (
        <span className={classes(detailIsNumber ? styles.detailNumber : styles.detail)}>{detail}</span>
      ) : null}
      {trailing === 'chevron' ? (
        <span className={classes(styles.trailing)}>
          <ChevronDownIcon />
        </span>
      ) : null}
      {trailing === 'remove' ? (
        <span className={classes(styles.trailing)}>
          <CloseIcon />
        </span>
      ) : null}
    </AriaButton>
  );
}

export interface ChipToggleProps extends Omit<AriaToggleButtonProps, 'className' | 'style' | 'children'> {
  label: string;
  icon?: ReactNode;
}

/** A modifier that is simply on or off, such as Tailwind. Announced as a pressed button. */
export function ChipToggle({ label, icon, ...props }: ChipToggleProps) {
  return (
    <AriaToggleButton {...props} className={classes(styles.chip, styles.toggle)} data-has-icon={icon ? true : undefined}>
      {icon ? <span className={classes(styles.icon)}>{icon}</span> : null}
      <span>{label}</span>
    </AriaToggleButton>
  );
}

export interface ChipGroupProps {
  /** Names the group for assistive tech, such as "Garchomp's modifiers". */
  'aria-label'?: string;
  children: ReactNode;
}

/** Lays chips out in a wrapping row, 8 px apart. */
export function ChipGroup({ children, ...props }: ChipGroupProps) {
  return (
    <div role={props['aria-label'] ? 'group' : undefined} aria-label={props['aria-label']} className={classes(styles.group)}>
      {children}
    </div>
  );
}
