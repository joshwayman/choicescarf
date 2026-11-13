# The calculation in the URL

- **Status:** Version 1, for v5.0 Calculator mode.
- **Issue:** #53 (part of the v5 roadmap, #59). State rules: #65.
- **Code:** `src/app/calculation/` (`url.ts` reads and writes it; tests in `url.test.ts`).

The URL is the single source of truth for a calculation. Share links, the back button and, later, switching between Quick and Calculator all come from it. **Once a link has been shared it has to keep working,** so this format only ever grows: keys are added, never renamed or given a new meaning. A change that would break that bumps the version.

## Shape

The calculation is in the query string of the mode's path. In v5.0 Calculator is at `/`:

```
/?v=1&t=garchomp&y=dragapult&y.item=choicescarf&weather=rain
```

- **Only values that differ from the default are written.** A fresh calculation is just `/`. A link records what you changed.
- **`v=1` is written whenever anything else is.** A link with no `v` is read as version 1.
- **Keys are written in a fixed order** (the order of the tables below), so the same calculation always gives the same link.
- **Ids are Pokémon Showdown ids:** lower case, letters and digits only (`ogerponwellspring`). Values are read through the same conversion, so `t=Ogerpon-Wellspring` also works.

## Keys

### The calculation

| Key | Value | Default |
|---|---|---|
| `v` | Schema version | `1` |
| `r` | Ruleset id. Only `gen9` in v5.0 | `gen9` |

### Each Pokémon

The target's keys start with `t`, yours with `y`. `t` and `y` on their own are the species.

| Key | Value | Range | Default |
|---|---|---|---|
| `t` | Species id | Any species in the ruleset's data | None |
| `t.base` | Base Speed, typed by hand. Only written when it differs from the species' own, or there is no species | 1 to 255 | The species' base Speed |
| `t.lv` | Level | 1 to 100 | 100 |
| `t.iv` | Speed IV | 0 to 31 | 31, or 0 under Trick Room |
| `t.ev` | Speed EVs. **Target only:** the solver picks yours | 0 to 252, in steps of 4 | 252, or 0 under Trick Room |
| `t.nat` | Nature: `plus`, `neutral` or `minus`. **Target only** | | `plus`, or `minus` under Trick Room |
| `t.stage` | Speed stage | −6 to +6 | 0 |
| `t.item` | Item id with a Speed effect (`choicescarf`, `ironball`, …) | The ruleset's items | None |
| `t.ability` | Ability id with a Speed effect (`swiftswim`, `unburden`, …) | The ruleset's abilities | None |
| `t.on` | `1`: the ability is switched on (Unburden, Protosynthesis, Quark Drive, Slow Start) | | Off |
| `t.status` | `par` (paralysed) or `other` (any other status, for Quick Feet) | | None |
| `t.tw` | `1`: Tailwind on this Pokémon's side | | Off |
| `t.swamp` | `1`: Swamp (Grass Pledge with Water Pledge) on this side | | Off |

The `y.` keys are the same, without `y.ev` and `y.nat`.

### The field

| Key | Value | Default |
|---|---|---|
| `weather` | `sun`, `rain`, `sand` or `snow` | None |
| `terrain` | `electric` | None |
| `tr` | `1`: Trick Room | Off |

### Defaults under Trick Room

Trick Room flips the defaults (#67): the target's worst case becomes its slowest spread (−Spe, 0 EVs, 0 IVs), and your IVs default to 0. A value you left at the default follows the flip; a value you set stays as you set it. So `?v=1&t=kingambit&tr=1` is a Kingambit with −Spe, 0 EVs and 0 IVs.

## Reading a link

Nothing in a URL is trusted. A link always loads, whatever it contains.

| Found | Done |
|---|---|
| A key not in the tables | Ignored |
| A key given twice | The first one is used |
| A number out of range | Clamped to the range (`t.ev=999` is 252, `t.lv=0` is 1) |
| EVs between steps | Rounded down to the step (`t.ev=250` is 248) |
| Something that is not a whole number | The default |
| An unknown species, item or ability, or an item in the ability slot | Left out |
| An unknown nature, status, weather or terrain | The default |
| A boolean that is not `1` or `true` | Off |
| `t.base` with no species | Kept: a custom Pokémon |
| `t.base` equal to the species' own | Dropped when the link is written again |
| An unknown version (`v=2` opened by an older build) | Read with the version 1 rules, as far as they go |

## Writing the URL

- **Typing replaces the current history entry,** so the back button doesn't step through every keystroke.
- **Other changes add an entry** when the screen asks for it (for example, picking a different Pokémon), so the back button can undo them.
- **Leaving for More, About or Privacy keeps the calculation** in those pages' URLs, so the logo, the back button and a reload all bring it back (#65: going to More changes nothing).

## Not in version 1

These are later additions, as new keys:

- Mode in the path (`/quick`, `/battle`) when Quick and Battle arrive.
- Formats, and rulesets other than Generation 9 (v5.1).
- Stat Points for Champions: a separate key, not a reinterpretation of `ev`.
- Your nature and EVs, if a mode ever needs them fixed rather than solved.
