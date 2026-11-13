import { Button, type ButtonProps } from 'react-aria-components';
import { ChevronDownIcon } from './icons.tsx';
import { classes } from './classes.ts';
import styles from './HeaderPill.module.css';

export interface HeaderPillProps extends Omit<ButtonProps, 'className' | 'style' | 'children'> {
  /** "Gen 9 OU", or a ruleset such as "Gen 9". */
  label: string;
  /** Quieter detail after the label, such as "Lv 100". */
  detail?: string;
}

/**
 * The pill in the header that shows the format or ruleset and opens the
 * menu to change it. Chip-sized (36 px), like the chips it sits above.
 */
export function HeaderPill({ label, detail, ...props }: HeaderPillProps) {
  return (
    <Button aria-haspopup="dialog" {...props} className={classes(styles.pill)}>
      {label}
      {detail ? ' ' : null}
      {detail ? <span className={classes(styles.detail)}>{detail}</span> : null}
      <span className={classes(styles.chevron)}>
        <ChevronDownIcon />
      </span>
    </Button>
  );
}
