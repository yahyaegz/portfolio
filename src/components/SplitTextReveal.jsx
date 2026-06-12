import React from 'react';
import { motion } from 'framer-motion';

export default function SplitTextReveal({
    children,
    as: Tag = 'span',
    className = '',
    stagger = 0.04,
    once = true,
}) {
    const text = typeof children === 'string' ? children : '';
    if (!text) return <Tag className={className}>{children}</Tag>;

    const words = text.split(' ');

    const container = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: stagger,
            },
        },
    };

    const word = {
        hidden: {
            y: '100%',
            opacity: 0,
            filter: 'blur(6px)',
        },
        visible: {
            y: '0%',
            opacity: 1,
            filter: 'blur(0px)',
            transition: {
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
            },
        },
    };

    return (
        <motion.span
            className={`inline-flex flex-wrap ${className}`}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: '-60px' }}
            aria-label={text}
        >
            {words.map((w, i) => (
                <span key={i} className="overflow-hidden inline-block mr-[0.3em] last:mr-0">
                    <motion.span
                        className="inline-block"
                        variants={word}
                    >
                        {w}
                    </motion.span>
                </span>
            ))}
        </motion.span>
    );
}

