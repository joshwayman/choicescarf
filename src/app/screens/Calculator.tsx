import { useState } from 'react';
import { Button, CopyLinkButton, DESKTOP, SideSwitcher, SwapIcon, useMediaQuery } from '../../ui/index.ts';
import { nameOf, sideSpeed, solve } from '../calculation/derive.ts';
import type { Calculation } from '../calculation/state.ts';
import { useCalculation, useShareUrl } from '../calculation/useCalculation.ts';
import { AnswerCard } from '../calculator/Answer.tsx';
import { swapSides, type Which } from '../calculator/edit.ts';
import { FieldRow } from '../calculator/Field.tsx';
import { SideForm, nameText } from '../calculator/SideForm.tsx';
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
    return {
      id: which,
      role: which === 'target' ? 'Target' : 'You',
      name: nameOf(calc[which]) === 'Custom' ? nameText(calc, which) : (nameOf(calc[which]) ?? 'Not set'),
      ...(value === undefined ? {} : { speed: value }),
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
              <SideForm calc={calc} which={which} name={sheetName(calc, which)} layout="phone" onChange={onChange} />
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
  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <div className={styles.cardHead}>
        <span className={which === 'you' ? styles.eyebrowYou : styles.eyebrow}>{which === 'target' ? 'Target' : 'You'}</span>
        {/* The species picker (#50) adds a "Change Pokémon" button here. */}
        <h2 id={headingId} className={styles.cardName}>
          {nameText(calc, which)}
        </h2>
        <p className={styles.cardSpeed}>
          <span className={styles.cardSpeedValue}>{speedValue ?? '—'}</span> <span className={styles.cardSpeedLabel}>Speed</span>
        </p>
      </div>
      <SideForm calc={calc} which={which} name={sheetName(calc, which)} layout="desktop" onChange={onChange} />
    </section>
  );
}

/** "Add to Garchomp", or "Add to the target" before it has a species. */
function sheetName(calc: Calculation, which: Which): string {
  const name = nameOf(calc[which]);
  if (name && name !== 'Custom') return name;
  return which === 'target' ? 'the target' : 'your Pokémon';
}
