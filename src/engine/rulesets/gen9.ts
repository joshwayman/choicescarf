import type { Ruleset } from '../types.ts';

/**
 * Generation 9 (Scarlet and Violet). Source for each entry: the modifier table
 * in docs/specs/rulesets.md, from Pokémon Showdown's data/items.ts,
 * data/abilities.ts and data/moves.ts.
 */
export const gen9: Ruleset = {
  id: 'gen9',
  name: 'Generation 9',
  investment: 'evs',
  level: { min: 1, max: 100, default: 100 },
  iv: { min: 0, max: 31, default: 31 },
  ev: { min: 0, max: 252, step: 4 },
  stage: { min: -6, max: 6 },
  paralysis: { numerator: 50, denominator: 100 },
  speedCap: 10000,
  weathers: ['sun', 'rain', 'sand', 'snow'],
  terrains: ['electric'],
  modifiers: [
    // Side conditions
    { id: 'tailwind', name: 'Tailwind', slot: 'side', multiplier: 8192 },
    { id: 'swamp', name: 'Swamp', slot: 'side', multiplier: 1024 },

    // Abilities
    { id: 'swiftswim', name: 'Swift Swim', slot: 'ability', multiplier: 8192, needs: { weather: 'rain' } },
    { id: 'chlorophyll', name: 'Chlorophyll', slot: 'ability', multiplier: 8192, needs: { weather: 'sun' } },
    { id: 'sandrush', name: 'Sand Rush', slot: 'ability', multiplier: 8192, needs: { weather: 'sand' } },
    { id: 'slushrush', name: 'Slush Rush', slot: 'ability', multiplier: 8192, needs: { weather: 'snow' } },
    {
      id: 'surgesurfer',
      name: 'Surge Surfer',
      slot: 'ability',
      multiplier: 8192,
      needs: { terrain: 'electric' },
    },
    {
      id: 'unburden',
      name: 'Unburden',
      slot: 'ability',
      multiplier: 8192,
      needs: { switchedOn: true },
      removesItem: true,
    },
    {
      id: 'quickfeet',
      name: 'Quick Feet',
      slot: 'ability',
      multiplier: 6144,
      needs: { status: true },
      ignoresParalysis: true,
    },
    {
      id: 'protosynthesis',
      name: 'Protosynthesis',
      slot: 'ability',
      multiplier: 6144,
      needs: { switchedOn: true },
    },
    { id: 'quarkdrive', name: 'Quark Drive', slot: 'ability', multiplier: 6144, needs: { switchedOn: true } },
    { id: 'slowstart', name: 'Slow Start', slot: 'ability', multiplier: 2048, needs: { switchedOn: true } },

    // Items
    { id: 'choicescarf', name: 'Choice Scarf', slot: 'item', multiplier: 6144 },
    { id: 'ironball', name: 'Iron Ball', slot: 'item', multiplier: 2048 },
    { id: 'machobrace', name: 'Macho Brace', slot: 'item', multiplier: 2048 },
    { id: 'poweranklet', name: 'Power Anklet', slot: 'item', multiplier: 2048 },
    { id: 'powerband', name: 'Power Band', slot: 'item', multiplier: 2048 },
    { id: 'powerbelt', name: 'Power Belt', slot: 'item', multiplier: 2048 },
    { id: 'powerbracer', name: 'Power Bracer', slot: 'item', multiplier: 2048 },
    { id: 'powerlens', name: 'Power Lens', slot: 'item', multiplier: 2048 },
    { id: 'powerweight', name: 'Power Weight', slot: 'item', multiplier: 2048 },
    { id: 'quickpowder', name: 'Quick Powder', slot: 'item', multiplier: 8192, only: 'ditto' },
  ],
};
