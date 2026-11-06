export function returnCompleteSpeed( pokemon = {}, pokemonToBeat = {} ) {
    // Destruction all of our variables.
    //const { iv = 31, lvl = 50, baseSpeed = 50, boosts = 0, choicescarf = false, tailwind = false, weather = false } = pokemon;
    
    //let ev = 0;
    const output = {};
    const initialChoicescarf = pokemon.choicescarf;

    const speedToBeat = calculateBasicSpeed(pokemonToBeat);
    //const rawSpeed = calculateBasicSpeed(pokemon);

    output.speedToBeat = speedToBeat;
    output.results = [];
    output.choicescarf = false;

    const natures = ['negative', 'neutral', 'positive'];

    let win = false;

    natures.map( nature => {
        pokemon.nature = nature;

        const calc = bruteForceSpeedEVs( pokemon, speedToBeat );

        const obj = { 
            label : nature,
            group: 'nature',
            choicescarf: false,
            ...calc,
            stats: { ...pokemon }
        };

        if(calc.win) win = true;   

        return output.results.push(obj);
    });

    if(win === true) return output;


    natures.map( nature => {
        pokemon.nature = nature;
        pokemon.choicescarf = true;

        const calc = bruteForceSpeedEVs( pokemon, speedToBeat );

        const obj = { 
            label : nature,
            group: 'nature',
            choicescarf: true,
            ...calc,
            stats: { ...pokemon }
        };

        if(calc.win) win = true;  

        return output.results.push(obj);
    });

    output.choicescarf = true;

    // Cases
    //const cases = ['choicescarf','tailwind', 'boosts'];

    console.log(output);

    
    pokemon.choicescarf = initialChoicescarf ? true : false;

    return output;
}

/*
 * Speed as the games (Gen 3+ stats, Gen 5+ battle modifiers) calculate it.
 * Every step uses integer maths and floors where the game does:
 *
 *   1. Stat:      floor((floor((2*Base + IV + floor(EV/4)) * Level / 100) + 5) * Nature)
 *   2. Stage:     floor(stat * (2+n)/2) for n >= 0, floor(stat * 2/(2-n)) for n < 0
 *   3. Modifiers: Scarf (x1.5), Tailwind (x2) and weather abilities (x2) are chained
 *                 into one 4096-based multiplier, then applied with round-half-down.
 *
 * This matches Pokemon Showdown's implementation.
 */
export function calculateBasicSpeed(pokemon) {
    const { ev = 252, iv = 31, lvl = 50, baseSpeed = 50, nature = 'neutral', boosts = 0, choicescarf = false, tailwind = false, weather = false } = pokemon;

    const rawStat = Math.floor(((2 * baseSpeed + iv + Math.floor(ev / 4)) * lvl) / 100) + 5;
    const stat = Math.floor((rawStat * returnNaturePercent(nature)) / 100);

    const boosted = applyBoostStage(stat, boosts);

    let modifier = 4096;
    if (choicescarf === true) modifier = chainModifier(modifier, 6144);
    if (tailwind === true) modifier = chainModifier(modifier, 8192);
    if (weather === true) modifier = chainModifier(modifier, 8192);

    return applyModifier(boosted, modifier);
}
function returnNaturePercent( nature = 'neutral' ){
    const n = String(nature).toLowerCase();

    if(n === 'positive') return 110;
    if(n === 'negative') return 90;

    return 100;
}
function applyBoostStage( stat, boost ) {
    const stage = Math.max(-6, Math.min(6, Math.trunc(Number(boost) || 0)));

    if (stage >= 0) return Math.floor((stat * (2 + stage)) / 2);
    return Math.floor((stat * 2) / (2 - stage));
}
function chainModifier( current, next ) {
    return (current * next + 2048) >> 12;
}
function applyModifier( value, modifier ) {
    // Round half down, as the games do for 4096-based modifiers.
    return Math.floor((value * modifier + 2047) / 4096);
}
export function bruteForceSpeedEVs( { iv, lvl, nature, baseSpeed, boosts, choicescarf, tailwind, weather }, speedToBeat = 0 ) {
    const pokemon = { iv, lvl, baseSpeed, boosts, choicescarf, tailwind, weather, nature};

    //console.warn('bruteForceSpeedEVs: ', speedToBeat);

    let calcdSpeed = 0;

    //console.log('Brute: ', pokemon);
    // return

    let ev = 0;
    //console.groupCollapsed('Brute forcing:');

    while (ev <= 252 ) {
        pokemon.ev = ev;

        calcdSpeed = calculateBasicSpeed(pokemon);

        //console.log('Brute: ev ', ev, calcdSpeed);

        if(calcdSpeed > speedToBeat) {
            //console.warn(calcdSpeed, speedToBeat, ev)
            return { ev, speed : calcdSpeed, win : true, speedToBeat };
        } 

        if( ev === 252) break;
        ev++;
    }
    //console.groupEnd();
    
    //console.log('Brute: after for ev ', ev);

    return { ev, speed : calcdSpeed, win : false, speedToBeat };
}


/* Testing 
const pokemon = {
    iv : 31, lvl : 50, baseSpeed : 98, nature : 'positive'
};
const pokemonToBeat = {
    iv : 31, lvl : 50, baseSpeed : 98, ev : 252, nature : 'neutral'
};

returnCompleteSpeed(pokemon, pokemonToBeat); */