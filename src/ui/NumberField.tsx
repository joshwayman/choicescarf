import {
  Button,
  Group,
  Input,
  Label,
  NumberField as AriaNumberField,
  Text,
  type NumberFieldProps as AriaNumberFieldProps,
} from 'react-aria-components';
import { classes } from './classes.ts';
import styles from './NumberField.module.css';

export interface NumberFieldProps extends Omit<AriaNumberFieldProps, 'className' | 'style' | 'children'> {
  label: string;
  /** A hint under the label, such as "0 to 252, in steps of 4". */
  description?: string;
  /**
   * field: a plain number input with its label above (IVs, Level).
   * stepper: the input between − and + buttons, label above (Stage).
   * row: label and hint on the left, stepper on the right, as in a sheet.
   */
  variant?: 'field' | 'stepper' | 'row';
}

/**
 * A number field. Type a value, or use the arrow keys (Page Up / Down for
 * bigger steps). The stepper buttons are named "Lower <label>" and
 * "Raise <label>" and stay out of the tab order, as the arrow keys do the same.
 */
export function NumberField({ label, description, variant = 'field', ...props }: NumberFieldProps) {
  const hint = description ? (
    <Text slot="description" className={classes(styles.description)}>
      {description}
    </Text>
  ) : null;
  const stepper = (
    <Group className={classes(variant === 'row' ? styles.rowStepper : styles.stepper)}>
      <Button slot="decrement" aria-label="Lower" className={classes(styles.step)}>
        −
      </Button>
      <Input className={classes(styles.stepperInput)} />
      <Button slot="increment" aria-label="Raise" className={classes(styles.step)}>
        +
      </Button>
    </Group>
  );

  if (variant === 'row') {
    return (
      <AriaNumberField {...props} className={classes(styles.row)}>
        <span className={classes(styles.rowText)}>
          <Label className={classes(styles.rowLabel)}>{label}</Label>
          {hint}
        </span>
        {stepper}
      </AriaNumberField>
    );
  }

  return (
    <AriaNumberField {...props} className={classes(styles.field)} data-variant={variant}>
      <Label className={classes(styles.label)}>{label}</Label>
      {variant === 'stepper' ? stepper : <Input className={classes(styles.input)} />}
      {hint}
    </AriaNumberField>
  );
}
