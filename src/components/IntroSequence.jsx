import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

function useTextScramble(text, trigger, duration = 1200) {
    const [display, setDisplay] = useState('');
    const frameRef = useRef(null);

    useEffect(() => {
        if (!trigger) return;
        const chars = text.split('');
        const settled = new Array(chars.length).fill(false);
        const startTime = performance.now();
        const perCharDelay = duration / chars.length;

        const animate = (now) => {
            const elapsed = now - startTime;
            const result = chars.map((char, i) => {
                if (char === ' ') return ' ';
                if (settled[i]) return char;
                if (elapsed > perCharDelay * i + perCharDelay * 0.8) {
                    settled[i] = true;
                    return char;
                }
                return CHARS[Math.floor(Math.random() * CHARS.length)];
            });
            setDisplay(result.join(''));
            if (!settled.every(Boolean)) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [trigger, text, duration]);

    return display;
}

export default function IntroSequence({ onComplete }) {
    const [phase, setPhase] = useState(0);
    const [show, setShow] = useState(() => {
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('intro-played')) return false;
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        return true;
    });
    const name = useTextScramble('Yahya El Gzouli', show, 1200);

    useEffect(() => {
        if (!show) {
            onComplete?.();
            return;
        }

        const t1 = setTimeout(() => setPhase(1), 1400);
        const t2 = setTimeout(() => setPhase(2), 2600);
        const t3 = setTimeout(() => {
            setShow(false);
            sessionStorage.setItem('intro-played', '1');
            onComplete?.();
        }, 3200);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [show, onComplete]);

    if (!show && phase === 0) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
                    style={{ backgroundColor: '#060b18' }}
                    exit={{
                        clipPath: 'circle(0% at 50% 50%)',
                        transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
                    }}
                    initial={{ clipPath: 'circle(150% at 50% 50%)' }}
                    animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
                    </div>

                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white relative z-10 tracking-tight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, letterSpacing: phase >= 1 ? '0.05em' : '0em' }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 font-mono">
                            {name}
                        </span>
                    </motion.h1>

                    <AnimatePresence>
                        {phase >= 1 && (
                            <motion.p
                                className="text-lg sm:text-xl md:text-2xl text-slate-400 mt-4 tracking-widest uppercase font-light relative z-10"
                                initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.5 }}
                            >
                                Full-Stack Software Engineer
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <motion.div
                        className="absolute bottom-[40%] left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
                        initial={{ width: 0 }}
                        animate={{ width: phase >= 1 ? 300 : 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}


