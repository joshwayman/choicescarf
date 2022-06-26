import { useState, useContext } from "react"
import Chart from "./chart";
import ChoiceScarfContext from "../../context/choicescarfContext";

export default function Results() {
    const { results } = useContext(ChoiceScarfContext);

    return(
        <section className="results-wrapper">
            <div className="results-inner">
                <h1>Results</h1>
                {results.speedToBeat ? <p>Speed to beat is {results.speedToBeat}.</p> : ''}
                <Chart />
            </div>
        </section>
    )
}