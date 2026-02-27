import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    const [show, setShow] = useState(false);

    useEffect(() => {
        const unsub = scrollYProgress.on('change', (v) => setShow(v > 0.01));
        return unsub;
    }, [scrollYProgress]);

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left"
            style={{
                scaleX,
                background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 40%, #8b5cf6 70%, #10b981 100%)',
                backgroundSize: '200% 100%',
                opacity: show ? 1 : 0,
            }}
            animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
    );
}
