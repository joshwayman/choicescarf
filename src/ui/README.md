# src/ui

Tokens, themes, fonts (#81) and the shared component set (#83), built on React Aria Components. Screens live in `src/app`.

## Tokens and themes

- `styles.ts` loads everything global: the fonts, `tokens.css` and `base.css`. Each entry point imports it first.
- `tokens.css` holds the design tokens as CSS variables: `--color-*`, `--font-*`, `--type-*`, `--space-*`, `--radius-*`, `--size-*`, `--duration-*`. Components use these and nothing hard-coded.
- `tokens.ts` holds the same values as data, for the token page and the tests. A test fails if the two disagree or if a text colour drops below 4.5:1, so change both together.
- Dark is the default. Light applies when the system prefers it, until someone picks a theme. `data-theme="light"` or `"dark"` works on any element, not just `<html>`.
- `theme.ts` remembers the choice in `localStorage` (`useTheme()` in components). The inline script in `index.html` applies it before the first paint.
- Reduced motion is handled globally in `base.css`, and the `--duration-*` tokens drop to `0ms`.

The token page is at `/tokens.html` (`npm run dev`, then http://localhost:3000/tokens.html). Compare it with the "Visual system: tokens" board on the design canvas.

## Components

The shared component set (#83), exported from `index.ts` and built on React Aria Components, which handles focus, keyboard and screen reader behaviour. Each component styles itself with a CSS Module and the tokens only, so it swaps theme with no extra code.

| Component | Use |
|---|---|
| `Button`, `IconButton`, `TextButton`, `TextLink` | Actions and links. `primary` is the answer yellow and is reserved for the main action. |
| `Chip`, `ChipToggle`, `ChipGroup` | Chips in every state: suggestion, recent, assumed, changed, add, waiting, added, and `linked` (shared shimmer and ring). 36 px tall. |
| `HeaderPill` | The format or ruleset pill in the header. |
| `Sheet`, `SheetSection`, `SheetNote` | A bottom sheet on a phone, a centred dialog from 720 px. Use inside `DialogTrigger`. |
| `RadioList` | One choice from a list of rows, as in a sheet. |
| `SegmentedControl` | One of a few options side by side (`plain`, or `answer` for the nature buttons). |
| `SideSwitcher` | The Target / You tabs. |
| `NumberField` | A number input: `field`, `stepper` or `row`. |
| `Search` | A search box with its results listed underneath. |
| `AnswerDisplay`, `ResultsCard` | The answer, and every nature's answer with "Show calc". |
| `ThemeSwitch` | System / Dark / Light. |

Rules the components follow: chips are 36 px; every other control is at least 44 px. Names come from the visible text, so voice control works. Nothing is coloured outside the tokens.

The components page is at `/components.html`, with every component in a dark and a light panel. Compare it with the "Components: dark / light" boards on the design canvas.
