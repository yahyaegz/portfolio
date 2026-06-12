import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function MagneticCursor() {
    const [visible] = useState(() => {
        if (typeof window === 'undefined') return false;
        if (window.matchMedia('(pointer: coarse)').matches) return false;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        return true;
    });
    const [hovered, setHovered] = useState(false);
    const [clicked, setClicked] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const springX = useSpring(cursorX, { stiffness: 300, damping: 25 });
    const springY = useSpring(cursorY, { stiffness: 300, damping: 25 });

    useEffect(() => {
        if (!visible) return;

        const move = (e) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleEnter = () => setHovered(true);
        const handleLeave = () => setHovered(false);
        const handleDown = () => setClicked(true);
        const handleUp = () => setClicked(false);

        window.addEventListener('mousemove', move);
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);

        const observer = new MutationObserver(() => {
            document.querySelectorAll('[data-magnetic]').forEach((el) => {
                if (!el.dataset.magneticBound) {
                    el.dataset.magneticBound = 'true';
                    el.addEventListener('mouseenter', handleEnter);
                    el.addEventListener('mouseleave', handleLeave);
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        document.querySelectorAll('[data-magnetic]').forEach((el) => {
            el.dataset.magneticBound = 'true';
            el.addEventListener('mouseenter', handleEnter);
            el.addEventListener('mouseleave', handleLeave);
        });

        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
            observer.disconnect();
        };
    }, [cursorX, cursorY, visible]);

    if (!visible) return null;

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
                style={{
                    x: springX,
                    y: springY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
                animate={{
                    width: hovered ? 60 : clicked ? 20 : 36,
                    height: hovered ? 60 : clicked ? 20 : 36,
                    borderWidth: hovered ? 3 : 2,
                    opacity: 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <div
                    className="w-full h-full rounded-full border-emerald-400"
                    style={{
                        borderWidth: 'inherit',
                        borderStyle: 'solid',
                        borderColor: '#10b981',
                        transition: 'all 0.15s ease',
                    }}
                />
            </motion.div>
            <motion.div
                className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    backgroundColor: '#10b981',
                }}
                animate={{
                    width: hovered ? 8 : clicked ? 12 : 5,
                    height: hovered ? 8 : clicked ? 12 : 5,
                    opacity: hovered ? 0.8 : 0.6,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            />
        </>
    );
}

