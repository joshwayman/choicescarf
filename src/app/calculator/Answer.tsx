import { ResultsCard } from '../../ui/index.ts';
import { speciesOf, working, type Answer } from '../calculation/derive.ts';
import type { Calculation } from '../calculation/state.ts';
import styles from './Calculator.module.css';

interface Props {
  calc: Calculation;
  answer: Answer;
}

/**
 * The results card: each nature's EVs and the Speed it reaches, the Scarf
 * fallback, and the working behind "Show calc". Until both Pokémon have a
 * base Speed it says what is missing instead.
 */
export function AnswerCard({ calc, answer }: Props) {
  if (answer.kind === 'incomplete') {
    const both = answer.missing.length === 2;
    return (
      <section aria-labelledby="answer-prompt" aria-live="polite" className={styles.prompt}>
        <h2 id="answer-prompt" className={styles.promptHeading}>
          {both
            ? 'Type a base Speed for both Pokémon'
            : answer.missing[0] === 'target'
              ? 'Type the target’s base Speed'
              : 'Type your base Speed'}
        </h2>
        <p className={styles.promptText}>The EVs you need for each nature appear here.</p>
      </section>
    );
  }

  const you = speciesOf(calc.you)?.name ?? 'Your Pokémon';
  const target = speciesOf(calc.target)?.name ?? 'Target';
  const t = String(answer.targetSpeed);
  const heading = {
    outspeed: `${you} outspeeds ${t} with`,
    scarf: `${you} needs a Choice Scarf to outspeed ${t}`,
    'cannot-outspeed': `${you} can’t outspeed ${t}`,
    underspeed: `${you} underspeeds ${t} with up to`,
    'too-fast': `${you} is too fast to underspeed ${t}`,
  }[answer.kind];
  const none = calc.field.trickRoom ? 'Too fast' : 'Can’t reach';

  return (
    <ResultsCard
      heading={heading}
      rows={answer.rows.map((row) =>
        row.ev === undefined
          ? { id: row.nature, label: row.label, answer: none, stat: '—', muted: true }
          : { id: row.nature, label: row.label, answer: `${String(row.ev)} EVs`, stat: row.speed },
      )}
      calc={[
        { label: target, working: working(answer.target) },
        { label: `${you}, ${answer.shown.label}`, working: working(answer.shown.result) },
      ]}
    />
  );
}
