# ADR 0001: The v5 stack

- **Status:** Accepted
- **Date:** 13 November 2026. Amended the same day with the analytics, error reporting and release order decisions.
- **Issue:** #61 (part of the v5 roadmap, #59)
- **Supersedes:** #21

## Summary

v5 is a client-rendered single-page app in TypeScript, built with Vite and deployed to Vercel as static files. There is no server, no runtime API and no pre-rendering. The calculation lives in the URL, the speed maths is a framework-free module, and everything the app needs is bundled at build time so it works offline.

| Area | Decision |
|---|---|
| Language | TypeScript, strict |
| App shape | Client-rendered SPA on Vite, static hosting on Vercel |
| Routing | TanStack Router |
| Calculation state | In the URL |
| Library and battle state | Zustand stores, persisted to IndexedDB |
| Speed engine | Pure TypeScript, no React, built on candidate sets |
| Data | Generated at build time from `@pkmn/dex` and `@pkmn/data` |
| UI primitives | React 19 with React Aria Components |
| Styling | CSS variables for tokens, CSS Modules for components |
| Offline | Service worker via `vite-plugin-pwa` |
| Tests | Vitest for the engine, Playwright with axe for the flows |
| Analytics | Google Analytics 4, loaded directly (no Tag Manager) |
| Error reporting | Sentry |
| Release order | Calculator first, then rulesets and formats, then Quick, then Teams and Battle |

## Context

