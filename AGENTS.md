# AGENTS.md

Guidance for coding agents (Claude Code, Codex, Copilot, etc.) working in this repo. People should read [CONTRIBUTING.md](CONTRIBUTING.md); the rules are the same.

## Project

ChoiceScarf is a Pokémon speed EV calculator, live at **choicescarf.com**. It works out the minimum Speed EVs your Pokémon needs to outspeed a target (or, under Trick Room, the most it can have and still underspeed), for each nature, and whether a Choice Scarf is needed.

**This is the `v5` branch:** a TypeScript rewrite, tracked in the [v5 roadmap (#59)](https://github.com/joshwayman/choicescarf/issues/59). v4 stays on `main` and keeps running choicescarf.com until v5.0 launches (#89).

- Client-rendered single-page app: **TypeScript (strict)**, **React 19**, built with **Vite**. No server.
- Tested with **Vitest** (+ Testing Library for components), linted with **ESLint 9** and type-aware **typescript-eslint**.
- Deployed on **Vercel**. The `v5` branch has its own Vercel preview; every PR gets one too.
- The stack and why: [`docs/adr/0001-v5-stack.md`](docs/adr/0001-v5-stack.md). The speed rules and test values: [`docs/specs/rulesets.md`](docs/specs/rulesets.md).
- The design is on the [design canvas](https://claude.ai/artifact/L6FSGDhLmeAebnJcx7QKnu) (private to the maintainer; Claude sessions started by the maintainer can read it). Each front-end issue lists the boards it is built from.

### Layout

| Path | What it is |
|---|---|
| `src/engine/` | The speed engine. Pure TypeScript: **no React, no browser APIs.** The important part. |
| `src/data/` | Species and modifier data generated from `@pkmn/dex` / `@pkmn/data` (#80) |
| `src/ui/` | Tokens, themes, fonts and shared components |
| `src/app/` | Entry point (`main.tsx`), shell, routes and screens |
| `scripts/` | Build-time scripts, run with Node: `build-data.ts` writes `src/data/gen9.json` |
| `tests/` | Tests that aren't about one module (e.g. the engine import boundary) |
| `docs/adr/`, `docs/specs/` | Decision records and specs |
| `index.html` | Vite entry: meta tags, icons and the `#root` element |
| `vite.config.ts` | Vite + Vitest config (two test projects: `engine` in Node, `ui` in jsdom) |
| `eslint.config.js` | ESLint flat config, including the engine boundary rule |
| `tsconfig.json` | Solution file referencing `tsconfig.engine.json`, `tsconfig.app.json` and `tsconfig.node.json` |
| `vercel.json` | Tells Vercel to build with Vite into `dist/` |

## Commands

```bash
nvm use                      # Node 22 (see .nvmrc)
npm ci
npm run dev                  # dev server on :3000
npm run lint                 # zero warnings allowed
npm run typecheck            # tsc -b across every tsconfig
npm test                     # vitest run (npm run test:watch to watch)
npm run build                # outputs to dist/
npm run data                 # regenerate src/data/gen9.json from @pkmn/dex (commit the result)
npm run sprites              # copy any missing battle sprites into public/sprites/gen5 (commit them)
npm run preview              # serve the production build
```

## Rules

1. **Never push to `main` or `v5` directly.** v5 work goes on a branch and through a pull request into **`v5`**. v4 fixes go into `main`.
2. **One issue per PR** where possible. Put `Closes #<n>` in the PR body.
3. **Assign the PR to `joshwayman`** (sole maintainer and reviewer).
4. **Label the PR** with one type label, its phase label and `v5` (see below).
5. **Run lint, type check, tests and build before opening or updating a PR** (CI runs the same steps and must be green), and say in the PR what you ran and the result.
6. **Don't change the speed maths without tests.** Any change in `src/engine` needs tests, with expected values worked out from the in-game formula and checked against Pokémon Showdown (`@smogon/calc`), not against the current code. Write the tests first.
7. Don't skip, delete or weaken a test to make CI pass.
8. Keep PRs small and focused. Don't mix refactors with behaviour changes.
9. Never merge your own PR. Merging is the maintainer's call.

### Branch names

`<type>/<short-description>`, e.g. `fix/speed-formula-flooring`, `chore/v5-project-setup`, `phase-3/calculator-mode`.

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

Phase labels: `phase-0` to `phase-5`, matching the v5 roadmap in #59. Add `v5` to every v5 issue and PR. `roadmap` is only for tracking issues.

### Commit messages

Short imperative summary (`Add the Generation 9 ruleset`), blank line, then why if it isn't obvious. Reference the issue (`Refs #79`).

## Gotchas

- **`src/engine` is walled off.** Importing `react`, `react-dom` or anything from `src/app`, `src/ui` or `src/data` fails lint, and `tsconfig.engine.json` has no DOM types, so `window` or `document` fails the type check. Because of the lint rule, don't name a folder inside `src/engine` `app`, `ui` or `data`.
- **The speed formula must floor where the games do:** floor the stat before nature, floor after the boost stage, then apply every modifier as one chained 4096-based modifier rounded half down, then paralysis. Full rules and test values in `docs/specs/rulesets.md`.
- **TypeScript is pinned to 6.0.x.** typescript-eslint doesn't support TypeScript 7 yet (its peer range is `<6.1.0`). Move up when it does.
- **ESLint stays on 9** until the React and jsx-a11y plugins support ESLint 10 (#27).
- **Tests import from `vitest` explicitly** (`import { describe, expect, it, vi } from 'vitest'`); there are no globals. Use `vi.fn()` / `vi.spyOn()`, not `jest.*`.
- **Relative imports include the extension** (`./App.tsx`), as `verbatimModuleSyntax` and `allowImportingTsExtensions` expect.
- **The strict compiler options bite:** `noUncheckedIndexedAccess` makes `array[i]` possibly `undefined`, and `exactOptionalPropertyTypes` means an optional property can't be set to `undefined` unless its type says so.
- **`src/data/gen9.json` is generated.** Don't edit it by hand: change `scripts/build-data.ts` and run `npm run data`. A test fails if the committed file is out of date. It includes National Dex species (flagged `natdex`), because Calculator picks mechanics, not a format.
- **No analytics on `v5` yet.** v4's Tag Manager snippet was removed from this branch (#78), so previews don't send data to the live property. Google Analytics 4 is added directly in #86; don't bring Tag Manager back.
