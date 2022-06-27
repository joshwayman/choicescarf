import { useState, useContext } from "react"
import ChoiceScarfContext from "../../context/choicescarfContext";

export default function Form({children}) {
    const {  pokemonState : pokemon,  pokemonToBeatState : pokemonToBeat, setPokemon, setPokemonToBeat, returnResults } = useContext(ChoiceScarfContext);

    const [natureToBeat, setNatureToBeat ] = useState('neutral');
    const [nature, setNature ] = useState('neutral');
    const [showAdvanced, setShowAdvanced ] = useState(false);

    const handlePokemonChange = (e) => {
        const obj = {};
        obj[e.target.id] = Number(e.target.value);

        setPokemon(obj);     
    }

    const handleNatureChange = (e) => {
        const obj = {};
        obj.nature = e.target.value;

        setNature(e.target.value);
        setPokemon(obj);
    }

    const handlePokemonCheckboxChange = (e) => {
        const obj = {};
        obj[e.target.id] = e.target.checked;

        setPokemon(obj);     
    }

    const handlePokemonToBeatChange = (e) => {
        const obj = {};
        obj[e.target.id] = Number(e.target.value);

        setPokemonToBeat(obj);     
    }

    const handlePokemonToBeatCheckboxChange = (e) => {
        const obj = {};

        obj[e.target.id] = e.target.checked;

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
                            <label>Base Speed
                                <input type='number' id='baseSpeed' placeholder="100" value={pokemonToBeat.baseSpeed} onChange={handlePokemonToBeatChange} />
                            </label>
                            <label>IVs
                                <input id='iv' type='number' placeholder="31" value={pokemonToBeat.iv} onChange={handlePokemonToBeatChange} />
                            </label>
                            <label>EVs
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

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'} checkboxes`}>
                            <label>Choicescarf
                                <input type='checkbox' id='choicescarf' checked={pokemonToBeat.choicescarf} onChange={handlePokemonToBeatCheckboxChange} />
                            </label>
                            <label>Tailwind
                                <input type='checkbox' id='tailwind' checked={pokemonToBeat.tailwind} onChange={handlePokemonToBeatCheckboxChange} />
                            </label>
                            <label>Weather
                                <input type='checkbox' id='weather' checked={pokemonToBeat.weather} onChange={handlePokemonToBeatCheckboxChange} />
                            </label>
                        </div>

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'}`}>
                            <label className='narrow'>Level
                                <input type='number' id='lvl' placeholder="100" value={pokemonToBeat.lvl} onChange={handlePokemonToBeatChange} />
                            </label>
                            <label className='wide'>Boosts
                                <div>
                                    <input id='boosts' type='range' min='-6' max='6' placeholder="0" value={pokemonToBeat.boosts} onChange={handlePokemonToBeatChange} />
                                    <small>{pokemonToBeat.boosts}</small>
                                </div>
                            </label>
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

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'}`}>
                            <div className="radio-group-wrapper">
                                Nature
                                <div className="radio-group">
                                    <input type='radio' name="nature2" id="nature4" value='negative' onChange={handleNatureChange}  />
                                    <label htmlFor="nature4" >
                                        Negative
                                    </label>
                                    <input type='radio' name="nature2" id="nature5" value='neutral' defaultChecked onChange={handleNatureChange} />
                                    <label htmlFor="nature5">
                                        Neutral
                                    </label>
                                    <input type='radio' name="nature2" id="nature6" value='positive' onChange={handleNatureChange} />
                                    <label htmlFor="nature6">
                                        Positive
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'} checkboxes`}>
                            <label>Choicescarf
                                <input type='checkbox' id='choicescarf' checked={pokemon.choicescarf} onChange={handlePokemonCheckboxChange} />
                            </label>
                            <label>Tailwind
                                <input type='checkbox' id='tailwind' checked={pokemon.tailwind} onChange={handlePokemonCheckboxChange} />
                            </label>
                            <label>Weather
                                <input type='checkbox' id='weather' checked={pokemon.weather} onChange={handlePokemonCheckboxChange} />
                            </label>
                        </div>

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'}`}>
                            <label className='narrow'>Level
                                <input type='number' id='lvl' placeholder="100" value={pokemon.lvl} onChange={handlePokemonChange} />
                            </label>
                            <label className='wide'>Boosts
                                <div>
                                    <input id='boosts' type='range' min='-6' max='6' placeholder="0" value={pokemon.boosts} onChange={handlePokemonChange} />
                                    <small>{pokemon.boosts}</small>
                                </div>
                            </label>
                        </div>
                    </div>
                    <button onClick={returnResults}>Go</button>
                    <button onClick={() => { setShowAdvanced( showAdvanced ? false : true ) }} className='btn-subtle'>{showAdvanced ? 'Hide' : 'Show'} advanced</button>
                </div>
            </div>
        </section>
    )
}