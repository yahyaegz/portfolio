import React from 'react';
import { motion } from 'framer-motion';
import { education } from '../data';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';

const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' },
    },
};

export default function Education() {
    const { t } = useLanguage();
    const translatedItems = t('education.items');
    const items = education.map((item, i) => ({
        ...item,
        period: translatedItems?.[i]?.period || item.period,
        text: translatedItems?.[i]?.text || item.text,
    }));

    return (
        <section id="education" className="section-dark">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-24">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                        <SplitTextReveal>{t('education.title')}</SplitTextReveal>{' '}
                        <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('education.titleSpan')}</SplitTextReveal></span>
                    </h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base">
                        {t('education.subtitle')}
                    </p>
                </motion.div>

                <motion.div
                    className="relative"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                >
                    <motion.div
                        className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{ originY: 0, background: 'linear-gradient(to bottom, #10b981, #06b6d4, transparent)' }}
                    />

                    {items.map((item, index) => {
                        const isLeft = index % 2 === 0;

                        return (
                            <motion.div
                                key={education[index].period}
                                variants={itemVariants}
                                className={`relative flex items-start mb-12 last:mb-0 md:mb-16 ${
                                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                                }`}
                            >
                                <motion.div
                                    className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: false }}
                                    transition={{ delay: 0.3 + index * 0.15, type: 'spring', stiffness: 300 }}
                                >
                                    <div className="relative">
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-accent/30"
                                            animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                                            transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.5 }}
                                        />
                                        <div className="relative h-12 w-12 rounded-full border-2 border-accent flex items-center justify-center shadow-lg shadow-accent/20" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                            <i className={`fa ${item.icon} text-accent text-lg`} />
                                        </div>
                                    </div>
                                </motion.div>

                                <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${
                                    isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                                }`}>
                                    <motion.div
                                        className="group relative rounded-xl card-bg border backdrop-blur p-6 shadow-lg hover:shadow-accent/10 transition-all duration-300"
                                        whileHover={{ y: -4 }}
                                    >
                                        <div className={`hidden md:block absolute top-5 w-3 h-3 rotate-45 ${
                                            isLeft
                                                ? 'right-0 translate-x-1.5 border-l-0 border-b-0'
                                                : 'left-0 -translate-x-1.5 border-r-0 border-t-0'
                                        }`} style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderWidth: '1px' }} />

                                        <motion.span
                                            className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-xs font-semibold text-accent mb-3"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <i className="fa fa-calendar-alt text-[10px]" />
                                            {item.period}
                                        </motion.span>

                                        <p className="text-secondary text-base md:text-lg font-medium leading-relaxed group-hover:text-accent transition-colors">
                                            {item.text}
                                        </p>

                                        <motion.div
                                            className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-accent/60 to-cyan-400/60"
                                            initial={{ scaleX: 0 }}
                                            whileInView={{ scaleX: 1 }}
                                            viewport={{ once: false }}
                                            transition={{ delay: 0.5 + index * 0.2, duration: 0.6 }}
                                            style={{ originX: isLeft ? 0 : 1 }}
                                        />
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}

                    <motion.div
                        className="absolute left-6 md:left-1/2 -translate-x-1/2 -bottom-2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1, type: 'spring' }}
                    >
                        <div className="h-4 w-4 rounded-full bg-accent/50 border-2 border-accent shadow-lg shadow-accent/30" />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}