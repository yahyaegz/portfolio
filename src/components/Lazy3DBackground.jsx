import React, { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';

export default function Lazy3DBackground({ children, className = '' }) {
    const ref = useRef(null);
    // Use a negative margin to ensure the canvas ONLY mounts when it takes up a significant portion of the screen
    const isInView = useInView(ref, { margin: '-25% 0px -25% 0px' });
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Mount when in view, unmount when out of view to save WebGL contexts
        if (isInView) {
            setShouldRender(true);
        } else {
            setShouldRender(false);
        }
    }, [isInView]);

    return (
        <div ref={ref} className={`absolute inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}>
            {shouldRender && children}
        </div>
    );
}
