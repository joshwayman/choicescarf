import { useId } from 'react';
import { getRuleset } from '../../engine/index.ts';
import { Chip, ChipGroup } from '../../ui/index.ts';
import { withTrickRoom, type Calculation } from '../calculation/state.ts';
import { modifierStates, WEATHER_NAME } from './edit.ts';
import { withoutKey } from './ModifiersSheet.tsx';
import { addChipId, useOpenModifiers } from './sheetContext.ts';
import styles from './Calculator.module.css';

interface Props {
  calc: Calculation;
  onChange: (next: Calculation) => void;
}

/**
 * The FIELD row: weather and terrain, which belong to neither Pokémon (#67).
 * A weather powering an ability on either side shares that chip's shimmer.
 * "+ Field" opens the Modifiers sheet on its Field tab.
 */
export function FieldRow({ calc, onChange }: Props) {
  const labelId = useId();
  const openModifiers = useOpenModifiers();
  const { weather, terrain, trickRoom } = calc.field;

  // Linked when an ability on either side is active because of this field state.
  const powered = (kind: 'weather' | 'terrain') =>
    [calc.target, calc.you].some((side) =>
      modifierStates(calc, side).some(
        (m) =>
          m.slot === 'ability' &&
          m.active &&
          getRuleset(calc.ruleset).modifiers.find((x) => x.id === m.id)?.needs?.[kind] !== undefined,
      ),
    );

  return (
    <div role="group" aria-labelledby={labelId} className={styles.fieldRow}>
      <span id={labelId} className={styles.eyebrow}>
        Field
      </span>
      <ChipGroup>
        {weather ? (
          <Chip
            variant="added"
            label={WEATHER_NAME[weather]}
            linked={powered('weather')}
            onPress={() => {
              onChange({ ...calc, field: withoutKey(calc.field, 'weather') });
            }}
          />
        ) : null}
        {terrain ? (
          <Chip
            variant="added"
            label="Electric Terrain"
            linked={powered('terrain')}
            onPress={() => {
              onChange({ ...calc, field: withoutKey(calc.field, 'terrain') });
            }}
          />
        ) : null}
        {trickRoom ? (
          // From a shared link. Adding Trick Room from the Field tab comes with #52.
          <Chip
            variant="added"
            label="Trick Room"
            onPress={() => {
              onChange(withTrickRoom(calc, false));
            }}
          />
        ) : null}
        <Chip
          id={addChipId('field')}
          variant="add"
          label="Field"
          aria-haspopup="dialog"
          onPress={() => {
            openModifiers('field');
          }}
        />
      </ChipGroup>
    </div>
  );
}
