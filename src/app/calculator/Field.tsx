import { useId, useState } from 'react';
import type { Terrain, Weather } from '../../engine/index.ts';
import { Button, Chip, ChipGroup, Sheet, SheetNote, SheetOption, SheetSection } from '../../ui/index.ts';
import { getRuleset } from '../../engine/index.ts';
import { withTrickRoom, type Calculation } from '../calculation/state.ts';
import { modifierStates, WEATHER_NAME } from './edit.ts';
import styles from './Calculator.module.css';

interface Props {
  calc: Calculation;
  onChange: (next: Calculation) => void;
}

/** The ability each weather and terrain powers, shown under it in the sheet. */
const POWERS: Record<Weather | Terrain, string> = {
  rain: 'Swift Swim',
  sun: 'Chlorophyll',
  sand: 'Sand Rush',
  snow: 'Slush Rush',
  electric: 'Surge Surfer',
};

/**
 * The FIELD row: weather and terrain, which belong to neither Pokémon (#67).
 * A weather powering an ability on either side shares that chip's shimmer.
 */
export function FieldRow({ calc, onChange }: Props) {
  const labelId = useId();
  const addId = useId();
  const [open, setOpen] = useState(false);
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
          // From a shared link. Adding Trick Room from the Field sheet comes with #52.
          <Chip
            variant="added"
            label="Trick Room"
            onPress={() => {
              onChange(withTrickRoom(calc, false));
            }}
          />
        ) : null}
        <Chip
          id={addId}
          variant="add"
          label="Field"
          aria-haspopup="dialog"
          onPress={() => {
            setOpen(true);
          }}
        />
      </ChipGroup>
      <Sheet
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            requestAnimationFrame(() => {
              if (document.activeElement === document.body) document.getElementById(addId)?.focus();
            });
          }
        }}
        title="Field"
        subtitle="Applies to both Pokémon"
        footer={
          <Button variant="primary" slot="close" grow>
            Done
          </Button>
        }
      >
        <SheetSection label="Weather">
          {getRuleset(calc.ruleset).weathers.map((option) => (
            <SheetOption
              key={option}
              label={WEATHER_NAME[option]}
              description={POWERS[option]}
              value="×2"
              isSelected={weather === option}
              onChange={(on) => {
                onChange({ ...calc, field: on ? { ...calc.field, weather: option } : withoutKey(calc.field, 'weather') });
              }}
            />
          ))}
        </SheetSection>
        <SheetSection label="Terrain">
          {getRuleset(calc.ruleset).terrains.map((option) => (
            <SheetOption
              key={option}
              label="Electric Terrain"
              description={POWERS[option]}
              value="×2"
              isSelected={terrain === option}
              onChange={(on) => {
                onChange({ ...calc, field: on ? { ...calc.field, terrain: option } : withoutKey(calc.field, 'terrain') });
              }}
            />
          ))}
        </SheetSection>
        <SheetNote>
          Weather and terrain change Speed only for a Pokémon with a matching ability. Add the ability to that Pokémon
          with + Modifier.
        </SheetNote>
      </Sheet>
    </div>
  );
}

function withoutKey<T extends object>(value: T, key: keyof T): T {
  return Object.fromEntries(Object.entries(value).filter(([k]) => k !== key)) as T;
}
