import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testimonials } from '../data';
import { useLanguage } from '../context/LanguageContext';

export default function Testimonials() {
    const [current, setCurrent] = useState(0);
    const { t } = useLanguage();

    const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
    const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    return (
        <section id="testimonials" className="section-dark">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
                <motion.div
                    className="text-center mb-8 md:mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">{t('testimonials.title')} <span className="text-accent">{t('testimonials.titleSpan')}</span></h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2 md:px-0">{t('testimonials.subtitle')}</p>
                </motion.div>

                <div className="hidden lg:block">
                    <motion.div
                        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        {testimonials.map((item, index) => (
                            <motion.div
                                key={item.author}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5 }}
                                className="rounded-xl card-bg border p-8 shadow-lg transition-all duration-300 hover:shadow-xl flex flex-col"
                            >
                                <motion.div className="flex gap-1 mb-4">
                                    {Array.from({ length: item.stars }).map((_, i) => (
                                        <motion.i
                                            key={i}
                                            className="fa fa-star text-accent text-lg"
                                            initial={{ scale: 0 }}
                                            whileInView={{ scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                        />
                                    ))}
                                </motion.div>
                                <p className="text-lg italic text-secondary mb-6 flex-grow leading-relaxed">"{item.quote}"</p>
                                <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                                    <p className="font-semibold">- {item.author}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                <div className="lg:hidden">
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.5 }}
                                className="rounded-xl card-bg border p-8 shadow-lg"
                            >
                                <motion.div className="flex gap-1 mb-4">
                                    {Array.from({ length: testimonials[current].stars }).map((_, i) => (
                                        <motion.i
                                            key={i}
                                            className="fa fa-star text-accent text-lg"
                                            animate={{ scale: [0, 1.2, 1] }}
                                            transition={{ delay: i * 0.1 }}
                                        />
                                    ))}
                                </motion.div>
                                <p className="text-lg italic text-secondary mb-6 leading-relaxed">"{testimonials[current].quote}"</p>
                                <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                                    <p className="font-semibold">- {testimonials[current].author}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-between items-center mt-6">
                            <motion.button
                                onClick={prev}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-full border border-accent text-accent hover:bg-accent hover:text-black transition"
                            >
                                <i className="fa fa-chevron-left" />
                            </motion.button>

                            <div className="flex gap-2">
                                {testimonials.map((_, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => setCurrent(index)}
                                        className={`h-2 rounded-full transition ${
                                            index === current ? 'w-8 bg-accent' : 'w-2 bg-slate-400 dark:bg-slate-600'
                                        }`}
                                        layoutId="indicator"
                                    />
                                ))}
                            </div>

                            <motion.button
                                onClick={next}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-full border border-accent text-accent hover:bg-accent hover:text-black transition"
                            >
                                <i className="fa fa-chevron-right" />
                            </motion.button>
                        </div>

                        <p className="text-center text-muted mt-4 text-sm">
                            {current + 1} / {testimonials.length}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}