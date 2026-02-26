import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { profile } from '../data';
import { useLanguage } from '../context/LanguageContext';

const ParticleGlobe = lazy(() => import('./ParticleGlobe'));

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: 'easeOut' } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
};

export default function Hero() {
    const { t } = useLanguage();
    return (
        <section id="home" className="section-dark w-full min-h-screen relative overflow-hidden flex items-center justify-center px-4 pt-20 pb-12 md:py-0">
            <div className="absolute inset-0 z-0 hero-mesh" aria-hidden="true" />

            <Suspense fallback={null}>
                <ParticleGlobe />
            </Suspense>

            <motion.div
                className="absolute -left-40 -top-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none z-0"
                animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute -right-40 -bottom-40 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none z-0"
                animate={{ x: [0, -30, 0], y: [0, -30, 0] }}
                transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            />

            <div className="w-full grid grid-cols-1 md:grid-cols-2 items-center justify-between gap-4 md:gap-8 px-2 md:px-16 max-w-7xl mx-auto relative z-10">
                <motion.div
                    className="space-y-6 order-2 md:order-1"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    <motion.div variants={itemVariants} className="space-y-2">
                        <motion.p
                            className="text-accent font-semibold text-base md:text-lg"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <span className="inline-block w-8 h-[2px] bg-accent mr-3 align-middle" />
                            {t('hero.welcome')}
                        </motion.p>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                            {t('hero.title')}{' '}
                            <motion.span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-cyan-400 to-accent"
                                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ backgroundSize: '200% 100%' }}
                            >
                                {profile.name}
                            </motion.span>
                        </h1>
                    </motion.div>

                    <motion.h3 variants={itemVariants} className="text-lg sm:text-xl md:text-3xl font-semibold text-secondary">
                        {t('hero.subtitle')}
                    </motion.h3>

                    <motion.p variants={itemVariants} className="text-xs sm:text-sm text-muted">
                        {t('hero.location')}
                    </motion.p>

                    <motion.p variants={itemVariants} className="text-sm sm:text-base md:text-lg text-secondary leading-relaxed max-w-xl">
                        {t('hero.summary')}
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex gap-4 pt-4 flex-wrap">
                        {[
                            { icon: 'linkedin', url: profile.social.linkedin, label: 'LinkedIn' },
                            { icon: 'github', url: profile.social.github, label: 'GitHub' },
                            { icon: 'x-twitter', url: profile.social.twitter, label: 'Twitter' },
                            { icon: 'instagram', url: profile.social.instagram, label: 'Instagram' },
                        ].map((social, idx) => (
                            <motion.a
                                key={idx}
                                className="grid h-12 w-12 place-items-center rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-black transition duration-300"
                                href={social.url}
                                aria-label={social.label}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-magnetic
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <i className={`fa-brands fa-${social.icon}`} />
                            </motion.a>
                        ))}
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex gap-4 pt-4 flex-wrap">
                        <motion.a
                            href="#contact"
                            className="inline-flex items-center gap-2 rounded-full border-2 border-accent px-8 py-3 font-semibold text-accent hover:bg-accent hover:text-black transition duration-300 group"
                            data-magnetic
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>{t('hero.cta')}</span>
                            <motion.i
                                className="fa fa-arrow-right"
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </motion.a>
                        <motion.a
                            href="/resume.pdf"
                            download
                            className="inline-flex items-center gap-2 rounded-full border-2 border-accent/50 px-8 py-3 font-semibold text-accent hover:border-accent hover:bg-accent/10 transition duration-300"
                            data-magnetic
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <i className="fa fa-download" />
                            <span>{t('hero.downloadCV')}</span>
                        </motion.a>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="flex justify-center items-center order-1 md:order-2"
                    variants={imageVariants}
                    initial="hidden"
                    whileInView="visible"
                    whileHover="hover"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    <div className="relative">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-accent to-cyan-400 rounded-full blur-3xl opacity-40 -z-10"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute -inset-4 rounded-full border border-dashed border-accent/20 z-0"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="absolute -inset-8 rounded-full border border-dashed border-cyan-400/10 z-0"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.img
                            className="relative z-10 w-56 sm:w-72 md:w-96 lg:w-[28rem] rounded-full shadow-2xl border-4 border-accent/30 hover:border-accent/60 transition object-cover"
                            src={profile.avatar}
                            alt={`${profile.name} — Full-Stack Software Engineer`}
                            loading="lazy"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}