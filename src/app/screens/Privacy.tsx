import { Page } from './Page.tsx';

/**
 * Privacy. Says only what is true of this build; #86 adds analytics and
 * error reporting, and updates this page with them.
 */
export function Privacy() {
  return (
    <Page title="Privacy" prose>
      <p>ChoiceScarf runs in your browser. There are no accounts, and nothing you enter is sent to a server.</p>
      <p>
        Your choice of theme is saved in your browser, so it stays the same next time. Clearing your browser&apos;s
        site data removes it.
      </p>
    </Page>
  );
}
