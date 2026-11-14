import { useId, useState, type ReactNode } from 'react';
import {
  BoostPicker,
  AnswerDisplay,
  Button,
  Chip,
  ChipGroup,
  ChipToggle,
  DialogTrigger,
  HeaderPill,
  IconButton,
  LinkIcon,
  NumberField,
  PencilIcon,
  RadioList,
  ResultsCard,
  Search,
  SegmentedControl,
  Sheet,
  SheetNote,
  SheetSection,
  SideSwitcher,
  SwapIcon,
  TextLink,
  CloseIcon,
} from '../../ui/index.ts';
import { ThemeSwitch } from '../../ui/ThemeSwitch.tsx';
import type { ThemeName } from '../../ui/tokens.ts';
import styles from './ComponentsPage.module.css';

/**
 * The components page (#83): every shared component, working, in a dark
 * and a light panel side by side, to compare with the canvas component
 * sheets. Sheets open over the whole page in the page's theme; switch the
 * theme to see them in the other.
 */
export function ComponentsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Components</h1>
        <div className={styles.switch}>
          <ThemeSwitch />
        </div>
      </header>
      <p className={styles.lede}>
        Chips are 36 px tall; every other control is at least 44 px. Sheets open in the page&apos;s theme.
      </p>
      <div className={styles.panels}>
        <Panel theme="dark" />
        <Panel theme="light" />
      </div>
    </main>
  );
}

const THEME_LABEL: Record<ThemeName, string> = { dark: 'Dark', light: 'Light' };