The design phase (#64) settled what v5 has to do. These are the requirements that shape the stack:

- **One calculation, three views.** Quick shows it as chips, Calculator as fields, and Battle as a scene. Switching between them must lose nothing.
- **Instant and offline.** The quality bar says no spinners between opening the app and an answer, and that it works offline once loaded.
- **Ranges as well as numbers.** Battle shows an opponent's Speed as a range ("188 to 333") and narrows it when the player records who moved first.
- **Rulesets as data.** Generations 3 to 9 and Champions change the maths and which modifiers exist (#62).
- **A local library.** Teams, recents and settings persist on the device. Teams belong to a format.
- **Dialog-heavy UI at axe zero.** Bottom sheets, a search combobox, tabs and radio lists all have to be accessible.

Two things were decided before this record: the rewrite is in TypeScript, and hosting stays on Vercel.

### What the maintainer wants from it

- **Fun and easy to use** is the goal.
- **Shipped in pieces.** Calculator mode goes out first so the engine is proven before anything is built on it.
- **Usage has to be measurable,** and errors reported.
- **Search traffic is not a goal.** A page per Pokémon for people searching "garchomp speed tiers" was the strongest argument for pre-rendering in #61. The maintainer does not want it: more traffic means the site costs money to run.

That second point removes the only reason to pre-render, and it makes low running cost a requirement in its own right.

## Decisions

### 1. A client-rendered SPA, with no pre-rendering

Vite builds the app to static files and Vercel serves them. Every route falls back to `index.html`.

- **No server code.** No functions, no API routes, nothing that bills per request.
- **Routes still exist for people.** `/gen9ou/garchomp` works as a link you can share or bookmark. It is rendered in the browser and is not written for search engines.
- **Indexing.** Only the home page is meant to be found by search. Deep routes should carry a canonical link to the home page so they are not indexed separately.

### 2. TanStack Router

The calculation lives in the URL (decision 3), so the router's handling of search parameters matters more than anything else it does.

- **Typed, validated search parameters.** A route declares a schema with `validateSearch` and components read typed values from it. Invalid or missing values can fall back to defaults, which is what a share link from an older version needs.
- **Works as a plain client-side router** on Vite, with no framework mode required.

React Router is the alternative. It is a sound choice and more widely known, but search parameters arrive as untyped strings and the typing and validation would be ours to build. This is the least certain decision in this record: if TanStack Router proves awkward in the first build issue, switching is cheap while there are few routes.

### 3. State in three layers

| Layer | What it holds | Where it lives |
|---|---|---|
| Calculation | Both Pokémon, their sets and modifiers, the field, the format or ruleset | The URL |
| Library | Teams, recents, theme, last format | IndexedDB |
| Battle session | Both teams in play, who is active, recorded turns and deductions | In memory, mirrored to IndexedDB so a refresh does not lose a battle |

- **The URL is the single source of truth for a calculation.** Share links (#53), the back button and switching between Quick and Calculator all come from this one mechanism. Changing mode changes the path and keeps the query.
- **The URL format is versioned** so old links keep working.
- **Zustand** holds the library and battle stores. It is small, has no provider tree, and works outside React, which keeps the stores testable.
- **IndexedDB, through the `idb` wrapper,** because teams with full sets outgrow `localStorage` and need to be read without blocking.
- **Local first, no accounts, no sync.**

### 4. A framework-free speed engine built on candidate sets

The engine is a pure TypeScript module with no React and no browser APIs. It does three things:

- **Forward:** given a set, a ruleset and the field, return the final Speed.
- **Solve:** find the fewest EVs that outspeed a target for each nature, or the most that still underspeed it in Trick Room.
- **Enumerate:** for an opponent whose set is unknown, list every plausible spread (nature, EVs, IVs, item, ability) with its Speed.

The third is what makes Battle mode cheap. A Speed range is the minimum and maximum of the candidate set. A deduction ("it moved before my 284") is a filter on that set. The set is a few thousand entries at most, so brute force is fast enough and far easier to test than interval arithmetic.

- **Rulesets are data.** Each ruleset declares its investment system (EVs or Stat Points), its modifiers and their multipliers. Paralysis being ×0.25 before Generation 7 and ×0.5 after is a table entry, not a branch in the code.
- **Flooring follows the games.** The rule from v4 carries over: floor the stat before nature, floor after the stage, then apply item, Tailwind and weather as one chained 4096-based modifier.
- **Tests come first.** Expected values are worked out from the in-game formula, then cross-checked against Pokémon Showdown.

### 5. Data is generated at build time

- **Species, abilities and items** come from `@pkmn/dex` and `@pkmn/data`. A build script writes one compact file per ruleset holding only what the app uses: name, base Speed, the abilities that affect Speed, legality and an icon reference. The full dex never ships to the browser.
- **Usage data** stays a monthly snapshot committed by pull request (#58), one file per format, loaded when that format is chosen.
- **Team import and export** use `@pkmn/sets`, which parses and writes Showdown's set format.
- **No data is fetched from a third party at runtime.** `@pkmn/smogon` can fetch live analysis data from `data.pkmn.cc`, but using it in the browser would break offline use and add a dependency on someone else's server. It may be useful inside the snapshot script.

### 6. Images sit behind one component

`@pkmn/img` returns addresses on Pokémon Showdown's servers plus a position within a sprite sheet. Whether v5 may use those images, and whether it hosts copies, depends on permission. The maintainer will ask Smogon once a text-only v5.0 is live to show them.

- **One `PokemonIcon` component and one `ItemIcon` component** own that decision. Everything else asks for an icon by name.
- **Both have a text-only fallback, and v5.0 ships with it.** Quick and Calculator must work with no images. Battle and Teams depend on them.
- **Offline needs local copies.** If permission is granted, the sheets are stored with the app and cached by the service worker.

### 7. React 19 with React Aria Components

The designs are built from sheets, a search combobox, tab bars, radio lists, steppers and toggle chips. These are the components where accessibility bugs live.

- **React Aria Components** supplies the behaviour (focus management, keyboard handling, screen reader semantics, touch handling) and no styling, so the components look exactly like the designs.
- **Hand-rolling these** was the alternative. It would put the axe-zero quality bar at risk for no gain.

### 8. CSS variables and CSS Modules

- **Tokens are CSS variables.** The designs swap light and dark as a one-to-one change of token values, so a theme is one block of variables. The token table is in #69.
- **Components use CSS Modules.** The system is small and bespoke. A utility framework or a runtime styling library would add weight without saving work.
- **Fonts are self-hosted** through `@fontsource` (Inter, Space Grotesk, Space Mono), so there is no request to Google and they are available offline.
- **Motion respects `prefers-reduced-motion`.**

### 9. Offline through a service worker

`vite-plugin-pwa` generates the service worker.

- **Precache the app, the data files, the fonts and the icon sheets.** By default the plugin only precaches JavaScript, CSS and HTML, so the glob patterns have to be widened.
- **Updates prompt the user.** The shell design already has an update notice (#65).
- **This also keeps hosting cost down:** a returning visitor downloads almost nothing.

### 10. Testing

- **Vitest** for the engine and the stores. This is where most of the test value is.
- **Testing Library** for components that carry logic.
- **Playwright** for the flows: Quick from empty to answer, Calculator, a singles battle with a deduction.
- **axe on every route in CI,** in both themes and at phone and desktop sizes. The quality bar is zero issues.
- **A layout check in CI.** The design review found screens that overran a phone by a few pixels. The same measurement (no content past the bottom of a 390 × 844 screen, no tap target under 44 px) runs as a Playwright test.

### 11. Google Analytics 4 and Sentry

v4 loads Google Tag Manager. v5 replaces it with two direct integrations.

- **Google Analytics 4,** loaded with its own tag, so the maintainer can see how much the app is used. Tag Manager goes: nothing else needs it.
- **Sentry** for error reporting, with source maps uploaded at build time so reports point at real code.
- **Neither may block the app.** Both load after the first render, and the app must behave the same when they are blocked or the device is offline.
- **No personal data.** Teams, sets and anything typed stay on the device. Error reports must not carry them.
- **The Privacy page names both.**

### 12. Release order

v5 ships in pieces, not all at once. Each release proves the layer the next one stands on.

| Release | Contains | What it proves |
|---|---|---|
| v5.0 | Calculator mode with Trick Room, Generation 9 rules, a text-only species picker, light and dark themes, share links, offline | Engine, URL state, tokens, components, data build |
| v5.1 | Rulesets for Generations 3 to 8 and Champions, and the formats built on them | Rulesets as data |
| v5.2 | Quick mode | Formats, defaults, the chip components |
| Later | Teams and Battle, usage data, sprites | Library, candidate sets |

The numbers are a guide to order, not a commitment. v5.0 replaces v4 on choicescarf.com once it does everything v4 does.

## Running cost

The maintainer wants the site to stay cheap to run. This stack keeps it to static file transfer:

- **No functions and no server rendering,** so there is no per-request compute.
- **Small, cacheable files.** Data is split per ruleset and per format, so nobody downloads all of it.
- **The service worker** means repeat visits cost almost nothing.
- **No per-Pokémon pages,** so there is nothing drawing search traffic.

Vercel's Hobby plan is free for personal, non-commercial projects and includes a monthly data transfer allowance. The exact figures should be read from Vercel's limits page when this is agreed, since they change.

## Options considered and rejected

| Option | Why not |
|---|---|
| Next.js | Its strengths are server rendering and server components. v5 has no server, so it would add concepts and build complexity with nothing in return. |
| Astro with React islands | Islands suit mostly static pages with pockets of interactivity. v5 is one interactive app whose state spans every screen. |
| React Router in framework mode with pre-rendering | This was the first recommendation, chosen to get a page per Pokémon. With search traffic no longer a goal, pre-rendering has no purpose here. |
| A runtime API for species or usage data | Breaks offline use, adds running cost, and nothing in the designs needs live data. |
| Keeping all state in React context | v4 does this. It would not survive three modes, a persistent library and a battle session. |

## Consequences

- **The engine can be built and tested before any UI exists.** It is Phase 2 of the roadmap and has no dependency on the rest.
- **Every calculation is a link.** That is a feature (#53), and it means the URL format is a public contract that needs versioning from the first release.
- **First load carries the app and one ruleset's data.** Bundle size needs a budget, and data files must stay split.
- **No server means no shared state.** Teams do not sync between devices. Export and import through Showdown's format is the workaround.
- **Two third-party requests per visit,** for analytics and error reporting. Everything else is served from the site itself.
- **Two more dependencies to keep current:** TanStack Router and React Aria Components. Both are actively maintained and Dependabot already covers the repo.

## Open questions

- **Cross-checking against Showdown.** `@smogon/calc` computes final Speed internally. Whether it exposes it in a way tests can call needs checking before it is relied on as the oracle.
- **Sprites.** Permission, licence and hosting, as described in decision 6.

## Versions checked

Checked against the npm registry on 13 November 2026. These show that each choice is current and compatible with React 19 and Vite 8; they are not pins.

| Package | Version | Note |
|---|---|---|
| `@tanstack/react-router` | 1.170.46 | Requires React 18 or 19 |
| `react-router` (alternative) | 8.5.1 | Requires React 19.2.7 or later |
| `react-aria-components` | 1.22.1 | Supports React 19 |
| `zustand` | 5.1.0 | |
| `idb` | 8.0.4 | |
| `vite-plugin-pwa` | 2.0.0 | Supports Vite 8 |
| `@pkmn/dex`, `@pkmn/data` | 0.11.0 | |
| `@pkmn/sets` | 7.0.0 | |
| `@pkmn/img` | 0.3.5 | |
| `@sentry/react` | 11.12.0 | Supports React 19 |
| `@playwright/test` | 1.65.0 | |
| `@axe-core/playwright` | 4.14.0 | |
| `typescript` | 7.0.2 | |
