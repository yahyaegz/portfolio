import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testimonials } from '../data';
import { useLanguage } from '../context/LanguageContext';
import { fadeUp } from '../utils/animationVariants';
import AnimatedCounter from './AnimatedCounter';
import SplitTextReveal from './SplitTextReveal';

export default function CallToAction() {
    const { t } = useLanguage();
    const [current, setCurrent] = useState(0);
    const translatedTestimonials = t('testimonials.items');
    const items = testimonials.map((item, i) => ({
        ...item,
        quote: Array.isArray(translatedTestimonials) && translatedTestimonials[i]?.quote ? translatedTestimonials[i].quote : item.quote,
        author: Array.isArray(translatedTestimonials) && translatedTestimonials[i]?.author ? translatedTestimonials[i].author : item.author,
    }));
    const next = () => setCurrent((prev) => (prev + 1) % items.length);
    const prev = () => setCurrent((prev) => (prev - 1 + items.length) % items.length);

    return (
        <section className="section-alt relative overflow-hidden border-y py-16 md:py-20" style={{ borderColor: 'var(--border-color)' }}>
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                {/* CTA */}
                <motion.div
                    className="text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        {t('cta.title')} <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('cta.titleSpan')}</SplitTextReveal></span>
                    </h2>
                    <p className="text-lg text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
                        {t('cta.description')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <motion.a
                            href="#contact"
                            className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent px-8 py-3 font-semibold text-black hover:bg-transparent hover:text-accent transition"
                            data-magnetic
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('cta.getInTouch')}
                            <i className="fa fa-arrow-right" />
                        </motion.a>
                        <motion.a
                            href="https://github.com/yahyaegz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border-2 border-accent/50 px-8 py-3 font-semibold text-accent hover:border-accent hover:bg-accent/10 transition"
                            data-magnetic
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('cta.viewGithub')}
                            <i className="fa-brands fa-github" />
                        </motion.a>
                    </div>
                </motion.div>

                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="text-center">
                        <p className="text-3xl font-bold text-accent"><AnimatedCounter value={3} suffix="+" /></p>
                        <p className="text-muted text-sm">{t('cta.projectsDelivered')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-accent"><AnimatedCounter value={2} /></p>
                        <p className="text-muted text-sm">{t('cta.internships')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-accent"><AnimatedCounter value={30} suffix="+" /></p>
                        <p className="text-muted text-sm">{t('cta.skills')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-accent"><AnimatedCounter value={10} suffix="+" /></p>
                        <p className="text-muted text-sm">{t('cta.certifications')}</p>
                    </div>
                </motion.div>

                <motion.div
                    className="mt-16 pt-12 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <h3 className="text-xl sm:text-2xl font-bold text-center mb-8">
                        {t('testimonials.title')} <span className="text-accent">{t('testimonials.titleSpan')}</span>
                    </h3>

                    <div className="hidden lg:grid gap-6 grid-cols-3">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.author}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.15 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5 }}
                                className="rounded-xl card-bg border p-6 shadow-lg transition-all duration-300 hover:shadow-xl flex flex-col"
                            >
                                <div className="flex gap-1 mb-3">
                                    {Array.from({ length: item.stars }).map((_, i) => (
                                        <i key={i} className="fa fa-star text-accent text-sm" />
                                    ))}
                                </div>
                                <p className="text-sm italic text-secondary mb-4 flex-grow leading-relaxed">"{item.quote}"</p>
                                <div className="border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                                    <p className="font-semibold text-sm">— {item.author}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="lg:hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current}
                                initial={{ opacity: 0, x: 80 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -80 }}
                                transition={{ duration: 0.4 }}
                                className="rounded-xl card-bg border p-6 shadow-lg"
                            >
                                <div className="flex gap-1 mb-3">
                                    {Array.from({ length: items[current].stars }).map((_, i) => (
                                        <i key={i} className="fa fa-star text-accent text-sm" />
                                    ))}
                                </div>
                                <p className="text-sm italic text-secondary mb-4 leading-relaxed">"{items[current].quote}"</p>
                                <div className="border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                                    <p className="font-semibold text-sm">— {items[current].author}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                        <div className="flex justify-center items-center gap-4 mt-4">
                            <motion.button onClick={prev} whileTap={{ scale: 0.9 }} className="p-2 rounded-full border border-accent text-accent hover:bg-accent hover:text-black transition" aria-label="Previous testimonial">
                                <i className="fa fa-chevron-left" />
                            </motion.button>
                            <span className="text-muted text-sm">{current + 1} / {items.length}</span>
                            <motion.button onClick={next} whileTap={{ scale: 0.9 }} className="p-2 rounded-full border border-accent text-accent hover:bg-accent hover:text-black transition" aria-label="Next testimonial">
                                <i className="fa fa-chevron-right" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
