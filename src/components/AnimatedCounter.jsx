import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, motion } from 'framer-motion';

export default function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const motionVal = useMotionValue(0);
    const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
    const display = useRef(null);

    useEffect(() => {
        if (isInView) {
            motionVal.set(value);
        }
    }, [isInView, value, motionVal]);

    useEffect(() => {
        const unsub = spring.on('change', (v) => {
            if (display.current) {
                display.current.textContent = `${prefix}${Math.round(v)}${suffix}`;
            }
        });
        return unsub;
    }, [spring, prefix, suffix]);

    return (
        <motion.span
            ref={(el) => { ref.current = el; display.current = el; }}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
        >
            {prefix}0{suffix}
        </motion.span>
    );
}