function Panel({ theme }: { theme: ThemeName }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-theme={theme} className={styles.panel}>
      <h2 id={headingId} className={styles.panelTitle}>
        {THEME_LABEL[theme]}
      </h2>
      <Buttons />
      <Header />
      <Chips />
      <Natures />
      <Sides />
      <Fields />
      <SearchDemo />
      <Answers theme={theme} />
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.group}>
      <h3 className={styles.groupTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Buttons() {
  return (
    <Group title="Buttons and links">
      <Button variant="primary">Done</Button>
      <div className={styles.row}>
        <Button icon={<SwapIcon size={18} />} grow>
          Swap sides
        </Button>
        <Button icon={<LinkIcon size={18} />} grow>
          Copy link
        </Button>
      </div>
      <div className={styles.inline}>
        <Button variant="quiet">Change</Button>
        <IconButton variant="raised" aria-label="Change Pokémon">
          <PencilIcon size={18} />
        </IconButton>
        <IconButton aria-label="Close">
          <CloseIcon />
        </IconButton>
      </div>
      <p className={styles.caption}>
        Links sit inline in text: <TextLink href="https://choicescarf.com/">use the current calculator</TextLink>.
      </p>
    </Group>
  );
}

const FORMATS = [
  { id: 'ou', label: 'OU', description: 'Singles', value: 'Lv 100' },
  { id: 'doubles', label: 'Doubles OU', description: 'Doubles', value: 'Lv 100' },
  { id: 'vgc', label: 'VGC', description: 'Doubles', value: 'Lv 50' },
] as const;

function Header() {
  const [format, setFormat] = useState('ou');
  return (
    <Group title="Header pills">
      <div className={styles.inline}>
        <DialogTrigger>
          <HeaderPill label="Gen 9 OU" detail="Lv 100" />
          <Sheet title="Format" subtitle="Sets the level and the Pokémon you can pick">
            <RadioList label="Format" hideLabel options={FORMATS} value={format} onChange={setFormat} />
          </Sheet>
        </DialogTrigger>
        <HeaderPill label="Gen 9" />
      </div>
    </Group>
  );
}

const SETS = [
  { id: 'worst', label: 'Worst case', description: 'Jolly · 252 EVs', value: 333, valueLabel: 'Speed 333' },
  { id: 'max', label: 'Max, neutral', description: '252 EVs', value: 303, valueLabel: 'Speed 303' },
  { id: 'none', label: 'No Speed EVs', description: 'Neutral · 0 EVs', value: 240, valueLabel: 'Speed 240' },
] as const;

function Chips() {
  const [set, setSet] = useState('worst');
  const [trickRoom, setTrickRoom] = useState(true);
  return (
    <Group title="Chips">
      <ChipGroup aria-label="Suggestions">
        <Chip variant="suggestion" label="Garchomp" />
        <Chip variant="recent" label="Iron Bundle" />
      </ChipGroup>
      <ChipGroup aria-label="Garchomp's modifiers">
        <DialogTrigger>
          <Chip variant="assumed" label="Worst case · Jolly 252" />
          <Sheet title="Garchomp’s Speed" subtitle="Pick a set">
            <RadioList label="Set" hideLabel options={SETS} value={set} onChange={setSet} />
          </Sheet>
        </DialogTrigger>
        <Chip variant="assumed" label="31 IVs" />
        <Chip variant="changed" label="Choice Scarf" />
        <Chip variant="changed" label="Lv 99" />
        <FieldSheet />
        <Chip variant="add" label="Modifier" />
      </ChipGroup>
      <ChipGroup aria-label="Field">
        <Chip variant="waiting" label="Swift Swim" detail="needs rain" />
        <Chip variant="added" label="Rain" linked />
        <Chip variant="changed" label="Swift Swim" detail="×2" detailIsNumber linked />
        {trickRoom ? (
          <Chip
            variant="added"
            label="Trick Room"
            onPress={() => {
              setTrickRoom(false);
            }}
          />
        ) : null}
      </ChipGroup>
      <ChipGroup aria-label="Modifier toggles">
        <ChipToggle label="Choice Scarf" />
        <ChipToggle label="Tailwind" defaultSelected />
      </ChipGroup>
      <p className={styles.caption}>
        Suggestion · Recent · Assumed · Changed · Add · Waiting on weather · Weather and its ability, linked · Field
        effect · Toggles
      </p>
    </Group>
  );
}

function FieldSheet() {
  return (
    <DialogTrigger>
      <Chip variant="add" label="Field" />
      <Sheet
        title="Field"
        subtitle="Applies to both Pokémon"
        footer={
          <Button variant="primary" slot="close" grow>
            Done
          </Button>
        }
      >
        <SheetSection label="Weather">
          <ChipGroup>
            <ChipToggle label="Rain" />
            <ChipToggle label="Sun" />
            <ChipToggle label="Sand" />
            <ChipToggle label="Snow" />
          </ChipGroup>
        </SheetSection>
        <SheetSection label="Room">
          <ChipGroup>
            <ChipToggle label="Trick Room" />
          </ChipGroup>
        </SheetSection>
        <SheetNote>
          Weather and terrain change Speed only for a Pokémon with a matching ability. If it can have one, the ability
          shows up as a chip on that Pokémon.
        </SheetNote>
      </Sheet>
    </DialogTrigger>
  );
}

const NATURES = [
  { id: 'plus', label: '+Spe', value: '0 EVs' },
  { id: 'neutral', label: 'Neutral', value: '56 EVs' },
  { id: 'minus', label: '−Spe', value: '208 EVs' },
];

function Natures() {
  const [answer, setAnswer] = useState('neutral');
  const [nature, setNature] = useState('plus');
  return (
    <Group title="Nature: answer buttons and a plain picker">
      <SegmentedControl
        aria-label="Your nature"
        variant="answer"
        options={NATURES}
        selectedKey={answer}
        onSelectionChange={setAnswer}
      />
      <SegmentedControl aria-label="Nature" options={NATURES} selectedKey={nature} onSelectionChange={setNature} />
    </Group>
  );
}

const SIDES = [
  { id: 'target', role: 'Target', name: 'Garchomp', speed: 333 },
  { id: 'you', role: 'You', name: 'Dragapult', speed: 334 },
];

function Sides() {
  const [side, setSide] = useState('target');
  return (
    <Group title="Target and You switcher">
      <SideSwitcher aria-label="Which Pokémon to edit" sides={SIDES} selectedKey={side} onSelectionChange={setSide}>
        {(s) => (
          <p className={styles.caption}>
            Editing {s.name}, base Speed {s.id === 'target' ? 102 : 142}.
          </p>
        )}
      </SideSwitcher>
    </Group>
  );
}

function Fields() {
  const [boost, setBoost] = useState(1);
  return (
    <Group title="Number fields and steppers">
      <div className={styles.fields}>
        <NumberField label="IVs" defaultValue={31} minValue={0} maxValue={31} />
        <NumberField label="Level" defaultValue={100} minValue={1} maxValue={100} />
        <NumberField variant="stepper" label="Stepper" defaultValue={0} minValue={-6} maxValue={6} />
        {/* The boost (#119): picked, not typed. */}
        <BoostPicker label="Boost" value={boost} onChange={setBoost} />
      </div>
      <NumberField
        variant="row"
        label="EVs"
        description="0 to 252, in steps of 4"
        defaultValue={252}
        minValue={0}
        maxValue={252}
        step={4}
      />
      <NumberField variant="row" label="Level" description="Format default" defaultValue={100} minValue={1} maxValue={100} />
    </Group>
  );
}

const POKEMON = [
  { id: 'garchomp', name: 'Garchomp', value: 102, valueLabel: 'base Speed 102' },
  { id: 'gardevoir', name: 'Gardevoir', value: 80, valueLabel: 'base Speed 80' },
  { id: 'garganacl', name: 'Garganacl', value: 35, valueLabel: 'base Speed 35' },
  { id: 'dragapult', name: 'Dragapult', value: 142, valueLabel: 'base Speed 142' },
  { id: 'iron-bundle', name: 'Iron Bundle', value: 136, valueLabel: 'base Speed 136' },
];

function SearchDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState('gar');
  return (
    <Group title="Search with results">
      <Search
        label="Search Pokémon"
        placeholder="Search Pokémon"
        items={POKEMON}
        inputValue={text}
        onInputChange={setText}
        onSelect={(id) => {
          setPicked(POKEMON.find((p) => p.id === id)?.name ?? id);
        }}
      />
      <p className={styles.caption} aria-live="polite">
        {picked ? `Picked ${picked}` : 'Nothing picked yet'}
      </p>
    </Group>
  );
}

