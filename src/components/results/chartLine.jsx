import { ImgScarf } from './';
import { useCountUp } from '../../hooks/useCountUp';

export default function ChartLine( {label, evs, speed, choicescarf, speedToBeat} ) {
    const speedInc = useCountUp(speed);
    const evInc = useCountUp(evs);
    const lineId = `line_${speed}_${evs}`;

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
