import { useId } from 'react';
import { Button, Dialog, DialogTrigger, Heading, Popover } from 'react-aria-components';
import { ChevronDownIcon } from './icons.tsx';
import { classes } from './classes.ts';
import styles from './BoostPicker.module.css';

/** "+1", "0", "−1": boosts are written signed, as players write them. */
export function signed(value: number): string {
  return value > 0 ? `+${String(value)}` : value < 0 ? `−${String(-value)}` : '0';
}

/** What a boost multiplies Speed by: +1 is ×1.5, −1 is ×0.67. */
export function boostMultiplier(stage: number): string {
  const ratio = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
  return `×${String(Math.round(ratio * 100) / 100)}`;
}

export interface BoostProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const STEPS = [-2, -1, 1, 2] as const;

/**
 * The boost's controls (#119): four big steps (−2, −1, +1, +2) to tap as
 * often as needed, and what the boost is now and does to Speed. Inline (on
 * desktop) it is one row with the value between the steps, like a stepper;
 * in BoostPicker's panel on phones the value sits above them.
 */
export function BoostSteps({
  label,
  value,
  onChange,
  min = -6,
  max = 6,
  inline = false,
  headingSlot = false,
}: BoostProps & { inline?: boolean; headingSlot?: boolean }) {
  const headingId = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const stepButton = (by: number) => (
    <Button
      key={by}
      aria-label={`${by < 0 ? 'Lower' : 'Raise'} by ${String(Math.abs(by))}`}
      isDisabled={by < 0 ? value <= min : value >= max}
      onPress={() => {
        onChange(clamp(value + by));
      }}
      className={classes(styles.step)}
    >
      {signed(by)}
    </Button>
  );
  const readout = (
    <p aria-live="polite" className={classes(styles.readout)}>
      <span className={classes(styles.readoutValue)}>{signed(value)}</span>{' '}
      <span className={classes(styles.readoutEffect)}>
        {boostMultiplier(value)}
        {inline ? null : ' Speed'}
      </span>
    </p>
  );

  if (inline) {
    return (
      <div role="group" aria-labelledby={headingId} className={classes(styles.inline)}>
        <span id={headingId} className={classes(styles.label)}>
          {label}
        </span>
        <div className={classes(styles.row)}>
          {/* One joined control, like a stepper: the steps around the value. */}
          <div className={classes(styles.bar)}>
            {stepButton(-2)}
            {stepButton(-1)}
            {readout}
            {stepButton(1)}
            {stepButton(2)}
          </div>
          <Button
            aria-label="Reset to 0"
            isDisabled={value === 0}
            onPress={() => {
              onChange(0);
            }}
            className={classes(styles.resetInline)}
          >
            Reset
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div role="group" aria-labelledby={headingId} className={classes(styles.panel)}>
      <div className={classes(styles.top)}>
        {headingSlot ? (
          <Heading slot="title" id={headingId} className={classes(styles.heading)}>
            {label}
          </Heading>
        ) : (
          <span id={headingId} className={classes(styles.heading)}>
            {label}
          </span>
        )}
        {readout}
      </div>
      <div className={classes(styles.steps)}>{STEPS.map(stepButton)}</div>
    </div>
  );
}

/**
 * The boost on phones (#119): a field that looks like a picker (value and a
 * chevron, like "Change Pokémon"), not a number box, and opens BoostSteps in
 * a panel. No keyboard, so negatives are as easy as positives.
 */
export function BoostPicker({ label, value, onChange, min = -6, max = 6 }: BoostProps) {
  const labelId = useId();
  const valueId = useId();
  return (
    <div className={classes(styles.field)}>
      <span id={labelId} className={classes(styles.label)}>
        {label}
      </span>
      <DialogTrigger>
        <Button aria-labelledby={`${labelId} ${valueId}`} aria-haspopup="dialog" className={classes(styles.trigger)}>
          <span id={valueId}>{signed(value)}</span>
          <span aria-hidden="true" className={classes(styles.chevron)}>
            <ChevronDownIcon size={16} />
          </span>
        </Button>
        <Popover placement="bottom end" offset={6} className={classes(styles.popover)}>
          <Dialog aria-label="Speed boost" className={classes(styles.dialog)}>
            {({ close }) => (
              <>
                <BoostSteps label="Speed boost" value={value} onChange={onChange} min={min} max={max} headingSlot />
                <div className={classes(styles.actions)}>
                  <Button
                    isDisabled={value === 0}
                    onPress={() => {
                      onChange(0);
                    }}
                    className={classes(styles.reset)}
                  >
                    Reset to 0
                  </Button>
                  <Button onPress={close} className={classes(styles.done)}>
                    Done
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </Popover>
      </DialogTrigger>
    </div>
  );
}
