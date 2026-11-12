# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Before starting work, check whether an issue already exists (the roadmap is #1). If not, create one, assigned to `joshwayman` with the right labels, then reference it from the PR.
- Always work on a branch and open a PR into `main`. Never commit to `main`.
- When opening a PR: assign `joshwayman`, add the type and phase labels, link the issue with `Closes #n`, and fill in `.github/pull_request_template.md`.
- Run `npm run lint`, `npm test` and `npm run build` before pushing. Report the real results, including failures.
- For anything touching `src/lib/speedCalc.js`, work out the expected values from the in-game formula first, then write the test, then change the code.
