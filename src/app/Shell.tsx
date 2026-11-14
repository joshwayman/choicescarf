import { Link, Outlet, useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import {
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  RouterProvider as AriaRouterProvider,
} from 'react-aria-components';
import { HeaderBadge, IconButton, MenuIcon, MoonIcon, SunIcon } from '../ui/index.ts';
import { classes } from '../ui/classes.ts';
import { useTheme } from '../ui/theme.ts';
import { Telemetry } from './telemetry/Telemetry.tsx';
import { UpdateNotice } from './UpdateNotice.tsx';
import styles from './Shell.module.css';

/** A link to another site, such as https://www.smogon.com/, rather than a route. */
function isExternal(href: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(href);
}

/**
 * The frame around every screen: the header, then the screen.
 *
 * Phone: logo, the ruleset, and a More button that opens the More page.
 * Desktop (720 px and up): logo, then on the right the ruleset, the theme
 * toggle and a More menu with About and Privacy. There are no mode tabs in
 * v5.0, as Calculator is the only mode; they arrive with Quick.
 */
export function Shell() {
  const router = useRouter();
  return (
    // Lets React Aria links and menu items navigate through the router. Every link
    // keeps the calculation in the query (`search`), so going to More or About and
    // coming back keeps it (#65). Links to other sites (https://…) are left as
    // they are (#112).
    <AriaRouterProvider
      navigate={(href) => {
        void router.navigate({ to: href, search: true });
      }}
      useHref={(href) => (isExternal(href) ? href : router.buildLocation({ to: href, search: true }).href)}
    >
      <div className={styles.shell}>
        <a href="#main" className={styles.skip}>
          Skip to content
        </a>
        <header className={styles.header}>
          <Link to="/" search aria-label="ChoiceScarf home" className={styles.home}>
            <img src="/logo.png" alt="" width={30} height={30} className={styles.logo} />
            <span className={styles.wordmark}>ChoiceScarf</span>
          </Link>
          <div className={styles.actions}>
            {/* Generation 9 is the only ruleset in v5.0, so the pill is a label for now (#54). */}
            <HeaderBadge label="Gen 9" />
            <PhoneOnly>
              <Link to="/more" search aria-label="More" className={styles.iconLink}>
                <MenuIcon size={18} />
              </Link>
            </PhoneOnly>
            <DesktopOnly>
              <ThemeToggle />
              <MoreMenu />
            </DesktopOnly>
          </div>
        </header>
        <Telemetry />
        <UpdateNotice />
        <main id="main" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
      </div>
    </AriaRouterProvider>
  );
}

function PhoneOnly({ children }: { children: ReactNode }) {
  return <div className={styles.phoneOnly}>{children}</div>;
}

function DesktopOnly({ children }: { children: ReactNode }) {
  return <div className={styles.desktopOnly}>{children}</div>;
}

/** Desktop: flips between light and dark, and remembers the choice. */
function ThemeToggle() {
  const { theme, setPreference } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <IconButton
      aria-label={`Switch to ${next} theme`}
      onPress={() => {
        setPreference(next);
      }}
    >
      {next === 'light' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </IconButton>
  );
}

/** Desktop: the More menu. About and Privacy; the theme has its own toggle. */
function MoreMenu() {
  return (
    <MenuTrigger>
      <IconButton aria-label="More: About and Privacy">
        <MenuIcon size={18} />
      </IconButton>
      <Popover placement="bottom end" offset={8} className={classes(styles.popover)}>
        <Menu aria-label="More" className={classes(styles.menu)}>
          <MenuItem href="/about" className={classes(styles.menuItem)}>
            About ChoiceScarf
          </MenuItem>
          <MenuItem href="/privacy" className={classes(styles.menuItem)}>
            Privacy
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
