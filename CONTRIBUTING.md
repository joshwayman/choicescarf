# Contributing to ChoiceScarf

Thanks for helping out. ChoiceScarf is maintained by [@joshwayman](https://github.com/joshwayman), who reviews and merges every change.

## Getting set up

```bash
nvm use        # Node 22, from .nvmrc
npm ci
npm run dev    # http://localhost:3000
```

## Branches

- **`main`** is v4, the JavaScript app that Vercel deploys to choicescarf.com. Only v4 fixes go here until v5 launches.
- **`v5`** is the TypeScript rewrite ([roadmap #59](https://github.com/joshwayman/choicescarf/issues/59)). It has its own Vercel preview and replaces `main` at launch (#89).

## How changes get made

**Everything goes through a pull request.** Nobody pushes to `main` or `v5` directly, maintainer included.

1. **Start from an issue.** Find one in the [v5 roadmap (#59)](https://github.com/joshwayman/choicescarf/issues/59) or open a new one.
2. **Branch from `v5`:** `git checkout -b chore/short-description origin/v5` (or from `main` for a v4 fix)
3. **Make the change.** Keep it focused on one issue.
4. **Check it:**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
   GitHub Actions runs the same checks on every PR and they must pass.
5. **Open a PR into `v5`** (or `main` for a v4 fix) using the template. In the PR:
   - put `Closes #<issue>` in the description
   - assign **@joshwayman**
   - add one **type label**, the **phase label** and `v5` (below)
6. **Check the Vercel preview** linked on the PR before asking for review.
7. @joshwayman reviews and merges. Squash merge is preferred.

## Labels

**Type** (pick one): `bug`, `enhancement`, `documentation`, `testing`, `ci`, `dependencies`, `chore`, `security`, `accessibility`

**Phase** (roadmap work only): `phase-0` … `phase-5`, matching #59

**Release:** `v5` on every v5 issue and PR

## Project layout

| Folder | What goes there |
|---|---|
| `src/engine` | The speed engine. Pure TypeScript: no React and no browser APIs (lint and the type check both enforce this). |
| `src/data` | Species and modifier data generated at build time |
| `src/ui` | Tokens, themes, fonts and shared components |
| `src/app` | Entry point, shell, routes and screens |

## Changing the speed maths

`src/engine` is the heart of the app and people rely on its numbers. The rules are in [`docs/specs/rulesets.md`](docs/specs/rulesets.md).

- Write the tests first, for any change.
- Work out the expected values from the in-game formula (the spec has worked examples), then check them against Pokémon Showdown. Never take them from the current code's output.
- Include a before/after example in the PR description.

## Dependencies

Dependabot opens grouped dependency PRs weekly. They follow the same rules: CI green, Vercel preview checked, merged by the maintainer.

## Using AI coding agents

Agents follow [AGENTS.md](AGENTS.md) (and [CLAUDE.md](CLAUDE.md) for Claude Code). The rules are the same as above.
