import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps as AriaButtonProps,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components';
import { classes } from './classes.ts';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  /**
   * primary: the answer yellow, for the one main action ("Done").
   * secondary: outlined ("Swap sides", "Copy link").
   * quiet: a small pill ("Change").
   */
  variant?: ButtonVariant;
  /** A decorative icon before the label. */
  icon?: ReactNode;
  /** Stretch to share a row equally with its siblings. */
  grow?: boolean;
  children: ReactNode;
}

/** A labelled button. Every variant is at least 44 px tall. */
export function Button({ variant = 'secondary', icon, grow = false, children, ...props }: ButtonProps) {
  return (
    <AriaButton {...props} className={classes(styles[variant])} data-grow={grow || undefined}>
      {icon}
      {children}
    </AriaButton>
  );
}

export interface IconButtonProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  /** Required: the button has no visible text. */
  'aria-label': string;
  /** raised: outlined on a surface ("Change Pokémon"). quiet: hairline only ("Close"). */
  variant?: 'raised' | 'quiet';
  children: ReactNode;
}

/** A round 44 px button holding only an icon. */
export function IconButton({ variant = 'quiet', children, ...props }: IconButtonProps) {
  return (
    <AriaButton {...props} className={classes(variant === 'raised' ? styles.iconRaised : styles.iconQuiet)}>
      {children}
    </AriaButton>
  );
}

export interface TextButtonProps extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  children: ReactNode;
}

/** A button that reads as an underlined link, such as "Show calc". */
export function TextButton({ children, ...props }: TextButtonProps) {
  return (
    <AriaButton {...props} className={classes(styles.textButton)}>
      {children}
    </AriaButton>
  );
}

export interface TextLinkProps extends Omit<AriaLinkProps, 'className' | 'style' | 'children'> {
  children: ReactNode;
}

/** An inline link to another page. */
export function TextLink({ children, ...props }: TextLinkProps) {
  return (
    <AriaLink {...props} className={classes(styles.link)}>
      {children}
    </AriaLink>
  );
}
