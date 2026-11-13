import { TextLink } from '../../ui/index.ts';
import { Page } from './Page.tsx';

/**
 * Calculator mode, at `/`. A placeholder until #87 builds it.
 */
export function Calculator() {
  return (
    <Page title="Calculator" documentTitle="ChoiceScarf | Pokémon Speed EV Calculator" prose>
      <p>Version 5 is being built. Calculator mode arrives here next.</p>
      <p>
        <TextLink href="https://choicescarf.com/">Use the current calculator</TextLink>
      </p>
    </Page>
  );
}
