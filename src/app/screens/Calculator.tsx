import { useRef, useState } from 'react';
import { Button, CopyLinkButton, DESKTOP, PokemonSprite, SideSwitcher, SwapIcon, useMediaQuery } from '../../ui/index.ts';
import { nameOf, sideSpeed, solve, speciesOf } from '../calculation/derive.ts';
import type { Calculation } from '../calculation/state.ts';
import { useCalculation, useShareUrl } from '../calculation/useCalculation.ts';
import { AnswerCard } from '../calculator/Answer.tsx';
import { swapSides, type Which } from '../calculator/edit.ts';
import { FieldRow } from '../calculator/Field.tsx';
import { ModifiersSheet } from '../calculator/ModifiersSheet.tsx';
import { addChipId, ModifiersSheetContext, type SheetSectionId } from '../calculator/sheetContext.ts';
import { SideForm, nameText } from '../calculator/SideForm.tsx';
import { SpeciesPicker } from '../calculator/SpeciesPicker.tsx';
import styles from '../calculator/Calculator.module.css';
import { Page } from './Page.tsx';

/**
 * Calculator mode (#87): every field in front of you. The calculation lives
 * in the URL; typing replaces the history entry, swapping sides adds one.
 */
export function Calculator() {
  const [calc, setCalc] = useCalculation();
  const shareUrl = useShareUrl();
  const desktop = useMediaQuery(DESKTOP);
  const answer = solve(calc);

  // One Modifiers sheet for both Pokémon and the field, opened on the right tab (#102).
  const [sheetOpen, setSheetOpen] = useState(false);
  const [section, setSection] = useState<SheetSectionId>('target');
  const openedFrom = useRef<SheetSectionId>('target');
  const openModifiers = (next: SheetSectionId) => {
    openedFrom.current = next;
    setSection(next);
    setSheetOpen(true);
  };

  const actions = (
    <div className={styles.actions}>
      <Button
        icon={<SwapIcon size={18} />}
        grow
        onPress={() => {
          setCalc(swapSides(calc), { push: true });
        }}
      >
        Swap sides
      </Button>
      <CopyLinkButton getUrl={shareUrl} grow />
    </div>
  );

  return (
    <Page title="Calculator" documentTitle="ChoiceScarf | Pokémon Speed EV Calculator" hideTitle fill>
      <ModifiersSheetContext.Provider value={openModifiers}>
        {desktop ? (
          <div className={styles.desktop}>
            <SideCard calc={calc} which="target" speedValue={sideSpeed(calc, 'target', answer)} onChange={setCalc} />
            <SideCard calc={calc} which="you" speedValue={sideSpeed(calc, 'you', answer)} onChange={setCalc} />
            <div className={styles.resultsColumn}>
              <AnswerCard calc={calc} answer={answer} />
              <FieldRow calc={calc} onChange={setCalc} />
              {actions}
            </div>
          </div>
        ) : (
          <PhoneLayout calc={calc} answer={answer} onChange={setCalc} actions={actions} />
        )}
      </ModifiersSheetContext.Provider>
      <ModifiersSheet
        calc={calc}
        onChange={setCalc}
        isOpen={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          // The chip that opened the sheet may have gone (its modifier removed): land on that tab's "+" chip.
          if (!open) {
            requestAnimationFrame(() => {
              if (document.activeElement === document.body) document.getElementById(addChipId(openedFrom.current))?.focus();
            });
          }
        }}
        section={section}
        onSectionChange={setSection}
        names={{ target: tabName(calc, 'target'), you: tabName(calc, 'you') }}
      />
    </Page>
  );
}

function PhoneLayout({
  calc,
  answer,
  onChange,
  actions,
}: {
  calc: Calculation;
  answer: ReturnType<typeof solve>;
  onChange: (next: Calculation) => void;
  actions: React.ReactNode;
}) {
  const [editing, setEditing] = useState<Which>('target');
  const sides = (['target', 'you'] as const).map((which) => {
    const value = sideSpeed(calc, which, answer);
    const species = speciesOf(calc[which]);
    return {
      id: which,
      role: which === 'target' ? 'Target' : 'You',
      name: nameOf(calc[which]) === 'Custom' ? nameText(calc, which) : (nameOf(calc[which]) ?? 'Not set'),
      ...(value === undefined ? {} : { speed: value }),
      ...(species === undefined ? {} : { icon: <PokemonSprite icon={species.icon} /> }),
    };
  });

  return (
    <div className={styles.phone}>
      <SideSwitcher
        aria-label="Which Pokémon to edit"
        sides={sides}
        selectedKey={editing}
        onSelectionChange={(key) => {
          setEditing(key === 'you' ? 'you' : 'target');
        }}
      >
        {(side) => {
          const which: Which = side.id === 'you' ? 'you' : 'target';
          return (
            <section aria-label={which === 'target' ? 'Target settings' : 'Your settings'} className={styles.panel}>
              <SideForm calc={calc} which={which} layout="phone" onChange={onChange} />
            </section>
          );
        }}
      </SideSwitcher>
      <FieldRow calc={calc} onChange={onChange} />
      <div className={styles.spacer} />
      <AnswerCard calc={calc} answer={answer} />
      {actions}
    </div>
  );
}

function SideCard({
  calc,
  which,
  speedValue,
  onChange,
}: {
  calc: Calculation;
  which: Which;
  speedValue: number | undefined;
  onChange: (next: Calculation) => void;
}) {
  const headingId = `side-${which}`;
  const species = speciesOf(calc[which]);
  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitles}>
          <span className={which === 'you' ? styles.eyebrowYou : styles.eyebrow}>{which === 'target' ? 'Target' : 'You'}</span>
          <h2 id={headingId} className={styles.cardName}>
            {species ? <PokemonSprite icon={species.icon} /> : null}
            <span>{nameText(calc, which)}</span>
          </h2>
          {species ? <p className={styles.cardBase}>base {species.spe}</p> : null}
          <p className={styles.cardSpeed}>
            <span className={styles.cardSpeedValue}>{speedValue ?? '—'}</span> <span className={styles.cardSpeedLabel}>Speed</span>
          </p>
        </div>
        <SpeciesPicker calc={calc} which={which} onChange={onChange} variant="icon" />
      </div>
      <SideForm calc={calc} which={which} layout="desktop" onChange={onChange} />
    </section>
  );
}

/** A tab name in the Modifiers sheet: the species, or "Target" / "You". */
function tabName(calc: Calculation, which: Which): string {
  return speciesOf(calc[which])?.name ?? (which === 'target' ? 'Target' : 'You');
}
