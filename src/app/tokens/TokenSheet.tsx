import { useId } from 'react';
import {
  COLOR_ROLES,
  LOGO_COLORS,
  RADII,
  SPACING,
  TYPE_STYLES,
  type ThemeName,
} from '../../ui/tokens.ts';
import { useTheme, type ThemePreference } from '../../ui/theme.ts';
import styles from './TokenSheet.module.css';

/**
 * The token page (#81): the canvas token sheet ("Visual system: tokens")
 * rebuilt from the real CSS variables, so the two can be compared. Every
 * swatch is painted with its variable; the hex beside it is what the design
 * says it should be.
 */
export function TokenSheet() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="" width={48} height={48} className={styles.logo} />
          <h1 className={styles.title}>ChoiceScarf v5 visual system</h1>
        </div>
        <ThemeSwitch />
      </header>

      <section aria-labelledby="t-logo" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id="t-logo" className={styles.h2}>
            From the logo
          </h2>
          <p className={styles.note}>
            Yellow is the one colour not in the scarf. It marks the answer and the primary action,
            nothing else.
          </p>
        </div>
        <ul className={styles.logoGrid}>
          {LOGO_COLORS.map((color) => (
            <li key={color.label} className={styles.swatch}>
              <span className={styles.chip} style={{ background: color.value }} />
              <span className={styles.swatchName}>{color.label}</span>
              <code className={styles.hex}>{color.value}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="t-col" className={styles.section}>
        <h2 id="t-col" className={styles.h2}>
          Colour roles
        </h2>
        <div className={styles.themes}>
          <ThemePanel theme="dark" />
          <ThemePanel theme="light" />
        </div>
      </section>

      <div className={styles.lower}>
        <section aria-labelledby="t-type" className={styles.section}>
          <h2 id="t-type" className={styles.h2}>
            Type
          </h2>
          <dl className={styles.typeList}>
            {TYPE_STYLES.map((type) => (
              <div key={type.token} className={styles.typeRow}>
                <dt className={styles.typeLabel}>{type.label}</dt>
                <dd className={styles.typeSpec}>{type.spec}</dd>
                <dd className={styles[`type-${type.token}`]}>{type.sample}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className={styles.side}>
          <section aria-labelledby="t-rad" className={styles.section}>
            <h2 id="t-rad" className={styles.h2}>
              Radius
            </h2>
            <ul className={styles.radiusGrid}>
              {RADII.map((radius) => (
                <li key={radius.token} className={styles.swatch}>
                  <span
                    className={styles.radiusSample}
                    style={{ borderRadius: `var(--radius-${radius.token})` }}
                  />
                  <code className={styles.radiusValue}>{radius.label}</code>
                  <span className={styles.note}>{radius.use}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="t-sp" className={styles.section}>
            <h2 id="t-sp" className={styles.h2}>
              Spacing
            </h2>
            <ul className={styles.spacing}>
              {SPACING.map((space) => (
                <li key={space} className={styles.space}>
                  <span className={styles.spaceBar} style={{ width: `var(--space-${String(space)})` }} />
                  <code className={styles.hex}>{space}</code>
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              Phone gutter 20. Chips are 36 tall and sit 8 apart, so each keeps a 44 tap pitch.
              Every other control is at least 44 tall.
            </p>
          </section>

          <section aria-labelledby="t-mo" className={styles.section}>
            <h2 id="t-mo" className={styles.h2}>
              Motion
            </h2>
            <p className={styles.note}>
              Sheets slide up in 200 ms; the answer number swaps with no animation. A weather chip
              and the ability it powers share one slow shimmer and a ring. With reduced motion on,
              sheets appear without sliding and the shimmer stops, leaving the ring.
            </p>
            <span className={styles.shimmerChip}>Rain</span>
          </section>
        </div>
      </div>
    </main>
  );
}

const THEME_LABEL: Record<ThemeName, string> = { dark: 'Dark', light: 'Light' };

function ThemePanel({ theme }: { theme: ThemeName }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-theme={theme} className={styles.panel}>
      <div className={styles.sectionHead}>
        <h3 id={headingId} className={styles.h3}>
          {THEME_LABEL[theme]}
        </h3>
        <p className={styles.panelNote}>All text roles pass 4.5:1 on ground, surface and raised</p>
      </div>
      <ul className={styles.roleGrid}>
        {COLOR_ROLES.map((role) => (
          <li key={role.token} className={styles.swatch}>
            <span className={styles.chip} style={{ background: `var(--color-${role.token})` }} />
            <span className={styles.swatchName}>{role.label}</span>
            <code className={styles.panelHex}>{role[theme]}</code>
          </li>
        ))}
      </ul>
      <div className={styles.samples}>
        <div className={styles.answerCard}>
          <span className={styles.answerLabel}>Speed EVs</span>
          <span className={styles['type-answer']}>56</span>
        </div>
        <button type="button" className={styles.primary}>
          Show the answer
        </button>
      </div>
    </section>
  );
}

const PREFERENCES: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function ThemeSwitch() {
  const { preference, theme, setPreference } = useTheme();
  return (
    <fieldset className={styles.switch}>
      <legend className={styles.switchLegend}>
        Theme{preference === 'system' ? ` (following the system: ${THEME_LABEL[theme].toLowerCase()})` : ''}
      </legend>
      <div className={styles.switchOptions}>
        {PREFERENCES.map((option) => (
          <label key={option.value} className={styles.switchOption}>
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={preference === option.value}
              onChange={() => {
                setPreference(option.value);
              }}
              className={styles.switchInput}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
