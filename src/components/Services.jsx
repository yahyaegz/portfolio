import React from 'react';
import { motion } from 'framer-motion';
import { services } from '../data';
import { useLanguage } from '../context/LanguageContext';
import { slideRight, staggerContainer } from '../utils/animationVariants';
import SplitTextReveal from './SplitTextReveal';
import TiltCard from './TiltCard';

const serviceKeys = ['fullstack', 'database', 'security', 'ml', 'analytics', 'neural'];

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Services() {
    const { t } = useLanguage();
    return (
        <section id="services" className="section-alt" aria-labelledby="services-heading">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
                <motion.div
                    className="text-center mb-8 md:mb-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={slideRight}
                >
                    <h2 id="services-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4"><SplitTextReveal>{t('services.title')}</SplitTextReveal> <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('services.titleSpan')}</SplitTextReveal></span></h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2 md:px-0">{t('services.subtitle')}</p>
                </motion.div>
                <motion.div
                    className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-3"
                    variants={staggerContainer(0.1)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {services.map((s, index) => (
                        <TiltCard
                            key={index}
                            className="group rounded-xl card-bg border p-8 shadow-lg transition-all duration-300 hover:shadow-2xl"
                        >
                            <motion.div
                                variants={cardVariants}
                                className="relative z-20"
                            >
                                <div className="mb-6 text-5xl text-accent group-hover:scale-110 transition-transform duration-300">
                                    <i className={`fa fa-${s.icon}`} />
                                </div>
                                <h3 className="mb-3 text-2xl font-semibold group-hover:text-accent transition">{t(`services.${serviceKeys[index]}`)}</h3>
                                <p className="text-secondary leading-relaxed">{t(`services.${serviceKeys[index]}Text`)}</p>
                            </motion.div>
                        </TiltCard>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}