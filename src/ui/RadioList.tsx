import type { ReactNode } from 'react';
import {
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
  Text,
  type RadioGroupProps,
} from 'react-aria-components';
import { classes } from './classes.ts';
import styles from './RadioList.module.css';

export interface RadioListOption {
  id: string;
  label: string;
  /** A second line, such as "Jolly · 252 EVs". */
  description?: string;
  /** A number at the end of the row, such as the Speed this option gives. */
  value?: ReactNode;
  /** How a screen reader should hear the value, such as "Speed 333". */
  valueLabel?: string;
}

export interface RadioListProps extends Omit<RadioGroupProps, 'className' | 'style' | 'children'> {
  /** Names the group. Shown above the rows unless hideLabel is set. */
  label: string;
  hideLabel?: boolean;
  options: readonly RadioListOption[];
}

/**
 * One choice from a list of rows, as in a sheet ("Worst case", "Max,
 * neutral"). Arrow keys move between rows; the selected row is outlined.
 * The whole row is the tap target; the radio's name is just its label, and
 * the description and value are read as its description.
 */
export function RadioList({ label, hideLabel = false, options, ...props }: RadioListProps) {
  return (
    <RadioGroup {...props} className={classes(styles.group)}>
      <Label className={classes(hideLabel ? styles.hiddenLabel : styles.label)}>{label}</Label>
      {options.map((option) => (
        <RadioField key={option.id} value={option.id} className={classes(styles.row)}>
          <RadioButton className={classes(styles.button)}>
            <span aria-hidden="true" className={classes(styles.dot)} />
            <span className={classes(styles.title)}>{option.label}</span>
          </RadioButton>
          {option.description || option.valueLabel ? (
            <Text slot="description" className={classes(styles.description)}>
              {option.description}
              {option.valueLabel ? (
                <span className={classes(styles.hidden)}>
                  {option.description ? ', ' : ''}
                  {option.valueLabel}
                </span>
              ) : null}
            </Text>
          ) : null}
          {option.value !== undefined ? (
            <span aria-hidden={option.valueLabel ? true : undefined} className={classes(styles.value)}>
              {option.value}
            </span>
          ) : null}
        </RadioField>
      ))}
    </RadioGroup>
  );
}
