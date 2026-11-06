import { createContext, useState } from "react";
import { returnCompleteSpeed } from '../lib/speedCalc';
import { DEFAULT_POKEMON, sanitizePokemon } from '../lib/validation';

const pokemonTemplate = DEFAULT_POKEMON;
const pokemonToBeatTemplate = { ...DEFAULT_POKEMON, ev : 252 };

const ChoiceScarfContext = createContext({
    pokemonState : pokemonTemplate,
    pokemonToBeatState : pokemonToBeatTemplate,
    setPokemon : () => {},
    setPokemonToBeat : () => {},
    returnResults : () => {},
    results : {}
});

const ChoiceScarfContextProvider = ({ children }) => {
    const [ pokemonState, setPokemonState ] = useState({ ...pokemonTemplate });
    const [ pokemonToBeatState, setPokemonToBeatState ] = useState(pokemonToBeatTemplate);
    const [ results, setResults ] = useState({});

    const setPokemon = ( obj ) => {
        setPokemonState( (poke) => ({ ...poke, ...obj }) );
    }
    const setPokemonToBeat = ( obj ) => {
        setPokemonToBeatState( (poke) => ({ ...poke, ...obj }) );
    }

    const returnResults = () => {
        // Clamp anything out of range and show the values actually used.
        const pokemon = sanitizePokemon(pokemonState, pokemonTemplate);
        const pokemonToBeat = sanitizePokemon(pokemonToBeatState, pokemonToBeatTemplate);
        setPokemonState(pokemon);
        setPokemonToBeatState(pokemonToBeat);

        const results = returnCompleteSpeed(pokemon, pokemonToBeat);

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
export { ChoiceScarfContextProvider, pokemonTemplate, pokemonToBeatTemplate };
