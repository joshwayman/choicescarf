import { TextLink } from '../../ui/index.ts';
import { Page } from './Page.tsx';

/** Privacy: what stays on your device, and the two services that see anything (#86). */
export function Privacy() {
  return (
    <Page title="Privacy" prose>
      <p>ChoiceScarf runs in your browser. There are no accounts, and nothing you enter is sent to a server.</p>

      <h2>On your device</h2>
      <p>
        Your calculation is kept in the page&apos;s address, so it is in your browser history and in any link you
        share. Your choice of theme is saved in your browser, so it stays the same next time. ChoiceScarf also saves a
        copy of itself in your browser so it works offline. Clearing your browser&apos;s site data removes all of
        this.
      </p>

      <h2>Usage and errors</h2>
      <p>Two services help keep ChoiceScarf working. Neither is sent your calculation or anything you type.</p>
      <ul>
        <li>
          <TextLink href="https://marketingplatform.google.com/about/analytics/">Google Analytics</TextLink> counts
          visits: which pages are opened, roughly where from, and on what kind of device. It uses cookies to tell new
          visits from returning ones.
        </li>
        <li>
          <TextLink href="https://sentry.io/">Sentry</TextLink> receives a report when something goes wrong: the
          error, the page it happened on, and your browser and device type, so it can be fixed.
        </li>
      </ul>
      <p>
        Blocking either one, for example with a content blocker, doesn&apos;t change how ChoiceScarf works.{' '}
        <TextLink href="https://policies.google.com/privacy">Google&apos;s privacy policy</TextLink> and{' '}
        <TextLink href="https://sentry.io/privacy/">Sentry&apos;s privacy policy</TextLink> say how each handles
        data.
      </p>
    </Page>
  );
}
