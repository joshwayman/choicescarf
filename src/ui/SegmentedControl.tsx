import { RadioButton, RadioField, RadioGroup } from 'react-aria-components';
import { classes } from './classes.ts';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption {
  id: string;
  label: string;
  /** answer variant only: the result for this option, such as "56 EVs". */
  value?: string;
}

export interface SegmentedControlProps {
  /** Names the group, such as "Nature" or "Your nature". */
  'aria-label': string;
  options: readonly SegmentedOption[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  /**
   * plain: a compact picker (Nature in a sheet).
   * answer: taller buttons showing each option's result; the selected one is
   * the answer yellow (the nature buttons under the answer).
   */
  variant?: 'plain' | 'answer';
}

/**
 * Exactly one of a few options, side by side. It is a radio group: Tab
 * lands on the selected option and the arrow keys move the selection.
 */
export function SegmentedControl({
  options,
  selectedKey,
  onSelectionChange,
  variant = 'plain',
  ...props
}: SegmentedControlProps) {
  return (
    <RadioGroup
      aria-label={props['aria-label']}
      orientation="horizontal"
      value={selectedKey}
      onChange={onSelectionChange}
      className={classes(styles.group)}
      style={{ gridTemplateColumns: `repeat(${String(options.length)}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <RadioField key={option.id} value={option.id} className={classes(styles.field)}>
          <RadioButton className={classes(variant === 'answer' ? styles.answer : styles.plain)}>
            {variant === 'answer' ? (
              <>
                <span className={classes(styles.answerLabel)}>{option.label}</span>{' '}
                {option.value ? <span className={classes(styles.answerValue)}>{option.value}</span> : null}
              </>
            ) : (
              option.label
            )}
          </RadioButton>
        </RadioField>
      ))}
    </RadioGroup>
  );
}
