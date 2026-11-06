// Valid ranges for the numeric inputs.
export const LIMITS = {
    baseSpeed: { min: 1, max: 255 },
    iv: { min: 0, max: 31 },
    ev: { min: 0, max: 252 },
    lvl: { min: 1, max: 100 },
    boosts: { min: -6, max: 6 },
};

export const DEFAULT_POKEMON = {
    ev: 0,
    iv: 31,
    lvl: 50,
    baseSpeed: 50,
    nature: 'neutral',
    boosts: 0,
    choicescarf: false,
    tailwind: false,
    weather: false,
};

/*
 * Clamp a field's value to its valid range as a whole number.
 * Empty or non-numeric values fall back to `fallback`.
 */
export function clampStat(field, value, fallback = DEFAULT_POKEMON[field]) {
    const limits = LIMITS[field];
    if (!limits) return value;

    const number = value === '' || value === null || value === undefined ? NaN : Number(value);
    if (!Number.isFinite(number)) return fallback;

    return Math.min(limits.max, Math.max(limits.min, Math.trunc(number)));
}

// Return a copy of `pokemon` with every numeric field clamped.
export function sanitizePokemon(pokemon, defaults = DEFAULT_POKEMON) {
    const clean = { ...pokemon };

    for (const field of Object.keys(LIMITS)) {
        clean[field] = clampStat(field, pokemon[field], defaults[field]);
    }

    return clean;
}
