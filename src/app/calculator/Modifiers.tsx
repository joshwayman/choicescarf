import { useId } from 'react';
import { getRuleset } from '../../engine/index.ts';
import { Chip, ChipGroup, ChipToggle } from '../../ui/index.ts';
import { modifiersIn, multiplierText } from '../calculation/derive.ts';
import type { Calculation, Side } from '../calculation/state.ts';
import { editSide, modifierStates, reasonText, type SideChange, type Which } from './edit.ts';
import { isPowerItem } from './ModifiersSheet.tsx';
import { addChipId, useOpenModifiers } from './sheetContext.ts';
import styles from './Calculator.module.css';

interface Props {
  calc: Calculation;
  which: Which;
  onChange: (next: Calculation) => void;
}

/**
 * A side's modifiers: Choice Scarf and Tailwind as ready-to-add toggles (as
 * v4's two switches), a chip for each other modifier it has, and "+ Modifier"
 * for the rest. Every chip opens the Modifiers sheet on this Pokémon's tab.
 */
export function ModifierChips({ calc, which, onChange }: Props) {
  const side: Side = calc[which];
  const trickRoom = calc.field.trickRoom;
  const ruleset = getRuleset(calc.ruleset);
  const labelId = useId();
  const openModifiers = useOpenModifiers();
  const states = modifierStates(calc, side);
  const state = (id: string | undefined) => states.find((m) => m.id === id);
  const set = (change: SideChange) => {
    onChange(editSide(calc, which, change));
  };
  const openSheet = () => {
    openModifiers(which);
  };

  // Choice Scarf is a toggle; so is Iron Ball while Trick Room suggests it.
  const toggled = side.item === 'choicescarf' || (trickRoom && side.item === 'ironball');
  const item = side.item && !toggled ? state(side.item) : undefined;
  const ability = state(side.ability);
  const abilityModifier = modifiersIn(calc, 'ability').find((m) => m.id === side.ability);
  // Linked to the field when the weather or terrain is what switches it on.
  const linked =
    ability?.active === true && (abilityModifier?.needs?.weather !== undefined || abilityModifier?.needs?.terrain !== undefined);

  return (
    <div role="group" aria-labelledby={labelId} className={styles.modifiers}>
      <span id={labelId} className={styles.fieldLabel}>
        Modifiers
      </span>
      <ChipGroup>
        {trickRoom ? (
          // Under Trick Room slower is better, so these are the useful ones (#52).
          <>
            <ChipToggle
              label="Iron Ball"
              isSelected={side.item === 'ironball'}
              onChange={(on) => {
                set({ item: on ? 'ironball' : undefined });
              }}
            />
            <ChipToggle
              label="0 IVs"
              isSelected={side.iv === 0}
              onChange={(on) => {
                set({ iv: on ? 0 : ruleset.iv.default });
              }}
            />
          </>
        ) : null}
        {!trickRoom || side.item === 'choicescarf' ? (
          <ChipToggle
            label="Choice Scarf"
            isSelected={side.item === 'choicescarf'}
            onChange={(on) => {
              set({ item: on ? 'choicescarf' : undefined });
            }}
          />
        ) : null}
        <ChipToggle
          label="Tailwind"
          isSelected={side.tailwind}
          onChange={(on) => {
            set({ tailwind: on });
          }}
        />
        {item ? (
          <StateChip
            label={isPowerItem(item.id) ? 'Power item' : item.name}
            active={item.active}
            detail={item.active ? undefined : reasonText(item.reason)}
            onPress={openSheet}
          />
        ) : null}
        {ability && abilityModifier ? (
          <StateChip
            label={ability.name}
            active={ability.active}
            detail={ability.active ? multiplierText(abilityModifier) : reasonText(ability.reason, abilityModifier.needs)}
            linked={linked}
            onPress={openSheet}
          />
        ) : null}
        {side.status ? <StateChip label={side.status === 'par' ? 'Paralysed' : 'Other status'} active onPress={openSheet} /> : null}
        {side.swamp ? <StateChip label="Swamp" active detail="×0.25" onPress={openSheet} /> : null}
        <Chip id={addChipId(which)} variant="add" label="Modifier" aria-haspopup="dialog" onPress={openSheet} />
      </ChipGroup>
    </div>
  );
}

function StateChip({
  label,
  active,
  detail,
  linked = false,
  onPress,
}: {
  label: string;
  active: boolean;
  detail?: string | undefined;
  linked?: boolean;
  onPress: () => void;
}) {
  const extra = detail ? { detail, detailIsNumber: detail.startsWith('×') } : {};
  return active ? (
    <Chip variant="changed" label={label} {...extra} linked={linked} aria-haspopup="dialog" onPress={onPress} />
  ) : (
    <Chip variant="waiting" label={label} {...extra} aria-haspopup="dialog" onPress={onPress} />
  );
}
