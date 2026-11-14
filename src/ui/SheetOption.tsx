import type { ReactNode } from 'react';
import { ToggleButton, type ToggleButtonProps } from 'react-aria-components';
import { CheckIcon } from './icons.tsx';
import { classes } from './classes.ts';
import styles from './SheetOption.module.css';

export interface SheetOptionProps extends Omit<ToggleButtonProps, 'className' | 'style' | 'children'> {
  label: string;
  /** A second line: "Swift Swim", "Active now: it is raining". */
  description?: string;
  /** The effect, on the right: "×2", "Reverses". */
  value?: ReactNode;
  /** A decorative image before the label, such as an item's icon. */
  icon?: ReactNode;
}

/**
 * A row in a sheet that is on or off: a modifier, a weather. Announced as a
 * pressed button; a check shows when on. 48 px tall.
 */
export function SheetOption({ label, description, value, icon, ...props }: SheetOptionProps) {
  return (
    <ToggleButton {...props} className={classes(styles.option)}>
      <span className={classes(styles.text)}>
        <span className={classes(styles.label)}>
          {icon ? <span className={classes(styles.icon)}>{icon}</span> : null}
          {label}
        </span>
        {description ? (
          <>
            {' '}
            <span className={classes(styles.description)}>{description}</span>
          </>
        ) : null}
      </span>{' '}
      <span className={classes(styles.end)}>
        {value !== undefined ? <span className={classes(styles.value)}>{value}</span> : null}
        <span className={classes(styles.check)}>
          <CheckIcon size={16} />
        </span>
      </span>
    </ToggleButton>
  );
}
