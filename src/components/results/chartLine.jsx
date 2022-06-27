import { useState, useEffect } from "react"

export default function ChartLine( {label, evs, speed, max, speedToBeat} ) {
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
                <div id={lineId} className='line' style={{ width : ( evInc / 252 * 100 )+'%', backgroundColor: 'orange'  }}> {evInc} EVs </div>
            </div>
            <div> {speedInc > speedToBeat ? '⭐' : '❌' } {speedInc}</div>
        </div>
    )
}