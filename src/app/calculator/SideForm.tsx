import { useId } from 'react';
import { getRuleset, type Nature } from '../../engine/index.ts';
import { BoostPicker, BoostSteps, NumberField, SegmentedControl } from '../../ui/index.ts';
import { baseOf, NATURE_LABEL, speciesOf } from '../calculation/derive.ts';
import type { Calculation } from '../calculation/state.ts';
import { editSide, type Which } from './edit.ts';
import { ModifierChips } from './Modifiers.tsx';
import { SpeciesPicker } from './SpeciesPicker.tsx';
import styles from './Calculator.module.css';

interface Props {
  calc: Calculation;
  which: Which;
  layout: 'phone' | 'desktop';
  onChange: (next: Calculation) => void;
}

const NATURE_OPTIONS = (['plus', 'neutral', 'minus'] as const).map((id) => ({ id, label: NATURE_LABEL[id] }));

function isNature(value: string): value is Nature {
  return value === 'plus' || value === 'neutral' || value === 'minus';
}

/**
 * One Pokémon's fields (#66): base Speed, then nature and EVs for the
 * target (yours are solved), IVs, level, stage, and its modifiers.
 */
export function SideForm({ calc, which, layout, onChange }: Props) {
  const ruleset = getRuleset(calc.ruleset);
  const side = calc[which];
  const solvedId = useId();
  const set = (change: Parameters<typeof editSide>[2]) => {
    onChange(editSide(calc, which, change));
  };
  const whole = (value: number) => (Number.isNaN(value) ? undefined : value);

  const base = (
    <NumberField
      label="Base Speed"
      minValue={1}
      maxValue={255}
      value={baseOf(side) ?? Number.NaN}
      onChange={(value) => {
        set({ baseSpeed: whole(value) });
      }}
    />
  );

  return (
    <div className={styles.form}>
      {layout === 'phone' ? (
        <div className={styles.nameRow}>
          <SpeciesPicker calc={calc} which={which} onChange={onChange} />
          <div className={styles.baseField}>{base}</div>
        </div>
      ) : null}

      {which === 'target' ? (
        <SegmentedControl
          aria-label="Nature"
          options={NATURE_OPTIONS}
          selectedKey={calc.target.nature}
          onSelectionChange={(key) => {
            if (isNature(key)) set({ nature: key });
          }}
        />
      ) : (
        <p id={solvedId} className={styles.solvedNote}>
          Nature and EVs are solved in the results
        </p>
      )}

      <div className={styles.numbers}>
        {layout === 'desktop' ? base : null}
        {which === 'target' ? (
          <NumberField
            label="EVs"
            minValue={ruleset.ev.min}
            maxValue={ruleset.ev.max}
            step={ruleset.ev.step}
            value={calc.target.ev}
            onChange={(value) => {
              set({ ev: whole(value) ?? 0 });
            }}
          />
        ) : (
          <div className={styles.solved}>
            <span className={styles.fieldLabel} aria-hidden="true">
              EVs
            </span>
            <span className={styles.solvedValue} aria-describedby={solvedId}>
              Solved
            </span>
          </div>
        )}
        <NumberField
          label="IVs"
          minValue={ruleset.iv.min}
          maxValue={ruleset.iv.max}
          value={side.iv}
          onChange={(value) => {
            set({ iv: whole(value) ?? ruleset.iv.default });
          }}
        />
        <NumberField
          label="Level"
          minValue={ruleset.level.min}
          maxValue={ruleset.level.max}
          value={side.level}
          onChange={(value) => {
            set({ level: whole(value) ?? ruleset.level.default });
          }}
        />
        {layout === 'phone' ? (
          <BoostPicker
            label="Boost"
            min={ruleset.stage.min}
            max={ruleset.stage.max}
            value={side.stage}
            onChange={(value) => {
              set({ stage: value });
            }}
          />
        ) : null}
      </div>

      {layout === 'desktop' ? (
        <div className={styles.stageRow}>
          <BoostSteps
            inline
            label="Speed boost"
            min={ruleset.stage.min}
            max={ruleset.stage.max}
            value={side.stage}
            onChange={(value) => {
              set({ stage: value });
            }}
          />
        </div>
      ) : null}

      <ModifierChips calc={calc} which={which} onChange={onChange} />
    </div>
  );
}

/** The name shown above the fields on a phone. */
export function nameText(calc: Calculation, which: Which): string {
  const side = calc[which];
  const species = speciesOf(side);
  if (species) return species.name;
  const base = baseOf(side);
  if (base !== undefined) return `Custom · base ${String(base)}`;
  return which === 'target' ? 'Type the target’s base Speed' : 'Type your base Speed';
}
