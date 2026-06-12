import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function TiltCard({
    children,
    className = '',
    tiltMax = 8,
    glowColor = 'rgba(16, 185, 129, 0.10)',
    glowSize = 500,
    ...rest
}) {
    const ref = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const spotX = useMotionValue(50);
    const spotY = useMotionValue(50);

    const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
    const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

    const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

    const handleMove = (e) => {
        if (isTouch || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        rotateX.set((y - 0.5) * -tiltMax * 2);
        rotateY.set((x - 0.5) * tiltMax * 2);
        spotX.set(x * 100);
        spotY.set(y * 100);
    };

    const handleEnter = () => {
        if (!isTouch) setIsHovered(true);
    };

    const handleLeave = () => {
        setIsHovered(false);
        rotateX.set(0);
        rotateY.set(0);
    };

    return (
        <motion.div
            ref={ref}
            className={`relative ${className}`}
            onMouseMove={handleMove}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            style={{
                perspective: 800,
                transformStyle: 'preserve-3d',
                rotateX: springRotateX,
                rotateY: springRotateY,
            }}
            whileHover={isTouch ? {} : { y: -6, transition: { duration: 0.3 } }}
            {...rest}
        >
            {children}

            {isHovered && !isTouch && (
                <motion.div
                    className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
                    style={{
                        background: `radial-gradient(${glowSize}px circle at ${spotX.get()}% ${spotY.get()}%, ${glowColor}, transparent 40%)`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                />
            )}
        </motion.div>
    );
}
