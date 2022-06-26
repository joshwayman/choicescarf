import { useState, useContext } from "react"
import ChoiceScarfContext from "../../context/choicescarfContext";

export default function Form({children}) {
    const {  pokemonState : pokemon,  pokemonToBeatState : pokemonToBeat, setPokemon, setPokemonToBeat, returnResults } = useContext(ChoiceScarfContext);

    const [natureToBeat, setNatureToBeat ] = useState('neutral');

    const handlePokemonChange = (e) => {
        const obj = {};
        obj[e.target.id] = Number(e.target.value);

        setPokemon(obj);     
    }

    const handlePokemonToBeatChange = (e) => {
        const obj = {};
        obj[e.target.id] = Number(e.target.value);

        setPokemonToBeat(obj);     
    }

    const handleNatureToBeatChange = (e) => {
        const obj = {};
        obj.nature = e.target.value;

        setNatureToBeat(e.target.value);
        setPokemonToBeat(obj);
    }

    return(
        <section className="form-wrapper">
            <div className='form-inner'>
                {children}
                <div className='form'>
                    <div className="pokemon">
                        <h2>Pokemon speed to beat</h2>
                        <div className="row">
                            <label>
                                Base Speed
                                <input type='number' id='baseSpeed' placeholder="100" value={pokemonToBeat.baseSpeed} onChange={handlePokemonToBeatChange} />
                            </label>
                            <label>
                                IVs
                                <input id='iv' type='number' placeholder="31" value={pokemonToBeat.iv} onChange={handlePokemonToBeatChange} />
                            </label>
                            <label>
                                EVs
                                <input id='ev' type='number' placeholder="252" value={pokemonToBeat.ev} onChange={handlePokemonToBeatChange} />
                            </label>
                        </div>

                        <div className="row">
                            <div className="radio-group-wrapper">
                                Nature
                                <div className="radio-group">
                                    <input type='radio' name="nature" id="nature1" value='negative' onChange={handleNatureToBeatChange}  />
                                    <label htmlFor="nature1" >
                                        Negative
                                    </label>
                                    <input type='radio' name="nature" id="nature2" value='neutral' defaultChecked onChange={handleNatureToBeatChange} />
                                    <label htmlFor="nature2">
                                        Neutral
                                    </label>
                                    <input type='radio' name="nature" id="nature3" value='positive' onChange={handleNatureToBeatChange} />
                                    <label htmlFor="nature3">
                                        Positive
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pokemon">
                        <h2>Your Pokemon</h2>
                        <div className="row">
                            <label>
                                Base Speed
                                <input type='number' placeholder='100' id='baseSpeed' onChange={handlePokemonChange} value={pokemon.baseSpeed} />
                            </label>
                            <label>
                                IVs
                                <input type='number' placeholder='31' id='iv' onChange={handlePokemonChange} value={pokemon.iv} />
                            </label>
                        </div>
                    </div>
                    <button onClick={returnResults}>Go</button>
                </div>
            </div>
        </section>
    )
}