import { speed, type AppliedModifier, type Field, type InactiveReason, type Weather } from '../../engine/index.ts';
import { baseOf } from '../calculation/derive.ts';
import { sideDefaults, type Calculation, type Side, type TargetSide } from '../calculation/state.ts';

export type Which = 'target' | 'you';

/** A change to one side. A key set to undefined removes that value (no item, no ability…). */
export type SideChange = { [K in keyof TargetSide]?: TargetSide[K] | undefined };

/** Change one side, keeping the rest of the calculation. */
export function editSide(calc: Calculation, which: Which, change: SideChange): Calculation {
  if (which === 'target') return { ...calc, target: withoutUndefined({ ...calc.target, ...change }) as TargetSide };
  return { ...calc, you: withoutUndefined({ ...calc.you, ...change }) as Side };
}

/** Drop keys whose value is undefined, as exactOptionalPropertyTypes expects. */
function withoutUndefined(value: object): object {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

/**
 * Swap the two Pokémon. The target's nature and EVs are its own, so the new
 * target starts from the worst-case defaults.
 */
export function swapSides(calc: Calculation): Calculation {
  const defaults = sideDefaults(calc.field.trickRoom);
  const oldTarget = Object.fromEntries(
    Object.entries(calc.target).filter(([key]) => key !== 'ev' && key !== 'nature'),
  ) as unknown as Side;
  return {
    ...calc,
    target: { ...calc.you, ev: defaults.target.ev, nature: defaults.target.nature },
    you: oldTarget,
  };
}

/**
 * Each modifier a side has, active or not and why, as the engine sees it.
 * Used for the chips: "needs rain", "switched off", linked to the weather.
 */
export function modifierStates(calc: Calculation, side: Side): AppliedModifier[] {
  const field: Field = { trickRoom: calc.field.trickRoom };
  if (calc.field.weather) field.weather = calc.field.weather;
  if (calc.field.terrain) field.terrain = calc.field.terrain;
  const input = {
    ruleset: calc.ruleset,
    // The states don't depend on the base Speed, so they show before one is typed.
    baseSpeed: baseOf(side) ?? 100,
    level: side.level,
    iv: side.iv,
    ev: 0,
    nature: 'neutral' as const,
    stage: side.stage,
    abilityOn: side.abilityOn,
    tailwind: side.tailwind,
    swamp: side.swamp,
    ...(side.item ? { item: side.item } : {}),
    ...(side.ability ? { ability: side.ability } : {}),
    ...(side.status ? { status: side.status } : {}),
    ...(side.species ? { species: side.species } : {}),
  };
  return speed(input, field).modifiers;
}

export const WEATHER_NAME: Record<Weather, string> = { rain: 'Rain', sun: 'Sun', sand: 'Sandstorm', snow: 'Snow' };
const WEATHER_NEED: Record<Weather, string> = { rain: 'rain', sun: 'sun', sand: 'sandstorm', snow: 'snow' };

/** Why an inactive modifier does nothing, as the chip says it. */
export function reasonText(reason: InactiveReason | undefined, needs: { weather?: Weather } = {}): string {
  switch (reason) {
    case 'needs-weather':
      return needs.weather ? `needs ${WEATHER_NEED[needs.weather]}` : 'needs weather';
    case 'needs-terrain':
      return 'needs Electric Terrain';
    case 'needs-status':
      return 'needs a status';
    case 'switched-off':
      return 'switched off';
    case 'wrong-species':
      return 'Ditto only';
    case 'item-removed':
      return 'removed by Unburden';
    case undefined:
      return '';
  }
}
