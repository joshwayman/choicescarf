import { RULESET_IDS } from '../engine/index.ts';

/**
 * Placeholder while v5 is built. The app shell and routes arrive in #84,
 * and Calculator mode in #87.
 */
export function App() {
  return (
    <main>
      <h1>ChoiceScarf</h1>
      <p>Version 5 is being built. Rulesets: {RULESET_IDS.join(', ')}.</p>
      <p>
        <a href="https://choicescarf.com/">Use the current calculator</a>
      </p>
    </main>
  );
}
