import { Link } from '@tanstack/react-router';
import { useId } from 'react';
import { ChevronRightIcon, ThemeSwitch } from '../../ui/index.ts';
import { Page } from './Page.tsx';
import styles from './More.module.css';

/**
 * The More page: About, Privacy and the theme. On a phone it is reached
 * from the header's More button; on desktop the header has a menu and a
 * theme toggle instead, but the page still works if linked to.
 */
export function More() {
  const themeId = useId();
  return (
    <Page title="More">
      <nav aria-label="More" className={styles.list}>
        <Link to="/about" search className={styles.row}>
          <span className={styles.rowLabel}>About ChoiceScarf</span>
          <span className={styles.chevron}>
            <ChevronRightIcon />
          </span>
        </Link>
        <Link to="/privacy" search className={styles.row}>
          <span className={styles.rowLabel}>Privacy</span>
          <span className={styles.chevron}>
            <ChevronRightIcon />
          </span>
        </Link>
      </nav>
      <section aria-labelledby={themeId} className={styles.theme}>
        <h2 id={themeId} className={styles.themeTitle}>
          Theme
        </h2>
        <ThemeSwitch />
      </section>
    </Page>
  );
}
