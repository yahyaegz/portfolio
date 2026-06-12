import React from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

export default function BackToTop() {
    const { scrollYProgress } = useScroll();
    const [show, setShow] = React.useState(false);

    useMotionValueEvent(scrollYProgress, 'change', (v) => setShow(v > 0.15));

    return (
        <AnimatePresence>
            {show && (
                <motion.button
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0, y: 20 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-accent text-black shadow-lg shadow-accent/30 flex items-center justify-center hover:shadow-accent/50 transition-shadow"
                    aria-label="Back to top"
                    data-magnetic
                >
                    <motion.i
                        className="fa fa-arrow-up text-lg"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.button>
            )}
        </AnimatePresence>
    );
}

