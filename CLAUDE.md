# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Before starting work, check whether an issue already exists (the v5 roadmap is #59). If not, create one, assigned to `joshwayman` with the right labels, then reference it from the PR.
- Always work on a branch and open a PR into `v5` (or `main` for a v4 fix). Never commit to `main` or `v5` directly.
- When opening a PR: assign `joshwayman`, add the type, phase and `v5` labels, link the issue with `Closes #n`, and fill in `.github/pull_request_template.md`.
- Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` before pushing. Report the real results, including failures.
- For anything touching `src/engine`, work out the expected values from the in-game formula first (the tables in `docs/specs/rulesets.md`), then write the test, then change the code.
- For front-end issues, read the boards listed on the issue from the design canvas with the Artifact tool before building.
