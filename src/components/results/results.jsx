import { useState, useContext, useEffect } from "react"
import Chart from "./chart";
import ChoiceScarfContext from "../../context/choicescarfContext";

export default function Results( { visible } ) {
    const { results } = useContext(ChoiceScarfContext);

    const [display, setDislay] = useState(false);


    const [heightToggle, setHeightToggle] = useState(true);

    useEffect(()=> {
        setTimeout(() => {
            setDislay(visible ? true : false);
        }, 500)
    }, [visible, setDislay]);

    useEffect(() => {
        // TODO(#16): derive this instead of syncing state in an effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHeightToggle(true);
    }, [results])

    return(
        <section className={`results-wrapper ${visible ? 'is-visible' : ''} ${display ? 'is-displayed' : ''} ${heightToggle ? 'is-tall' : 'is-short'}`}>
            <div className="results-inner">
                <button onClick={() => { setHeightToggle(heightToggle ? false : true ) }} className='btn-side-up'>
                    {arrowDown}
                </button>
                {results.speedToBeat ? <h2>Speed to beat is {results.speedToBeat}. {results.choicescarf ? <span>{'A ChoiceScarf is required to outspeed.'}</span> :''}</h2> : ''}
                <Chart display={display} /> 
            </div>
        </section>
    )
}


const arrowDown = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
<path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
</svg>