import { useId, type ReactNode } from 'react';
import { Chip, ChipGroup, ChipToggle } from '../../ui/index.ts';
import { ItemSpriteFor } from './ItemSpriteFor.tsx';
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

  const item = side.item && side.item !== 'choicescarf' ? state(side.item) : undefined;
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
        <ChipToggle
          label="Choice Scarf"
          icon={<ItemSpriteFor id="choicescarf" />}
          isSelected={side.item === 'choicescarf'}
          onChange={(on) => {
            set({ item: on ? 'choicescarf' : undefined });
          }}
        />
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
            icon={<ItemSpriteFor id={item.id} />}
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
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  detail?: string | undefined;
  linked?: boolean;
  icon?: ReactNode;
  onPress: () => void;
}) {
  const extra = { ...(detail ? { detail, detailIsNumber: detail.startsWith('×') } : {}), ...(icon ? { icon } : {}) };
  return active ? (
    <Chip variant="changed" label={label} {...extra} linked={linked} aria-haspopup="dialog" onPress={onPress} />
  ) : (
    <Chip variant="waiting" label={label} {...extra} aria-haspopup="dialog" onPress={onPress} />
  );
}