function Answers({ theme }: { theme: ThemeName }) {
  // Both panels show the same examples, so the regions are named per theme.
  const suffix = ` (${THEME_LABEL[theme].toLowerCase()})`;
  return (
    <Group title="Answer display and results card">
      <AnswerDisplay
        level={3}
        heading="Dragapult outspeeds Garchomp with"
        label={`Answer${suffix}`}
        value={56}
        footnote="Neutral nature"
        comparison={
          <>
            <strong>334</strong> vs 333
          </>
        }
      />
      <AnswerDisplay
        level={3}
        trickRoom
        heading="Garganacl underspeeds Kingambit with up to"
        label={`Answer under Trick Room${suffix}`}
        value={72}
        footnote="Neutral nature, 0 IVs"
        comparison={
          <>
            <strong>93</strong> vs 94
          </>
        }
      />
      <ResultsCard
        level={3}
        heading="Dragapult outspeeds 333 with"
        label={`Results${suffix}`}
        defaultCalcOpen
        rows={[
          { id: 'plus', label: '+Spe', answer: '0 EVs', stat: 352 },
          { id: 'neutral', label: 'Neutral', answer: '56 EVs', stat: 334 },
          { id: 'minus', label: '−Spe', answer: '208 EVs', stat: 334 },
        ]}
        calc={[
          { label: 'Garchomp', working: '303 → ×1.1 +Spe = 333' },
          { label: 'Dragapult, neutral', working: '334 → ×1.0 = 334' },
        ]}
      />
    </Group>
  );
}
