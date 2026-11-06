import { createContext, useState } from "react";
import { returnCompleteSpeed } from '../lib/speedCalc';

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

const ChoiceScarfContext = createContext({
    pokemonState : pokemonTemplate,
    pokemonToBeatState : { ...pokemonTemplate, ev : 252 },
    setPokemon : () => {},
    setPokemonToBeat : () => {},
    returnResults : () => {},
    results : {}
});

const ChoiceScarfContextProvider = ({ children }) => {
    const [ pokemonState, setPokemonState ] = useState({ ...pokemonTemplate });
    const [ pokemonToBeatState, setPokemonToBeatState ] = useState({ ...pokemonTemplate, ev : 252 });
    const [ results, setResults ] = useState({});

    const setPokemon = ( obj ) => {
        setPokemonState( (poke) => ({ ...poke, ...obj }) );
    }
    const setPokemonToBeat = ( obj ) => {
        setPokemonToBeatState( (poke) => ({ ...poke, ...obj }) );
    }

    const returnResults = () => {
        const results = returnCompleteSpeed(pokemonState, pokemonToBeatState);

        setResults(results);

        return results;
    }

    return (
        <ChoiceScarfContext.Provider value={{
            setPokemon, setPokemonToBeat, returnResults, pokemonState, pokemonToBeatState, results
        }}>
            {children}
        </ChoiceScarfContext.Provider>
    )
}

export default ChoiceScarfContext;
export { ChoiceScarfContextProvider };
