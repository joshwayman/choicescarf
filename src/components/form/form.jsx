import { useState, useContext } from "react"
import ChoiceScarfContext, { pokemonTemplate, pokemonToBeatTemplate } from "../../context/choicescarfContext";
import { LIMITS, clampStat } from "../../lib/validation";

// Keep what is typed (including an empty box) while editing; clamp on blur and on Go.
const readNumber = (e) => e.target.value === '' ? '' : Number(e.target.value);

export default function Form({children, handleResultsVisibility, resultsVisible}) {
    const {  pokemonState : pokemon,  pokemonToBeatState : pokemonToBeat, setPokemon, setPokemonToBeat, returnResults } = useContext(ChoiceScarfContext);

    const [showAdvanced, setShowAdvanced ] = useState(false);

    const handlePokemonChange = (e) => {
        setPokemon({ [e.target.name]: readNumber(e) });
    }

    const handlePokemonBlur = (e) => {
        setPokemon({ [e.target.name]: clampStat(e.target.name, e.target.value, pokemonTemplate[e.target.name]) });
    }

    const handleNatureChange = (e) => {
        const obj = {};
        obj.nature = e.target.value;

        setPokemon(obj);
    }

    const handlePokemonCheckboxChange = (e) => {
        const obj = {};
        obj[e.target.name] = e.target.checked;

        setPokemon(obj);     
    }

    const handlePokemonToBeatChange = (e) => {
        setPokemonToBeat({ [e.target.name]: readNumber(e) });
    }

    const handlePokemonToBeatBlur = (e) => {
        setPokemonToBeat({ [e.target.name]: clampStat(e.target.name, e.target.value, pokemonToBeatTemplate[e.target.name]) });
    }

    const handlePokemonToBeatCheckboxChange = (e) => {
        const obj = {};

        obj[e.target.name] = e.target.checked;

        setPokemonToBeat(obj);     
    }

    const handleNatureToBeatChange = (e) => {
        const obj = {};
        obj.nature = e.target.value;

        setPokemonToBeat(obj);
    }

    const handleReturnResults = () => {
        handleResultsVisibility(true);
        returnResults();
    }

    return(
        <section className={`form-wrapper ${resultsVisible ? 'results-visible' : 'results-hidden'}`}>
            <div className='form-inner'>
                {children}
                <div className='form'>
                    <div className="pokemon">
                        <h2>Pokemon speed to beat</h2>
                        <div className="row">
                            <label>Base Speed
                                <input type='number' id='target-baseSpeed' name='baseSpeed' placeholder="100" value={pokemonToBeat.baseSpeed} onChange={handlePokemonToBeatChange} min={LIMITS.baseSpeed.min} max={LIMITS.baseSpeed.max} onBlur={handlePokemonToBeatBlur} />
                            </label>
                            <label>IVs
                                <input id='target-iv' name='iv' type='number' placeholder="31" value={pokemonToBeat.iv} onChange={handlePokemonToBeatChange} min={LIMITS.iv.min} max={LIMITS.iv.max} onBlur={handlePokemonToBeatBlur} />
                            </label>
                            <label>EVs
                                <input id='target-ev' name='ev' type='number' placeholder="252" value={pokemonToBeat.ev} onChange={handlePokemonToBeatChange} min={LIMITS.ev.min} max={LIMITS.ev.max} onBlur={handlePokemonToBeatBlur} />
                            </label>
                        </div>
                        <div className="row">
                            <div className="radio-group-wrapper">
                                <span id="target-nature-label">Nature</span>
                                <div className="radio-group" role="radiogroup" aria-labelledby="target-nature-label">
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
                                <input type='checkbox' id='target-choicescarf' name='choicescarf' checked={pokemonToBeat.choicescarf} onChange={handlePokemonToBeatCheckboxChange} />
                            </label>
                            <label>Tailwind
                                <input type='checkbox' id='target-tailwind' name='tailwind' checked={pokemonToBeat.tailwind} onChange={handlePokemonToBeatCheckboxChange} />
                            </label>
                            <label>Weather
                                <input type='checkbox' id='target-weather' name='weather' checked={pokemonToBeat.weather} onChange={handlePokemonToBeatCheckboxChange} />
                            </label>
                        </div>

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'}`}>
                            <label className='narrow'>Level
                                <input type='number' id='target-lvl' name='lvl' placeholder="100" value={pokemonToBeat.lvl} onChange={handlePokemonToBeatChange} min={LIMITS.lvl.min} max={LIMITS.lvl.max} onBlur={handlePokemonToBeatBlur} />
                            </label>
                            <label className='wide'>Boosts
                                <div>
                                    <input id='target-boosts' name='boosts' type='range' min='-6' max='6' placeholder="0" value={pokemonToBeat.boosts} onChange={handlePokemonToBeatChange} />
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
                                <input type='number' placeholder='100' id='yours-baseSpeed' name='baseSpeed' onChange={handlePokemonChange} value={pokemon.baseSpeed} min={LIMITS.baseSpeed.min} max={LIMITS.baseSpeed.max} onBlur={handlePokemonBlur} />
                            </label>
                            <label>
                                IVs
                                <input type='number' placeholder='31' id='yours-iv' name='iv' onChange={handlePokemonChange} value={pokemon.iv} min={LIMITS.iv.min} max={LIMITS.iv.max} onBlur={handlePokemonBlur} />
                            </label>
                        </div>

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'}`}>
                            <div className="radio-group-wrapper">
                                <span id="yours-nature-label">Nature</span>
                                <div className="radio-group" role="radiogroup" aria-labelledby="yours-nature-label">
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
                                <input type='checkbox' id='yours-choicescarf' name='choicescarf' checked={pokemon.choicescarf} onChange={handlePokemonCheckboxChange} />
                            </label>
                            <label>Tailwind
                                <input type='checkbox' id='yours-tailwind' name='tailwind' checked={pokemon.tailwind} onChange={handlePokemonCheckboxChange} />
                            </label>
                            <label>Weather
                                <input type='checkbox' id='yours-weather' name='weather' checked={pokemon.weather} onChange={handlePokemonCheckboxChange} />
                            </label>
                        </div>

                        <div className={`row advanced ${showAdvanced ? 'show': 'hidden'}`}>
                            <label className='narrow'>Level
                                <input type='number' id='yours-lvl' name='lvl' placeholder="100" value={pokemon.lvl} onChange={handlePokemonChange} min={LIMITS.lvl.min} max={LIMITS.lvl.max} onBlur={handlePokemonBlur} />
                            </label>
                            <label className='wide'>Boosts
                                <div>
                                    <input id='yours-boosts' name='boosts' type='range' min='-6' max='6' placeholder="0" value={pokemon.boosts} onChange={handlePokemonChange} />
                                    <small>{pokemon.boosts}</small>
                                </div>
                            </label>
                        </div>
                    </div>
                    <button type='button' onClick={handleReturnResults}>Go</button>
                    <button type='button' onClick={() => setShowAdvanced(!showAdvanced)} className='btn-subtle' aria-expanded={showAdvanced}>{showAdvanced ? 'Hide' : 'Show'} advanced</button>
                </div>
            </div>
        </section>
    )
}