# src/engine

The speed engine: Speed, solving and (later) candidate sets. See `docs/specs/rulesets.md` and ADR 0001, decision 4.

- **No React, no browser APIs.** It runs in Node, in tests and in the browser alike.
- **Lint enforces the boundary.** Importing `react`, `react-dom` or anything from `src/app`, `src/ui` or `src/data` fails `npm run lint`. Because of that rule, no folder inside `src/engine` may be called `app`, `ui` or `data`.
- **The type check enforces the rest.** `tsconfig.engine.json` has no DOM types, so `window`, `document` and similar fail `npm run typecheck`.
- **Tests first.** Expected values come from the in-game formula and are checked against `@smogon/calc`, never against the current output.
