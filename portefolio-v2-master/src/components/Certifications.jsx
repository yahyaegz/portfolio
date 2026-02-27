import React from 'react';
import { motion } from 'framer-motion';
import { certifications } from '../data';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';

export default function Certifications() {
    const { t } = useLanguage();
    return (
        <section id="certifications" className="section-dark">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
                <motion.div
                    className="text-center mb-8 md:mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4"><SplitTextReveal>{t('certifications.title')}</SplitTextReveal> <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('certifications.titleSpan')}</SplitTextReveal></span></h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2 md:px-0">{t('certifications.subtitle')}</p>
                </motion.div>

                <div className="space-y-16">
                    {certifications.map((category, catIndex) => (
                        <motion.div
                            key={category.category}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIndex * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="text-2xl font-semibold text-accent mb-8 flex items-center gap-3">
                                <span className="h-1 w-8 bg-gradient-to-r from-accent to-cyan-400"></span>
                                {category.category}
                                <span className="h-1 flex-grow bg-gradient-to-r from-cyan-400 to-transparent"></span>
                            </h3>

                            <motion.div
                                className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.1,
                                        },
                                    },
                                }}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                            >
                                {category.items.map((cert) => (
                                    <motion.div
                                        key={cert.name}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                                        }}
                                        whileHover={{ y: -10 }}
                                        className="group rounded-xl card-bg border p-6 shadow-lg transition-all duration-300 hover:shadow-xl flex flex-col h-full"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold group-hover:text-accent transition leading-snug">{cert.name}</h4>
                                            </div>
                                            <motion.div
                                                className="text-3xl text-accent opacity-40 group-hover:opacity-100 transition flex-shrink-0 ml-3"
                                                animate={{ rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                            >
                                                <i className={cert.brand ? `fa-brands fa-${cert.icon}` : `fa fa-${cert.icon || 'certificate'}`} />
                                            </motion.div>
                                        </div>

                                        {cert.type && (
                                            <motion.span
                                                className="inline-block w-fit rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-4 hover:border-accent hover:bg-accent/20 transition"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                {cert.type}
                                            </motion.span>
                                        )}

                                        {(cert.issued || cert.credentialId) && (
                                            <div className="mb-4 space-y-1 border-t pt-3 text-xs text-secondary" style={{ borderColor: 'var(--border-color)' }}>
                                                {cert.issued && (
                                                    <p>
                                                        <span className="text-muted">{t('certifications.issued')}</span>{' '}
                                                        <span className="font-medium">{cert.issued}</span>
                                                    </p>
                                                )}
                                                {cert.credentialId && (
                                                    <p>
                                                        <span className="text-muted">{t('certifications.credentialId')}</span>{' '}
                                                        <span className="font-mono text-xs">{cert.credentialId}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {cert.skills && cert.skills.length > 0 && (
                                            <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                <p className="text-xs text-muted mb-2">{t('certifications.skills')}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {cert.skills.map((skill, idx) => (
                                                        <motion.span
                                                            key={skill}
                                                            className="inline-block rounded-full px-2 py-1 text-xs text-accent border border-accent/30 transition"
                                                            style={{ backgroundColor: 'var(--bg-input)' }}
                                                            initial={{ scale: 0 }}
                                                            whileInView={{ scale: 1 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            viewport={{ once: true }}
                                                            whileHover={{ scale: 1.1 }}
                                                        >
                                                            {skill}
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {cert.credentialUrl && cert.credentialUrl !== '#' && (
                                            <motion.a
                                                href={cert.credentialUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-accent hover:underline transition font-semibold mt-4 pt-4 border-t"
                                                style={{ borderColor: 'var(--border-color)' }}
                                                whileHover={{ x: 5 }}
                                            >
                                                {t('certifications.viewCredential')}{' '}
                                                <motion.i
                                                    className="fa fa-external-link-alt"
                                                    animate={{ rotate: [0, 10, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </motion.a>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}