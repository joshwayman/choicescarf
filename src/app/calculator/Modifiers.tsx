import { useId, type ReactNode } from 'react';
import { getRuleset } from '../../engine/index.ts';
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
 * A side's modifiers: one chip for its item (a Choice Scarf toggle until it
 * holds something else), Tailwind as a toggle (as v4's two switches), a chip
 * for each other modifier it has, and "+ Modifier" for the rest. Every chip
 * opens the Modifiers sheet on this Pokémon's tab.
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

  // A Pokémon holds one item, so one chip stands for it (#118). With no item,
  // it is a toggle for the useful one: Choice Scarf, or Iron Ball under
  // Trick Room (#52). Holding either shows that toggle switched on; holding
  // anything else shows that item's chip instead.
  const suggested = trickRoom ? 'ironball' : 'choicescarf';
  const toggleItem = side.item === undefined ? suggested : side.item === 'choicescarf' || (trickRoom && side.item === 'ironball') ? side.item : undefined;
  const item = side.item !== undefined && toggleItem === undefined ? state(side.item) : undefined;
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
        {toggleItem ? (
          <ChipToggle
            label={toggleItem === 'ironball' ? 'Iron Ball' : 'Choice Scarf'}
            icon={<ItemSpriteFor id={toggleItem} />}
            isSelected={side.item === toggleItem}
            onChange={(on) => {
              set({ item: on ? toggleItem : undefined });
            }}
          />
        ) : null}
        {item ? (
          <StateChip
            label={isPowerItem(item.id) ? 'Power item' : item.name}
            icon={<ItemSpriteFor id={item.id} />}
            active={item.active}
            detail={item.active ? undefined : reasonText(item.reason)}
            onPress={openSheet}
          />
        ) : null}
        {trickRoom ? (
          // Under Trick Room slower is better, so 0 IVs is useful too (#52).
          <ChipToggle
            label="0 IVs"
            isSelected={side.iv === 0}
            onChange={(on) => {
              set({ iv: on ? 0 : ruleset.iv.default });
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
