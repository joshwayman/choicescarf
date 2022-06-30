import { createContext, useState } from "react";
import { returnCompleteSpeed } from '../lib/speedCalc';

const ChoiceScarfContext = createContext({
    setPokemon: ( card ) => { console.log('do a thing!') },
    setPokemonToBeat : ( card ) => { console.log('do a thing!') },
    pokemon : {},
    pokemonToBeat : {},
    returnResults : ( ) => { console.log('do a thing!') },
    results : {}
})

const ChoiceScarfContextProvider = ({ children }) => {
    const pokemonTemplate = {
        ev : 0, 
        iv : 31, 
        lvl : 50, 
        baseSpeed : 50, 
        nature : 'neutral', 
        boosts : 0, 
        choicescarf : false, 
        tailwind : false, 
        weather : false
    };

    const [ pokemonState, setPokemonState ] = useState({ ...pokemonTemplate  } );
    const [ pokemonToBeatState, setPokemonToBeatState ] = useState({ ...pokemonTemplate, ev : 252 });
    const [ results, setResults ] = useState({});

    const setPokemon = ( obj ) => {
        setPokemonState( (poke) => {
            return {...poke, ...obj};
        });
    }
    const setPokemonToBeat = ( obj ) => {
        setPokemonToBeatState( (poke) => {
            return {...poke, ...obj};
        });
    }

    const pokemon = () => pokemonState;
    const pokemonToBeat = () => pokemonToBeatState;

    const returnResults = () => {
        /*console.log('RETURN: ', pokemonState, pokemonToBeatState);*/
        const results = returnCompleteSpeed(pokemonState, pokemonToBeatState);

        setResults(results);

        return results;
    }

    return (
        <ChoiceScarfContext.Provider value={{
            pokemon, pokemonToBeat, setPokemon, setPokemonToBeat, returnResults, pokemonState, pokemonToBeatState, results
        }}>
            {children}
        </ChoiceScarfContext.Provider>
    )
}

export default ChoiceScarfContext;
export { ChoiceScarfContextProvider };