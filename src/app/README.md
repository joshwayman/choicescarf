# src/app

The app itself: entry points, the shell, routes and screens.

- `main.tsx` mounts `App`, which renders the router (`router.tsx`, TanStack Router).
- `Shell.tsx` is the frame around every screen: the phone header (logo, ruleset, More button) and, from 720 px, the desktop header (logo, ruleset, theme toggle, More menu). No mode tabs until Quick arrives.
- `screens/` holds one component per route, each wrapped in `Page`, which sets the document title and moves focus to the heading after navigating.

| Path | Screen |
|---|---|
| `/` | Calculator (#87; a placeholder until then) |
| `/more` | More: About, Privacy, theme |
| `/about` | About ChoiceScarf |
| `/privacy` | Privacy |
| anything else | goes to `/`, replacing the bad entry in history |

`tokens/` and `components/` are the design check pages at `/tokens.html` and `/components.html`, separate Vite entries outside the router. `vercel.json` sends every other path to `index.html`, so deep links work.
