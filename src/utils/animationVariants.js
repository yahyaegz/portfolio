export const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeDown = {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export const slideRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export const scaleUp = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const staggerContainer = (stagger = 0.1, delay = 0) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: stagger, delayChildren: delay },
    },
});
