import { TextLink } from '../../ui/index.ts';
import { Page } from './Page.tsx';

/** About ChoiceScarf, with credits (#112). */
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

      <h2>Credits</h2>
      <p>ChoiceScarf is built on the work of the Pokémon community.</p>
      <ul>
        <li>
          <TextLink href="https://www.smogon.com/">Smogon</TextLink> and{' '}
          <TextLink href="https://pokemonshowdown.com/">Pokémon Showdown</TextLink>, for the species data, the Speed
          mechanics our tests are checked against, and the Pokémon sprites and item icons.
        </li>
        <li>
          <TextLink href="https://github.com/pkmn">pkmn</TextLink>, for the libraries that bring Pokémon
          Showdown&apos;s data and sprites to other projects.
        </li>
      </ul>

      <h2>Pokémon</h2>
      <p>
        Pokémon and Pokémon character names are trademarks of Nintendo. Sprite images © Nintendo/Creatures Inc./GAME
        FREAK Inc.
      </p>
      <p>
        ChoiceScarf is an unofficial fan tool. It is not affiliated with or endorsed by Nintendo, Game Freak, The
        Pokémon Company or Smogon.
      </p>
    </Page>
  );
}
