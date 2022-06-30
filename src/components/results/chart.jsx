import { useContext } from "react"
import { ChartLine } from "./";
import ChoiceScarfContext from "../../context/choicescarfContext";

export default function Chart() {
    const { results : resultsObj } = useContext(ChoiceScarfContext);
    const { results } = resultsObj;

    if(!results) return (<></>);

    return(
        <div className="chart">
            <div className="chart-line"><div>Nature</div><div className="chart-header">EVs</div><div>Speed</div></div>
            {results.map( (item, key) => {
                return(
                    <ChartLine label={item.label} choicescarf={item.choicescarf} evs={item.ev} speed={item.speed} speedToBeat={item.speedToBeat} max={252} key={key} />
                  )
            })}
        </div>
    )
}