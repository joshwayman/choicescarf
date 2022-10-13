import { useEffect, useState } from 'react';
import { useStickyState } from '../hooks/stickyState';

export function SideNotification( {title, text, link, messageId} ) {
    const [messageDismissed, setMessageDismissed] = useStickyState(false, messageId);
    const [notificationClass, setNotificationClass] = useState('');

    useEffect(() => {
        if(messageDismissed) return () => {};

        const openTO = setTimeout(() => { 
            setNotificationClass('opening')

            setTimeout(() => { 
                setNotificationClass('open');
            }, 150);
        }, 1000);

        return () => {
            clearTimeout(openTO);
        };
    }, [messageDismissed]);

    const dismissMessage = () => {

        setNotificationClass('closing');

        setTimeout(() => {
            setNotificationClass('');
        }, 250)

        setMessageDismissed(true);
    }

    return(
        <div className={`side-notification ${notificationClass}`}>
            <div className="inner">
                <h4>{title}</h4>
                <p>{text}</p>
                <div className="close" onClick={dismissMessage}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <g id="Group_511" data-name="Group 511" transform="translate(-910 -907)">
                            <circle id="Ellipse_10" data-name="Ellipse 10" cx="12" cy="12" r="12" transform="translate(910 907)" fill="var(--icon--accent)"></circle>
                            <g id="Group_510" data-name="Group 510" transform="translate(-286.623 822.944)">
                                <path id="Path_474" data-name="Path 474" d="M0,0H12.734" transform="translate(1204.121 91.554) rotate(45)" fill="none" stroke="var(--icon--color)" strokeWidth="1.5"></path>
                                <path id="Path_477" data-name="Path 477" d="M0,0H12.734" transform="translate(1213.125 91.554) rotate(135)" fill="none" stroke="var(--icon--color)" strokeWidth="1.5"></path>
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    )
}