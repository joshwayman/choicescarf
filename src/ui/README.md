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
