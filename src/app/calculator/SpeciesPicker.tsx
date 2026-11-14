import { useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { findSpecies } from '../../data/index.ts';
import { searchSpecies } from '../../data/search.ts';
import { classes } from '../../ui/classes.ts';
import { IconButton, PokemonIcon, SearchIcon, Search, Sheet, type SearchResult } from '../../ui/index.ts';
import type { Calculation } from '../calculation/state.ts';
import { editSide, type Which } from './edit.ts';
import { nameText } from './SideForm.tsx';
import styles from './Calculator.module.css';

interface Props {
  calc: Calculation;
  which: Which;
  onChange: (next: Calculation) => void;
  /** field: a wide button naming the Pokémon (phone). icon: a round search button (desktop card). */
  variant?: 'field' | 'icon';
}

/** Pick a species: a button that names the current one, and a sheet with the search (#50). */
export function SpeciesPicker({ calc, which, onChange, variant = 'field' }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const side = calc[which];
  const named = side.species !== undefined || side.baseSpeed !== undefined;
  const label = named ? nameText(calc, which) : 'Choose Pokémon';

  const items: SearchResult[] = searchSpecies(text).map((species) => ({
    id: species.id,
    name: species.name,
    value: species.spe,
    valueLabel: `base Speed ${String(species.spe)}`,
  }));

  const buttonLabel = named ? `Change Pokémon, now ${label}` : 'Choose Pokémon';
  const openSheet = () => {
    setText('');
    setOpen(true);
  };

  const pick = (id: string) => {
    const species = findSpecies(id);
    if (!species) return;
    // A new Pokémon takes its own base Speed, and keeps its ability only if it can have it.
    const keepAbility = side.ability !== undefined && species.abilities?.includes(side.ability) === true;
    onChange(
      editSide(calc, which, {
        species: id,
        baseSpeed: undefined,
        ...(keepAbility ? {} : { ability: undefined, abilityOn: false }),
      }),
    );
    setOpen(false);
  };

  return (
    <>
      {variant === 'icon' ? (
        <IconButton variant="raised" aria-label={buttonLabel} aria-haspopup="dialog" onPress={openSheet}>
          <SearchIcon size={20} />
        </IconButton>
      ) : (
        <AriaButton className={classes(styles.pickerButton)} aria-label={buttonLabel} aria-haspopup="dialog" onPress={openSheet}>
          <span className={styles.pickerName}>
            <PokemonIcon name={label} />
          </span>
          <span aria-hidden="true" className={styles.pickerIcon}>
            <SearchIcon size={16} />
          </span>
        </AriaButton>
      )}
      <Sheet isOpen={open} onOpenChange={setOpen} title="Change Pokémon" subtitle={which === 'target' ? 'Target' : 'You'}>
        <Search
          label="Search Pokémon"
          placeholder="Search Pokémon"
          resultsLabel="Pokémon"
          items={items}
          inputValue={text}
          onInputChange={setText}
          prefiltered
          focusOnMount
          emptyMessage={text.trim() === '' ? 'Type a name, such as “chomp”' : 'No Pokémon match'}
          onSelect={pick}
        />
      </Sheet>
    </>
  );
}
