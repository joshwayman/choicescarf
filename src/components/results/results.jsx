import { useState, useContext, useEffect } from "react"
import Chart from "./chart";
import ChoiceScarfContext from "../../context/choicescarfContext";

export default function Results( { visible } ) {
    const { results } = useContext(ChoiceScarfContext);

    const [display, setDislay] = useState(false);
    const [displayDelay, setDislayDelay] = useState(false);

    useEffect(()=> {
        setTimeout(() => {
            setDislay(visible ? true : false);
        }, 500)
    }, [visible, setDislay]);

    return(
        <section className={`results-wrapper ${visible ? 'is-visible' : ''} ${display ? 'is-displayed' : ''}`}>
            <div className="results-inner">
                {results.speedToBeat ? <h2>Speed to beat is {results.speedToBeat}. {results.choicescarf ? <span>{'A ChoiceScarf is required to outspeed.'}</span> :''}</h2> : ''}
                <Chart display={display} /> 
            </div>
        </section>
    )
}