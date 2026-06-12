import React from 'react';
import { motion } from 'framer-motion';
import { projects } from '../data';
import { useLanguage } from '../context/LanguageContext';
import { staggerContainer, scaleUp } from '../utils/animationVariants';
import SplitTextReveal from './SplitTextReveal';
import TiltCard from './TiltCard';

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const ProjectCard = ({ p, translatedItem }) => {
    const { t } = useLanguage();
    const title = translatedItem?.title || p.title;
    const description = translatedItem?.description || p.description;
    return (
        <TiltCard
            className="group rounded-xl overflow-hidden card-bg border shadow-lg transition-all hover:shadow-2xl"
        >
            <motion.div variants={itemVariants} className="relative z-20">
            <motion.div
                className="h-40 sm:h-44 md:h-48 bg-gradient-to-br from-accent/20 to-cyan-400/20 flex items-center justify-center relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
            >
                <motion.i
                    className={`${p.brand ? `fa-brands fa-${p.icon}` : `fa fa-${p.icon}`} text-6xl text-accent opacity-80 group-hover:opacity-100`}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/40 dark:from-black/60 to-transparent"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                />
            </motion.div>

            <div className="p-4 md:p-5 flex flex-col h-full">
                <h3 className="text-lg md:text-xl font-semibold mb-2 group-hover:text-accent transition">
                    {title}
                </h3>
                <p className="text-sm md:text-base text-secondary mb-3 flex-grow">{description}</p>

                <div className="mb-3">
                    <p className="text-xs text-muted mb-1 font-semibold">{t('projects.techStack')}</p>
                    <div className="flex flex-wrap gap-2">
                        {p.tech.map((tech) => (
                            <motion.span
                                key={tech}
                                className="inline-block rounded-full px-3 py-1 text-xs text-accent border border-accent/30"
                                style={{ backgroundColor: 'var(--bg-input)' }}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                            >
                                {tech}
                            </motion.span>
                        ))}
                    </div>
                </div>

                {p.link !== '#' && (
                    <motion.a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-accent hover:underline transition font-semibold group/link"
                        whileHover={{ x: 5 }}
                    >
                        {t('projects.viewProject')}{' '}
                        <motion.i
                            className="fa fa-arrow-right"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.a>
                )}
            </div>
        </motion.div>
        </TiltCard>
    );
};

export default function Projects() {
    const { t } = useLanguage();
    const translatedItems = t('projects.items');
    const realProjects = projects.filter(p => p.type === 'project');

    const getTranslation = (originalTitle) => {
        const idx = projects.findIndex(p => p.title === originalTitle);
        return translatedItems?.[idx] || null;
    };

    return (
        <section id="projects" className="section-alt" aria-labelledby="projects-heading">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
                <motion.div
                    className="text-center mb-8 md:mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={scaleUp}
                >
                    <h2 id="projects-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4"><SplitTextReveal>{t('projects.title')}</SplitTextReveal> <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('projects.titleSpan')}</SplitTextReveal></span></h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2">{t('projects.subtitle')}</p>
                </motion.div>

                <motion.div
                    className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-16"
                    variants={staggerContainer(0.15)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {realProjects.map((p) => (
                        <ProjectCard key={p.title} p={p} translatedItem={getTranslation(p.title)} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
