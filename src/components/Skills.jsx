import React from 'react';
import { motion } from 'framer-motion';
import { skills, topSkills, languages } from '../data';
import { useLanguage } from '../context/LanguageContext';
import { slideLeft } from '../utils/animationVariants';
import SplitTextReveal from './SplitTextReveal';

const categoryKeys = ['programming', 'frontend', 'backend', 'databases', 'tools', 'ml'];

export default function Skills() {
    const { t } = useLanguage();
    const translatedTopSkills = t('topSkills');
    const translatedLanguageCards = t('languageCards');
    return (
        <section id="skills" className="section-dark" aria-labelledby="skills-heading">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
                <motion.div
                    className="text-center mb-8 md:mb-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={slideLeft}
                >
                    <h2 id="skills-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4"><SplitTextReveal>{t('skills.title')}</SplitTextReveal> <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('skills.titleSpan')}</SplitTextReveal></span></h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-2">{t('skills.subtitle')}</p>
                </motion.div>

                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-2xl font-semibold text-center mb-8">{t('skills.coreCompetencies')}</h3>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-8">
                        {(Array.isArray(translatedTopSkills) ? translatedTopSkills : topSkills).map((skill, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.05 }}
                                className="rounded-lg bg-gradient-to-r from-accent/10 to-cyan-400/10 border border-accent/30 px-6 py-4 text-center hover:border-accent/60 transition"
                            >
                                <p className="font-semibold text-lg text-accent">{skill}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <div>
                    <h3 className="text-2xl font-semibold text-center mb-12">{t('skills.expertise')}</h3>
                    <div className="space-y-12">
                        {skills.map((category, catIndex) => (
                            <motion.div
                                key={category.category}
                                initial={{ opacity: 0, x: catIndex % 2 === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: catIndex * 0.05, duration: 0.5 }}
                                viewport={{ once: true }}
                            >
                                <h4 className="text-base sm:text-lg md:text-xl font-semibold text-accent mb-4 md:mb-6 flex items-center gap-3">
                                    <span className="h-1 w-8 bg-gradient-to-r from-accent to-cyan-400"></span>
                                    {t(`skills.${categoryKeys[catIndex]}`)}
                                    <span className="h-1 flex-grow bg-gradient-to-r from-cyan-400 to-transparent"></span>
                                </h4>
                                <div className="grid gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {category.items.map((skill, index) => (
                                        <motion.div
                                            key={skill.title}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            viewport={{ once: true }}
                                            whileHover={{ y: -5 }}
                                            className="group rounded-lg card-bg border p-4 shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-3"
                                        >
                                            <motion.div
                                                className="text-2xl text-accent group-hover:scale-125 transition-transform duration-300"
                                                animate={{ rotate: [0, 5, -5, 0] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                            >
                                                <i className={skill.brand ? `fa-brands fa-${skill.icon}` : `fa fa-${skill.icon}`} />
                                            </motion.div>
                                            <h5 className="text-sm font-semibold group-hover:text-accent transition">{skill.title}</h5>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    className="mt-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h3 className="text-2xl font-semibold text-accent mb-8 flex items-center gap-3">
                        <span className="h-1 w-8 bg-gradient-to-r from-accent to-cyan-400"></span>
                        {t('skills.languages')}
                        <span className="h-1 flex-grow bg-gradient-to-r from-cyan-400 to-transparent"></span>
                    </h3>
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {(Array.isArray(translatedLanguageCards) ? translatedLanguageCards : languages).map((lang, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5 }}
                                className="rounded-xl card-bg border p-5 shadow-lg transition-all duration-300 hover:shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-semibold text-accent">{lang.language}</h4>
                                    <i className="fa fa-globe text-xl text-accent opacity-30" />
                                </div>
                                <p className="text-secondary font-medium text-sm mb-3">{lang.level}</p>
                                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
                                    <motion.div
                                        className="bg-gradient-to-r from-accent to-cyan-400 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: ['Native', 'لغة أم', 'Natif', 'Nativo'].includes(lang.level) ? '100%' : ['Conversational', 'محادثة', 'Conversationnel', 'Conversacional'].includes(lang.level) ? '75%' : '50%' }}
                                        viewport={{ once: false }}
                                        transition={{ duration: 1, delay: index * 0.15 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}