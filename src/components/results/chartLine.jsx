import { useState, useEffect } from "react"
import { ImgScarf } from './';
//import { TransitionGroup, CSSTransition } from 'react-transition-group';

export default function ChartLine( {label, evs, speed, max, choicescarf, speedToBeat} ) {
    const [speedInc, setSpeedInc] = useState(0);
    const [evInc, setEvInc] = useState(0);
    const lineId = `line_${speed}_${evs}`;

    useEffect(() => {
        setTimeout(() => {
            if(speedInc === speed) return;
            if(speedInc < speed) setSpeedInc( speedInc + 1 );
            if(speedInc > speed) setSpeedInc( speedInc - 1 );
        }, 12)
    }, [speedInc, speed]);

    useEffect(() => {
        setTimeout(() => {
            if(evInc === evs) return;
            if(evInc < evs) setEvInc( evInc + 1 );
            if(evInc > evs) setEvInc( evInc - 1 );
        }, 4)
    }, [evInc, evs])

    return(
        <div className="chart-line">
            <div>{`${label[0].toUpperCase()}${label.slice(1)}`}</div>
            <div className='line-container'>
                <div id={lineId} className={`line ${choicescarf ? 'choiced' : ''} ${speed > speedToBeat ? 'win' : ( speed === speedToBeat ? 'tie' : 'lose') }`} style={{ '--after-width' : ( evInc / 252 * 100 )+'%'  }}> {choicescarf ? <ImgScarf />: ''}{evInc} EVs </div>
            </div>
            <div className='speed'> <span>{speed > speedToBeat ? '⭐' : ( speed === speedToBeat ? '🟰' : '❌') }</span> {speedInc}</div>
        </div>
    )
}