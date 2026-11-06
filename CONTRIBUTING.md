# Contributing to ChoiceScarf

Thanks for helping out. ChoiceScarf is maintained by [@joshwayman](https://github.com/joshwayman), who reviews and merges every change.

## Getting set up

```bash
nvm use        # Node 22, from .nvmrc
npm ci
npm start      # http://localhost:3000
```

## How changes get made

**Everything goes through a pull request.** Nobody pushes to `v4` directly, maintainer included. `v4` is what Vercel deploys to choicescarf.com.

1. **Start from an issue.** Find one in the [roadmap (#1)](https://github.com/joshwayman/choicescarf/issues/1) or open a new one.
2. **Branch from `v4`:** `git checkout -b fix/short-description origin/v4`
3. **Make the change.** Keep it focused on one issue.
4. **Check it:**
   ```bash
   npm run lint
   CI=true npm test -- --watchAll=false
   CI=true npm run build
   ```
   GitHub Actions runs the same checks on every PR and they must pass.
5. **Open a PR into `v4`** using the template. In the PR:
   - put `Closes #<issue>` in the description
   - assign **@joshwayman**
   - add one **type label** and, for roadmap work, a **phase label** (below)
6. **Check the Vercel preview** linked on the PR before asking for review.
7. @joshwayman reviews and merges. Squash merge is preferred.

## Labels

**Type** (pick one): `bug`, `enhancement`, `documentation`, `testing`, `ci`, `dependencies`, `chore`, `security`, `accessibility`

**Phase** (roadmap work only): `phase-0` … `phase-5`, matching #1

## Changing the speed maths

`src/lib/speedCalc.js` is the heart of the app and people rely on its numbers.

- Add or update tests in `src/lib/speedCalc.test.js` for any change.
- Work out the expected values from the in-game formula (e.g. [Bulbapedia: Stat](https://bulbapedia.bulbagarden.net/wiki/Stat)), not from the current code's output.
- Include a before/after example in the PR description.

## Dependencies

Dependabot opens grouped dependency PRs weekly. They follow the same rules: CI green, Vercel preview checked, merged by the maintainer.

## Using AI coding agents

Agents follow [AGENTS.md](AGENTS.md) (and [CLAUDE.md](CLAUDE.md) for Claude Code). The rules are the same as above.
