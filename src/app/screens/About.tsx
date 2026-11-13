import { TextLink } from '../../ui/index.ts';
import { Page } from './Page.tsx';

/** About ChoiceScarf. The full page, with credits, comes in #86. */
export function About() {
  return (
    <Page title="About ChoiceScarf" documentTitle="About | ChoiceScarf" prose>
      <p>
        ChoiceScarf is a Pokémon speed EV calculator. It works out the fewest Speed EVs your Pokémon needs to
        outspeed a target, for each nature, and whether you need a Choice Scarf. Under Trick Room, it works out the
        most you can have and still move first.
      </p>
      <p>
        This is version 5, which is still being built. Until it is finished,{' '}
        <TextLink href="https://choicescarf.com/">the current calculator</TextLink> is at choicescarf.com.
      </p>
    </Page>
  );
}
