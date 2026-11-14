import { useId, useState } from 'react';
import type { Modifier } from '../../engine/index.ts';
import { Button, Chip, ChipGroup, ChipToggle, Sheet, SheetNote, SheetOption, SheetSection } from '../../ui/index.ts';
import { findSpecies } from '../../data/index.ts';
import { modifiersIn, multiplierText } from '../calculation/derive.ts';
import type { Calculation, Side } from '../calculation/state.ts';
import { editSide, modifierStates, reasonText, type SideChange, type Which } from './edit.ts';
import styles from './Calculator.module.css';

interface Props {
  calc: Calculation;
  which: Which;
  /** "Garchomp", or "the target" before it has a name. */
  name: string;
  onChange: (next: Calculation) => void;
}

/**
 * A side's modifiers: Choice Scarf and Tailwind as ready-to-add toggles (as
 * v4's two switches), a chip for each other modifier it has, and "+ Modifier"
 * for the rest. Every chip opens the same sheet.
 */
export function ModifierChips({ calc, which, name, onChange }: Props) {
  const side: Side = calc[which];
  const labelId = useId();
  const addId = useId();
  const [open, setOpen] = useState(false);
  const states = modifierStates(calc, side);
  const state = (id: string | undefined) => states.find((m) => m.id === id);
  const set = (change: SideChange) => {
    onChange(editSide(calc, which, change));
  };
  const openSheet = () => {
    setOpen(true);
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
        {item ? <StateChip label={item.name} active={item.active} detail={reasonText(item.reason)} onPress={openSheet} /> : null}
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
        <Chip id={addId} variant="add" label="Modifier" aria-haspopup="dialog" onPress={openSheet} />
      </ChipGroup>
      <ModifierSheet
        calc={calc}
        which={which}
        name={name}
        onChange={onChange}
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          // The chip that opened the sheet may have gone (its modifier removed): land on "+ Modifier".
          if (!next) {
            requestAnimationFrame(() => {
              if (document.activeElement === document.body) document.getElementById(addId)?.focus();
            });
          }
        }}
      />
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
  detail?: string;
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

/** "Add to Garchomp": its item, ability, status and side. Only what Generation 9 has. */
export function ModifierSheet({
  calc,
  which,
  name,
  onChange,
  isOpen,
  onOpenChange,
}: Props & { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  // The sheet edits the live calculation, so the answer behind it updates as you go.
  const side = calc[which];
  const set = (change: SideChange) => {
    onChange(editSide(calc, which, change));
  };
  const species = side.species === undefined ? undefined : findSpecies(side.species);
  const abilities = [...modifiersIn(calc, 'ability')].sort(
    (a, b) => Number(species?.abilities?.includes(b.id) ?? false) - Number(species?.abilities?.includes(a.id) ?? false),
  );
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Add to ${name}`}
      footer={
        <Button variant="primary" slot="close" grow>
          Done
        </Button>
      }
    >
      <SheetSection label="Item">
        {modifiersIn(calc, 'item').map((modifier) => (
          <SheetOption
            key={modifier.id}
            label={modifier.name}
            {...(modifier.only === 'ditto' ? { description: 'Ditto only' } : {})}
            value={multiplierText(modifier)}
            isSelected={side.item === modifier.id}
            onChange={(on) => {
              set({ item: on ? modifier.id : undefined });
            }}
          />
        ))}
      </SheetSection>
      <SheetSection label="Ability">
        {abilities.map((modifier) => (
          <SheetOption
            key={modifier.id}
            label={modifier.name}
            description={abilityHint(modifier, species?.abilities?.includes(modifier.id) === true)}
            value={multiplierText(modifier)}
            isSelected={side.ability === modifier.id}
            onChange={(on) => {
              set({ ability: on ? modifier.id : undefined, abilityOn: false });
            }}
          />
        ))}
        {side.ability && modifiersIn(calc, 'ability').find((m) => m.id === side.ability)?.needs?.switchedOn ? (
          <SheetOption
            label="Switched on"
            description="It is active right now"
            isSelected={side.abilityOn}
            onChange={(on) => {
              set({ abilityOn: on });
            }}
          />
        ) : null}
      </SheetSection>
      <SheetSection label="Status">
        <SheetOption
          label="Paralysis"
          value="×0.5"
          isSelected={side.status === 'par'}
          onChange={(on) => {
            set({ status: on ? 'par' : undefined });
          }}
        />
        <SheetOption
          label="Other status"
          description="Burn, poison or sleep: only Quick Feet cares"
          isSelected={side.status === 'other'}
          onChange={(on) => {
            set({ status: on ? 'other' : undefined });
          }}
        />
      </SheetSection>
      <SheetSection label="Its side">
        <SheetOption
          label="Tailwind"
          value="×2"
          isSelected={side.tailwind}
          onChange={(on) => {
            set({ tailwind: on });
          }}
        />
        <SheetOption
          label="Swamp"
          description="Grass Pledge with Water Pledge"
          value="×0.25"
          isSelected={side.swamp}
          onChange={(on) => {
            set({ swamp: on });
          }}
        />
      </SheetSection>
      <SheetNote>
        Weather and terrain are set on the field, not on a Pokémon. Only modifiers that exist in Generation 9 are
        listed.
      </SheetNote>
    </Sheet>
  );
}

function abilityHint(modifier: Modifier, itsOwn: boolean): string {
  const own = itsOwn ? 'Its ability. ' : '';
  const needs = modifier.needs;
  if (needs?.weather) return `${own}In ${needs.weather === 'sand' ? 'sandstorm' : needs.weather}`;
  if (needs?.terrain) return `${own}On Electric Terrain`;
  if (needs?.status) return `${own}With a status`;
  if (needs?.switchedOn) return `${own}When it is active`;
  return own.trim();
}
