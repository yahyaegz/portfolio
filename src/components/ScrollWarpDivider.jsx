import React from 'react';
import { motion, useScroll, useVelocity, useTransform, useSpring } from 'framer-motion';

export default function ScrollWarpDivider({ flip = false }) {
    const { scrollY } = useScroll();
    const velocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(velocity, { stiffness: 60, damping: 20 });
    const warp = useTransform(smoothVelocity, [-3000, 0, 3000], [40, 0, 40]);
    const smoothWarp = useSpring(warp, { stiffness: 80, damping: 15 });

    return (
        <div
            className={`relative w-full overflow-hidden pointer-events-none select-none ${flip ? 'rotate-180' : ''}`}
            style={{ height: '80px', marginTop: '-1px', marginBottom: '-1px' }}
        >
            <motion.svg
                viewBox="0 0 1440 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={`warp-grad-${flip ? 'f' : 'n'}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                    </linearGradient>
                    <filter id={`warp-glow-${flip ? 'f' : 'n'}`}>
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <motion.path
                    d={`M0,40 C360,${80} 720,${0} 1080,${40} C1260,${60} 1440,${40} 1440,40 L1440,80 L0,80 Z`}
                    fill={`url(#warp-grad-${flip ? 'f' : 'n'})`}
                    filter={`url(#warp-glow-${flip ? 'f' : 'n'})`}
                    style={{
                        d: smoothWarp,
                    }}
                />
                <motion.path
                    d={`M0,40 C360,${80} 720,${0} 1080,${40} C1260,${60} 1440,${40}`}
                    stroke="url(#warp-grad-${flip ? 'f' : 'n'})"
                    strokeWidth="1.5"
                    fill="none"
                    strokeOpacity="0.6"
                />
            </motion.svg>
        </div>
    );
}
