import { Tab, TabList, TabPanel, Tabs, type Key } from 'react-aria-components';
import { getRuleset, type Modifier, type Terrain, type Weather } from '../../engine/index.ts';
import { Button, Sheet, SheetNote, SheetOption, SheetSection } from '../../ui/index.ts';
import { classes } from '../../ui/classes.ts';
import { findSpecies } from '../../data/index.ts';
import { modifiersIn, multiplierText } from '../calculation/derive.ts';
import type { Calculation } from '../calculation/state.ts';
import { editSide, WEATHER_NAME, type SideChange, type Which } from './edit.ts';
import type { SheetSectionId } from './sheetContext.ts';
import { ItemSpriteFor } from './ItemSpriteFor.tsx';
import styles from './Calculator.module.css';

/** The six Power items: ×0.5 each and rarely picked, so the sheet shows them as one row (#102). */
export const POWER_ITEM_IDS = ['poweranklet', 'powerband', 'powerbelt', 'powerbracer', 'powerlens', 'powerweight'];
/** Picking "Power item" stores Power Anklet, the Speed one. All six have the same effect on Speed. */
const POWER_ITEM_PICK = 'poweranklet';

export function isPowerItem(id: string | undefined): boolean {
  return id !== undefined && POWER_ITEM_IDS.includes(id);
}

/** The ability each weather and terrain powers, shown under it. */
const POWERS: Record<Weather | Terrain, string> = {
  rain: 'Swift Swim',
  sun: 'Chlorophyll',
  sand: 'Sand Rush',
  snow: 'Slush Rush',
  electric: 'Surge Surfer',
};

interface Props {
  calc: Calculation;
  onChange: (next: Calculation) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  section: SheetSectionId;
  onSectionChange: (section: SheetSectionId) => void;
  /** Tab names: "Garchomp", or "Target" before it has a species. */
  names: Record<Which, string>;
}

/**
 * One sheet for every modifier (#102): a tab for each Pokémon and one for
 * the field, so you can add to the other side or set the weather without
 * closing it. Two columns on wider screens. It edits the live calculation,
 * so the answer behind it updates as you go.
 */
export function ModifiersSheet({ calc, onChange, isOpen, onOpenChange, section, onSectionChange, names }: Props) {
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Modifiers"
      size="wide"
      footer={
        <Button variant="primary" slot="close" grow>
          Done
        </Button>
      }
    >
      <Tabs
        selectedKey={section}
        onSelectionChange={(key: Key) => {
          onSectionChange(key === 'you' ? 'you' : key === 'field' ? 'field' : 'target');
        }}
        className={classes(styles.sheetTabs)}
      >
        <TabList aria-label="What to change" className={classes(styles.sheetTabList)}>
          <Tab id="target" className={classes(styles.sheetTab)}>
            {names.target}
          </Tab>
          <Tab id="you" className={classes(styles.sheetTab)}>
            {names.you}
          </Tab>
          <Tab id="field" className={classes(styles.sheetTab)}>
            Field
          </Tab>
        </TabList>
        <TabPanel id="target" className={classes(styles.sheetPanel)}>
          <SidePanel calc={calc} which="target" onChange={onChange} />
        </TabPanel>
        <TabPanel id="you" className={classes(styles.sheetPanel)}>
          <SidePanel calc={calc} which="you" onChange={onChange} />
        </TabPanel>
        <TabPanel id="field" className={classes(styles.sheetPanel)}>
          <FieldPanel calc={calc} onChange={onChange} />
        </TabPanel>
      </Tabs>
    </Sheet>
  );
}

function SidePanel({ calc, which, onChange }: { calc: Calculation; which: Which; onChange: (next: Calculation) => void }) {
  const side = calc[which];
  const set = (change: SideChange) => {
    onChange(editSide(calc, which, change));
  };
  const species = side.species === undefined ? undefined : findSpecies(side.species);
  const abilities = [...modifiersIn(calc, 'ability')].sort(
    (a, b) => Number(species?.abilities?.includes(b.id) ?? false) - Number(species?.abilities?.includes(a.id) ?? false),
  );
  const items = modifiersIn(calc, 'item').filter((modifier) => !isPowerItem(modifier.id));
  const powerItem = modifiersIn(calc, 'item').find((modifier) => modifier.id === POWER_ITEM_PICK);

  return (
    <div className={styles.sheetColumns}>
      <div className={styles.sheetColumn}>
        <SheetSection label="Item">
          {items.map((modifier) => (
            <SheetOption
              key={modifier.id}
              label={modifier.name}
              icon={<ItemSpriteFor id={modifier.id} />}
              {...(modifier.only === 'ditto' ? { description: 'Ditto only' } : {})}
              value={multiplierText(modifier)}
              isSelected={side.item === modifier.id}
              onChange={(on) => {
                set({ item: on ? modifier.id : undefined });
              }}
            />
          ))}
          {powerItem ? (
            <SheetOption
              label="Power item"
              icon={<ItemSpriteFor id={isPowerItem(side.item) && side.item !== undefined ? side.item : POWER_ITEM_PICK} />}
              description="Power Anklet, Band, Belt, Bracer, Lens or Weight"
              value={multiplierText(powerItem)}
              isSelected={isPowerItem(side.item)}
              onChange={(on) => {
                set({ item: on ? POWER_ITEM_PICK : undefined });
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
      </div>
      <div className={styles.sheetColumn}>
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
      </div>
      <div className={styles.sheetNote}>
        <SheetNote>Only modifiers that exist in Generation 9 are listed. Weather and terrain are on the Field tab.</SheetNote>
      </div>
    </div>
  );
}

function FieldPanel({ calc, onChange }: { calc: Calculation; onChange: (next: Calculation) => void }) {
  const ruleset = getRuleset(calc.ruleset);
  const { weather, terrain } = calc.field;
  return (
    <div className={styles.sheetColumns}>
      <div className={styles.sheetColumn}>
        <SheetSection label="Weather">
          {ruleset.weathers.map((option) => (
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
      </div>
      <div className={styles.sheetColumn}>
        <SheetSection label="Terrain">
          {ruleset.terrains.map((option) => (
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
      </div>
      <div className={styles.sheetNote}>
        <SheetNote>
          The field applies to both Pokémon. Weather and terrain change Speed only for a Pokémon with a matching
          ability: add it on that Pokémon’s tab. Electric Terrain doesn’t raise an Electric type’s Speed.
        </SheetNote>
      </div>
    </div>
  );
}

function abilityHint(modifier: Modifier, itsOwn: boolean): string {
  const own = itsOwn ? 'Its ability. ' : '';
  const needs = modifier.needs;
  if (needs?.weather) return `${own}In ${needs.weather === 'sand' ? 'sandstorm' : needs.weather}`;
  if (needs?.terrain) return `${own}On Electric Terrain`;
  if (needs?.status) return `${own}With a status`;
  if (modifier.id === 'quarkdrive') return `${own}When active: Electric Terrain or Booster Energy`;
  if (modifier.id === 'protosynthesis') return `${own}When active: sun or Booster Energy`;
  if (needs?.switchedOn) return `${own}When it is active`;
  return own.trim();
}

export function withoutKey<T extends object>(value: T, key: keyof T): T {
  return Object.fromEntries(Object.entries(value).filter(([k]) => k !== key)) as T;
}
