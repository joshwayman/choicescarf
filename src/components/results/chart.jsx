
/*
import { Chart as RChart } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend);
*/
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
                return(<ChartLine label={item.label} evs={item.ev} speed={item.speed} speedToBeat={item.speedToBeat} max={280} key={key} />)
            })}
        </div>
    )
}


/*
const labels =  ['Negative', 'Neutral', 'Positive'];

const options = {
    indexAxis: "y",
    elements: {
      bar: {
        borderWidth: 2
      }
    },
    responsive: true,
    plugins: {
      legend: {
        position: "right"
      },
      title: {
        display: false,
        text: "Speed yo!"
      }
    }
  };

const datasets = [
    {
        data: [255, 196, 100],
        backgroundColor : ['red','blue','orange'],
        borderColor: ['pink', 'green','red'],
        borderWidth: 1
    }
]

const data = {
    labels,
    datasets
}

console.log(data);
*/