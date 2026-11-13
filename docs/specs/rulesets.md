# Rulesets and the Speed maths

- **Status:** Generation 9 specified. Generations 3 to 8 and Champions are added before v5.1.
- **Issue:** #62 (part of the v5 roadmap, #59)
- **Checked against:** `@pkmn/sim` 0.11.0 (Pokémon Showdown's simulator) and `@smogon/calc` 0.12.0, on 13 November 2026

This is what the v5.0 engine has to implement, and the values its tests have to reproduce.

## The model

**A ruleset defines the mechanics. A format is a ruleset plus defaults.**

| Layer | Controls | Picked in | Ships in |
|---|---|---|---|
| Ruleset | Stat formula, rounding, which modifiers exist and what they multiply by | Calculator | v5.0 (Generation 9 only) |
| Format | A ruleset, plus level, legal Pokémon and default assumptions | Quick, Battle | v5.1 onward |

v5.0 has one ruleset and no formats. The types below still carry a ruleset id everywhere, so adding the others is new data, not new code paths.

## Types

```ts
type RulesetId = 'gen9'; // 'gen3' … 'gen8' and 'champions' join in v5.1

interface Ruleset {
  id: RulesetId;
  name: string;                       // "Generation 9"
  investment: 'evs' | 'statPoints';   // 'statPoints' is Champions
  level: { min: 1; max: 100; default: 100 };
  iv: { min: 0; max: 31; default: 31 };
  ev: { min: 0; max: 252; step: 4 };
  stage: { min: -6; max: 6 };
  paralysis: { numerator: 50; denominator: 100 }; // 25 before Generation 7
  speedCap: 10000;
  modifiers: Modifier[];
  weathers: Weather[];                // 'sun' | 'rain' | 'sand' | 'snow'
  terrains: Terrain[];                // 'electric'
}

interface Modifier {
  id: string;                         // 'choicescarf'
  name: string;                       // "Choice Scarf"
  slot: 'item' | 'ability' | 'side';  // one item and one ability per Pokémon
  multiplier: 1024 | 2048 | 6144 | 8192; // out of 4096: ×0.25, ×0.5, ×1.5, ×2
  needs?: {
    weather?: Weather;                // Swift Swim needs rain
    terrain?: Terrain;                // Surge Surfer needs Electric Terrain
    status?: true;                    // Quick Feet needs any status
    switchedOn?: true;                // the user says it is active (see below)
  };
  only?: string;                      // species id, for Quick Powder
  removesItem?: true;                 // Unburden: active means no item
}

interface SpeedInput {
  ruleset: RulesetId;
  baseSpeed: number;                  // 1 to 255
  level: number;
  iv: number;
  ev: number;
  nature: 'plus' | 'neutral' | 'minus';
  stage: number;
  item?: string;
  ability?: string;
  abilityOn?: boolean;
  status?: 'par' | 'other';
  tailwind?: boolean;
  swamp?: boolean;
}

interface Field {
  weather?: Weather;
  terrain?: Terrain;
  trickRoom?: boolean;
}
```

## The formula (Generation 9)

Every division below rounds down unless it says otherwise.

1. **Stat.** `floor((2 × base + IV + floor(EV / 4)) × level / 100) + 5`
2. **Nature.** `floor(stat × 110 / 100)` for a Speed-raising nature, `floor(stat × 90 / 100)` for a Speed-lowering one.
3. **Stage.** Multiply by `(2 + stage) / 2` for a positive stage, or `2 / (2 − stage)` for a negative one, then round down.
4. **Modifiers.** Combine every active modifier into one number out of 4096, then apply it once.
   - Combining: start at 4096. For each modifier, `(running × modifier + 2048) >> 12`.
   - Applying: `speed × combined / 4096`, **rounded half down** (499.5 becomes 499).
5. **Paralysis.** `floor(speed × 50 / 100)`, after everything else. Skipped with Quick Feet.
6. **Cap.** Speed cannot exceed 10000.

The order of step 4 and step 5 matters: paralysis is not part of the chain. Steps 1 to 4 are what v4 already does (#23).

### Why the chain matters

Flutter Mane with Protosynthesis, Choice Scarf and Tailwind is 405 before modifiers. Chained, the modifier is ×4.5 and the result is **1822**. Applied one at a time with rounding between each, it would be 1820. The games chain.

## Modifiers in Generation 9

| Modifier | Slot | Effect | Active when |
|---|---|---|---|
| Choice Scarf | Item | ×1.5 | Always |
| Iron Ball | Item | ×0.5 | Always |
| Macho Brace | Item | ×0.5 | Always |
| Power Anklet, Band, Belt, Bracer, Lens, Weight | Item | ×0.5 | Always |
| Quick Powder | Item | ×2 | Holder is an untransformed Ditto |
| Swift Swim | Ability | ×2 | Rain |
| Chlorophyll | Ability | ×2 | Sun |
| Sand Rush | Ability | ×2 | Sandstorm |
| Slush Rush | Ability | ×2 | Snow |
| Surge Surfer | Ability | ×2 | Electric Terrain |
| Unburden | Ability | ×2 | Switched on: the item has been used or lost. No item applies while it is on |
| Quick Feet | Ability | ×1.5 | Any status. Also cancels the paralysis drop |
| Protosynthesis | Ability | ×1.5 | Switched on: active (sun or Booster Energy) and Speed is the highest stat |
| Quark Drive | Ability | ×1.5 | Switched on: active (Electric Terrain or Booster Energy) and Speed is the highest stat |
| Slow Start | Ability | ×0.5 | Switched on: the first five turns |
| Tailwind | Side | ×2 | Set for that side |
| Swamp (Grass Pledge with Water Pledge) | Side | ×0.25 | Set for that side |
| Paralysis | Status | ×0.5, after the chain | Paralysed, without Quick Feet |
| Stat stages | Stage | −6 to +6 | Entered directly |

**"Switched on"** means the engine cannot tell from Speed alone, so the user says so. Protosynthesis and Quark Drive raise whichever stat is highest, and the calculator only knows Speed.

**Trick Room** changes the order, not the Speed. It is a field state: lower Speed moves first.

### Trick Room edge case

Showdown orders Pokémon in Trick Room by `(10000 − speed) mod 8192`. So a Pokémon with Speed of **1809 or more** moves *before* slower Pokémon in Trick Room. This is reachable only with large boosts (for example Regieleki at +6). The engine uses the same rule so that the order it reports is right.

### Ties

A tie is not a win. "Outspeeds" means strictly greater, and "underspeeds" means strictly less.

### Not in v5.0

These change who moves first without changing Speed, or switch other effects off. The user removes the affected modifier by hand.

- **Move-order effects:** Quick Claw, Custap Berry, Quick Draw, Lagging Tail, Full Incense, Stall, Mycelium Might, move priority.
- **Things that switch modifiers off:** Cloud Nine and Air Lock (weather), Utility Umbrella (the holder's Swift Swim and Chlorophyll), Neutralizing Gas, Klutz, Magic Room, Embargo.
- **Things that change stages:** Simple, Contrary, Speed Boost and similar. The user enters the resulting stage.

## The three engine functions

| Function | Question | Returns |
|---|---|---|
| `speed(input, field)` | What is this Pokémon's Speed? | A number, plus the steps for "Show calc" |
| `solveOutspeed(you, target, field)` | Fewest EVs to outspeed the target | For each nature: EVs and resulting Speed, or "cannot reach". If no nature can, the same again with a Choice Scarf |
| `solveUnderspeed(you, target, field)` | Most EVs that still underspeed the target (Trick Room) | For each nature: EVs and resulting Speed, or "too fast" |

- **EVs are searched in steps of 4,** from 0 to 252.
- **`solveUnderspeed` uses the IV you give it.** The Calculator suggests 0 IVs in Trick Room; the engine does not choose it.
- **The Scarf fallback is skipped** if you already hold an item.
- **Enumerating candidate sets** for Battle mode is a later function on the same `speed`.

## Test values

Worked from the formula by hand, then checked against `@smogon/calc`. All at level 100 with 31 IVs unless stated.

### Speed

| Case | Working | Speed |
|---|---|---|
| Garchomp (base 102), +Spe, 252 EVs | 2×102+31+63 = 298; +5 = 303; ×1.1 = 333.3 | **333** |
| The same at level 50 | 298×50/100 = 149; +5 = 154; ×1.1 = 169.4 | **169** |
| Garchomp at +1 | 333×3/2 = 499.5 | **499** |
| Garchomp at −1 | 333×2/3 = 222 | **222** |
| Garchomp at −1 with Choice Scarf | 222×1.5 | **333** |
| Dragapult (142), +Spe, 252 EVs | 378; 383; ×1.1 = 421.3 | **421** |
| Dragapult with Choice Scarf | 421×1.5 = 631.5, rounded half down | **631** |
| Dragapult with Choice Scarf, paralysed | floor(631×50/100) | **315** |
| Kingambit (50), −Spe, 0 EVs, 0 IVs | 100; 105; ×0.9 = 94.5 | **94** |
| Kingambit with Iron Ball | 94×0.5 | **47** |
| Barraskewda (136), neutral, 252 EVs | 272+31+63 = 366; +5 | **371** |
| Barraskewda, Swift Swim, no rain | Ability inactive | **371** |
| Barraskewda, Swift Swim, rain | 371×2 | **742** |
| Barraskewda, +Spe, Swift Swim, rain, Choice Scarf | 371×1.1 = 408; chain ×3 | **1224** |
| Gardevoir (80), +Spe, 252 EVs, paralysed | 254; 259; ×1.1 = 284.9 → 284; ×0.5 | **142** |
| Ursaluna (50), −Spe, 0 EVs, Quick Feet, burned | 131; 136; ×0.9 = 122.4 → 122; ×1.5 | **183** |
| Ursaluna, neutral, 252 EVs, Quick Feet, paralysed | 199; ×1.5 = 298.5, no paralysis drop | **298** |
| Flutter Mane (135), +Spe, 252 EVs, Protosynthesis on | 364; 369; ×1.1 = 405.9 → 405; ×1.5 = 607.5 | **607** |
| Flutter Mane, Protosynthesis, Choice Scarf, Tailwind | 405 × 4.5 = 1822.5 | **1822** |
| Regigigas (100), +Spe, 252 EVs, Slow Start on | 294; 299; ×1.1 = 328.9 → 328; ×0.5 | **164** |
| Hawlucha (118), +Spe, 252 EVs, Unburden on | 330; 335; ×1.1 = 368.5 → 368; ×2 | **736** |
| Great Tusk (87), +Spe, 252 EVs, level 50, Tailwind | 268×50/100 = 134; 139; ×1.1 = 152.9 → 152; ×2 | **304** |
| Regieleki (200), +Spe, 252 EVs, +6, Choice Scarf, Tailwind | 494; 499; ×1.1 = 548.9 → 548; ×4 = 2192; ×3 | **6576** |

### Solving

| Case | +Spe | Neutral | −Spe |
|---|---|---|---|
| Dragapult outspeeding 333 | 0 EVs (352) | 56 EVs (334) | 208 EVs (334) |
| Garchomp outspeeding 421 | Cannot reach | Cannot reach | Cannot reach |
| Garchomp outspeeding 421, Scarf fallback | 68 EVs (423) | 168 EVs (423) | Cannot reach |
| Garganacl (35), 0 IVs, underspeeding 94 | up to 40 EVs (93) | up to 72 EVs (93) | up to 116 EVs (93) |
| The same at level 99 | up to 44 EVs (93) | up to 76 EVs (93) | up to 124 EVs (93) |
| Gardevoir, 0 IVs, underspeeding 61 | Too fast | Too fast | Too fast |

## Checking against Showdown

- **`@smogon/calc` is the oracle.** Its `getFinalSpeed` function is not part of the package's public exports, but it can be imported from `@smogon/calc/dist/mechanics/util`. It is a development dependency for tests only and never ships to the browser.
- **A property test** compares the engine with it across random inputs. A reference implementation of the formula above matched it on 40,000 random Generation 9 cases covering every modifier in the table except Quick Powder and Swamp (one Power item stood in for all six).
- **What the calc does not cover:** Swamp, and the Trick Room ordering rule. Those rest on the simulator source (`data/moves.ts`, `sim/pokemon.ts`) and hand-worked tests.
- **Because the import is not public,** an update to `@smogon/calc` could move it. If that happens the property test fails loudly, and the hand-worked table above still stands.

## Sources

| Rule | Where in Pokémon Showdown |
|---|---|
| Stat and nature | `sim/battle.ts`, `statModify` |
| Stages, the 10000 cap | `sim/pokemon.ts`, `getStat` |
| Chaining and rounding | `sim/battle.ts`, `chainModify`, `modify`, `finalModify` |
| Paralysis after the chain, Quick Feet exemption | `data/conditions.ts`, `par` |
| Item multipliers | `data/items.ts` |
| Ability multipliers and conditions | `data/abilities.ts` |
| Tailwind, Swamp | `data/moves.ts`, `tailwind`, `grasspledge` |
| Trick Room order | `sim/pokemon.ts`, `getActionSpeed` |

## Still to specify (before v5.1)

- **Generations 3 to 8:** which modifiers exist in each, paralysis at ×0.25 before Generation 7, and how Generations 3 and 4 apply modifiers (not assumed to be the 4096 chain).
- **Champions:** Stat Points in place of EVs, and confirmation that modifiers match Generation 9.
- **Formats:** the typed definition, level, legality and VGC naming from #62.
