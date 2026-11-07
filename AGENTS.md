# AGENTS.md

Guidance for coding agents (Claude Code, Codex, Copilot, etc.) working in this repo. People should read [CONTRIBUTING.md](CONTRIBUTING.md); the rules are the same.

## Project

ChoiceScarf is a Pokémon speed EV calculator, live at **choicescarf.com**. It works out the minimum Speed EVs your Pokémon needs to outspeed a target, for each nature, and whether a Choice Scarf is needed.

- React 19 single-page app built with **Vite**, tested with **Vitest** + Testing Library, linted with ESLint 9 (flat config)
- Deployed on **Vercel** from the `v4` branch. Every PR gets a Vercel preview deployment.
- Default branch: `v4`

### Layout

| Path | What it is |
|---|---|
| `src/lib/speedCalc.js` | All the speed maths. The important file. |
| `src/lib/speedCalc.test.js` | Unit tests for the maths |
| `src/context/choicescarfContext.jsx` | State for both Pokémon and the results |
| `src/components/form/` | Input form |
| `src/components/results/` | Results chart |
| `index.html` | Vite entry; also holds the GTM snippet |
| `vite.config.js` | Vite + Vitest config |
| `eslint.config.js` | ESLint flat config |
| `vercel.json` | Tells Vercel to build with Vite into `dist/` |

## Commands

```bash
nvm use                      # Node 22 (see .nvmrc)
npm ci
npm run dev                  # dev server on :3000
npm run lint                 # zero warnings allowed
npm test                     # vitest run (npm run test:watch to watch)
npm run build                # outputs to dist/
npm run preview              # serve the production build
```

## Rules

1. **Never push to `v4` directly.** Every change goes on a branch and through a pull request into `v4`.
2. **One issue per PR** where possible. Put `Closes #<n>` in the PR body.
3. **Assign the PR to `joshwayman`** (sole maintainer and reviewer).
4. **Label the PR** with one type label and, for roadmap work, its phase label (see below).
5. **Run lint, tests and build before opening or updating a PR** (CI runs the same steps and must be green), and say in the PR what you ran and the result.
6. **Don't change the speed maths without tests.** Any change to `speedCalc.js` needs a test showing the before/after values. Check numbers against the in-game formula, not against the current code.
7. Don't skip, delete or weaken a test to make CI pass.
8. Keep PRs small and focused. Don't mix refactors with behaviour changes.
9. Never merge your own PR. Merging is the maintainer's call.

### Branch names

`<type>/<short-description>`, e.g. `fix/speed-formula-flooring`, `chore/pin-node`, `phase-0/safety-net`.

### Labels

| Type label | Use for |
|---|---|
| `bug` | Wrong behaviour or wrong numbers |
| `enhancement` | New feature or improvement |
| `documentation` | Docs only |
| `testing` | Tests only |
| `ci` | GitHub Actions, Dependabot, build config |
| `dependencies` | Package updates (Dependabot uses this too) |
| `chore` | Cleanup, tooling, no behaviour change |
| `security` | Vulnerabilities, `npm audit` |
| `accessibility` | a11y fixes |

Phase labels: `phase-0` to `phase-5`, matching the roadmap in #1. `roadmap` is only for the tracking issue.

### Commit messages

Short imperative summary (`Fix speed flooring for positive natures`), blank line, then why if it isn't obvious. Reference the issue (`Refs #23`).

## Gotchas

- **The speed formula must floor where the games do** (fixed in #23): floor the stat before nature, floor after the boost stage, then apply Scarf/Tailwind/weather as one chained 4096-based modifier. Check new expected values against the in-game formula, not the current output.
- Form inputs use `name` for the stat field (`baseSpeed`, `iv`, ...) and a unique `id` prefixed `target-` or `yours-`. Handlers read `e.target.name`. Labels repeat across the two forms, so in tests use `getAllByLabelText` or scope with `within`.
- GTM (`GTM-W7XHSG`) is loaded by the snippet in `index.html`. Don't remove it without the maintainer agreeing.
- Tests use Vitest globals (`describe`, `it`, `expect`, `vi`). Use `vi.fn()` / `vi.spyOn()`, not `jest.*`.
