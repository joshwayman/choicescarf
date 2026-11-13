import { useId, type ReactNode } from 'react';
import { Disclosure, DisclosurePanel } from 'react-aria-components';
import { Button as AriaButton } from 'react-aria-components';
import { classes } from './classes.ts';
import styles from './Results.module.css';

export interface AnswerDisplayProps {
  /** The sentence above the number: "Dragapult outspeeds Garchomp with". */
  heading: string;
  /** The answer itself, such as 56. */
  value: ReactNode;
  /** The unit after it. */
  unit?: string;
  /** The line under the answer: the nature on the left... */
  footnote?: ReactNode;
  /** ...and the comparison on the right, such as <strong>334</strong> vs 333. */
  comparison?: ReactNode;
  /**
   * Under Trick Room the whole card turns yellow and says so, because the
   * answer is a maximum, not a minimum.
   */
  trickRoom?: boolean;
  /** The heading level, so the card fits the page outline. Defaults to 2. */
  level?: 1 | 2 | 3;
  /**
   * Names the region instead of the heading, when the heading alone isn't
   * unique on the page (two matchups at once, say).
   */
  label?: string;
}

/**
 * The big answer. The card is a live region, so a changed answer is read
 * out. The number swaps without animating.
 */
export function AnswerDisplay({
  heading,
  value,
  unit = 'EVs',
  footnote,
  comparison,
  trickRoom = false,
  level = 2,
  label,
}: AnswerDisplayProps) {
  const headingId = useId();
  const Heading = `h${String(level)}` as 'h1' | 'h2' | 'h3';
  return (
    <section
      {...(label === undefined ? { 'aria-labelledby': headingId } : { 'aria-label': label })}
      aria-live="polite"
      className={classes(trickRoom ? styles.answerTrickRoom : styles.answer)}
    >
      {trickRoom ? (
        <p className={classes(styles.trickRoom)}>
          Trick Room <span className={classes(styles.trickRoomNote)}>slower moves first</span>
        </p>
      ) : null}
      <Heading id={headingId} className={classes(styles.answerHeading)}>
        {heading}
      </Heading>
      <p className={classes(styles.answerValue)}>
        <span className={classes(styles.answerNumber)}>{value}</span>
        {unit ? <span className={classes(styles.answerUnit)}> {unit}</span> : null}
      </p>
      {footnote !== undefined || comparison !== undefined ? (
        <div className={classes(styles.answerFoot)}>
          <span>{footnote}</span>
          <span className={classes(styles.comparison)}>{comparison}</span>
        </div>
      ) : null}
    </section>
  );
}

export interface ResultRow {
  id: string;
  /** The option, such as "+Spe". */
  label: string;
  /** The answer for it, such as "56 EVs". */
  answer: string;
  /** The resulting Speed. */
  stat: ReactNode;
  /** No answer for this row ("Can't reach", "Too fast"): quieter, not yellow. */
  muted?: boolean;
}

export interface ResultsCardProps {
  /** "Dragapult outspeeds 333 with". */
  heading: string;
  rows: readonly ResultRow[];
  /** The working, shown under "Show calc". Each line is a label and its sum. */
  calc?: readonly { label: string; working: string }[];
  /** Start with the working shown. */
  defaultCalcOpen?: boolean;
  level?: 2 | 3;
  /** Names the region instead of the heading, when the heading alone isn't unique. */
  label?: string;
}

/**
 * Every nature's answer at once, with the working behind "Show calc".
 * The toggle is a disclosure: it says whether the working is shown.
 */
export function ResultsCard({ heading, rows, calc, defaultCalcOpen = false, level = 2, label }: ResultsCardProps) {
  const headingId = useId();
  const Heading = `h${String(level)}` as 'h2' | 'h3';
  return (
    <section
      {...(label === undefined ? { 'aria-labelledby': headingId } : { 'aria-label': label })}
      aria-live="polite"
      className={classes(styles.card)}
    >
      <Heading id={headingId} className={classes(styles.cardHeading)}>
        {heading}
      </Heading>
      <table className={classes(styles.table)}>
        <thead className={classes(styles.hiddenHead)}>
          <tr>
            <th scope="col">Nature</th>
            <th scope="col">Answer</th>
            <th scope="col">Speed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className={classes(styles.rowLabel)}>
                {row.label}
              </th>
              <td className={classes(row.muted ? styles.rowMuted : styles.rowAnswer)}>{row.answer}</td>
              <td className={classes(styles.rowStat)}>{row.stat}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {calc && calc.length > 0 ? (
        <Disclosure defaultExpanded={defaultCalcOpen} className={classes(styles.disclosure)}>
          {({ isExpanded }) => (
            <>
              <AriaButton slot="trigger" className={classes(styles.calcToggle)}>
                {isExpanded ? 'Hide calc' : 'Show calc'}
              </AriaButton>
              <DisclosurePanel className={classes(styles.calcPanel)}>
                <dl className={classes(styles.calc)}>
                  {calc.map((line) => (
                    <div key={line.label} className={classes(styles.calcLine)}>
                      <dt className={classes(styles.calcLabel)}>{line.label}</dt>
                      <dd className={classes(styles.calcWorking)}>{line.working}</dd>
                    </div>
                  ))}
                </dl>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      ) : null}
    </section>
  );
}
