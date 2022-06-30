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

function calculateBasicSpeed(pokemon) {
    const { ev = 252, iv = 31, lvl = 50, baseSpeed = 50, nature = 'neutral', boosts = 0, choicescarf = false, tailwind = false, weather = false } = pokemon;
    
    const natureModifer = returnNatureModifer(nature);
    const boostsModifer = returnBoostModifer(boosts);

    let speed = 0;

    /* Care of Bulbapedia */
    const evModifer = Math.floor(ev / 4);
    speed = Math.floor( ((((  (2 * baseSpeed) + iv + evModifer ) * lvl ) / 100 ) + 5 ) * natureModifer * boostsModifer);

        
    if(choicescarf === true) speed = returnScarfModifer(speed);
    if(tailwind === true) speed = returnTailwindModifer(speed);
    if(weather === true) speed = returnWeatherModifier(speed);
    
    return speed;
}
function returnNatureModifer( nature ){

    if(nature.toLowerCase() === 'neutral') return 1;
    if(nature.toLowerCase() === 'positive') return 1.1;
    if(nature.toLowerCase() === 'negative') return 0.9;

    return 1;
}
function returnBoostModifer( boost ) {
    switch ( boost ) {
        case -6:
            return 2/8; 
        case -5:
            return 2/7;
        case -4:
            return 2/6;
        case -3:
            return 2/5;
        case -2:
            return 2/4;
        case -1:
            return 2/3;
        case 0:
            return 2/2;
        case 1:
            return 3/2;
        case 2:
            return 4/2;
        case 3:
            return 5/2;
        case 4:
            return 6/2;
        case 5:
            return 7/2;
        case 6:
            return 8/2;
        default:
            return 0;
    }
}
function returnScarfModifer( speed ) {
    return Math.floor(speed * 1.5);
}
function returnTailwindModifer( speed ) {
    return Math.floor(speed * 2);
}
function returnWeatherModifier( speed ) {
    return Math.floor(speed * 2);
}
function bruteForceSpeedEVs( { iv, lvl, nature, baseSpeed, boosts, choicescarf, tailwind, weather }, speedToBeat = 0 ) {
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