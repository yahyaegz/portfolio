import React from 'react';
import { motion } from 'framer-motion';
import { profile, contactInfo } from '../data';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { t } = useLanguage();

    const navLinks = [
        { name: t('nav.home'), href: '#home' },
        { name: t('nav.skills'), href: '#skills' },
        { name: t('nav.projects'), href: '#projects' },
        { name: t('nav.experience'), href: '#experience' },
        { name: t('certifications.title') + ' ' + t('certifications.titleSpan'), href: '#certifications' },
        { name: t('nav.contact'), href: '#contact' },
    ];

    const socialLinks = [
        { icon: 'fa-linkedin-in', url: profile.social.linkedin, label: 'LinkedIn' },
        { icon: 'fa-github', url: profile.social.github, label: 'GitHub' },
        { icon: 'fa-x-twitter', url: profile.social.twitter, label: 'Twitter' },
        { icon: 'fa-instagram', url: profile.social.instagram, label: 'Instagram' },
    ];

    return (
        <footer className="section-dark border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
                <div className="grid gap-8 md:grid-cols-4 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <a href="#home" className="text-2xl font-extrabold text-accent mb-4 block hover:text-white transition">
                            yahya
                        </a>
                        <p className="text-secondary text-sm leading-relaxed">
                            {t('footer.description')}
                        </p>
                        <div className="mt-4 flex gap-3">
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.label}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="grid h-10 w-10 place-items-center rounded-full border text-secondary hover:bg-accent hover:text-black hover:border-accent transition"
                                    style={{ borderColor: 'var(--border-color)' }}
                                    aria-label={social.label}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <i className={`fa-brands ${social.icon}`} />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <h4 className="font-semibold mb-4 uppercase text-sm tracking-wider">{t('footer.navigation')}</h4>
                        <nav className="space-y-2">
                            {navLinks.map((link) => (
                                <motion.a
                                    key={link.href}
                                    href={link.href}
                                    className="block text-secondary hover:text-accent transition text-sm"
                                    whileHover={{ x: 5 }}
                                >
                                    {link.name}
                                </motion.a>
                            ))}
                        </nav>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <h4 className="font-semibold mb-4 uppercase text-sm tracking-wider">{t('footer.services')}</h4>
                        <ul className="space-y-2 text-sm text-secondary">
                            <li className="hover:text-accent transition">{t('footer.webDev')}</li>
                            <li className="hover:text-accent transition">{t('footer.fullstackSolutions')}</li>
                            <li className="hover:text-accent transition">{t('footer.mlDataScience')}</li>
                            <li className="hover:text-accent transition">{t('footer.apiDesign')}</li>
                            <li className="hover:text-accent transition">{t('footer.cloudDeployment')}</li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <h4 className="font-semibold mb-4 uppercase text-sm tracking-wider">{t('footer.contact')}</h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-muted text-xs">{t('footer.email')}</p>
                                <a href={`mailto:${contactInfo.email}`} className="text-secondary hover:text-accent transition">
                                    {contactInfo.email}
                                </a>
                            </div>
                            <div>
                                <p className="text-muted text-xs">{t('footer.phone')}</p>
                                <a href={`tel:${contactInfo.phone}`} className="text-secondary hover:text-accent transition">
                                    {contactInfo.phone}
                                </a>
                            </div>
                            <div>
                                <p className="text-muted text-xs">{t('footer.location')}</p>
                                <p className="text-secondary">{t('footer.morocco')}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <motion.p
                            className="text-secondary text-sm text-center md:text-left"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            © {currentYear} Yahya El Gzouli. {t('footer.copyright')}
                        </motion.p>
                        <motion.div
                            className="flex gap-4"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <a href="#" className="text-muted hover:text-accent transition text-xs">{t('footer.privacy')}</a>
                            <a href="#" className="text-muted hover:text-accent transition text-xs">{t('footer.terms')}</a>
                            <a href="#contact" className="text-muted hover:text-accent transition text-xs">{t('footer.sitemap')}</a>
                        </motion.div>
                    </div>
                </div>

                <motion.a
                    href="#home"
                    className="fixed bottom-8 right-8 grid h-12 w-12 place-items-center rounded-full bg-accent text-black shadow-lg hover:shadow-xl transition z-40"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <i className="fa fa-arrow-up" />
                </motion.a>
            </div>
        </footer>
    );
}
