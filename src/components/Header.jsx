import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import useActiveSection from '../hooks/useActiveSection';

const SECTION_IDS = ['home', 'services', 'skills', 'projects', 'education', 'experience', 'contact'];

function ThemeToggle({ showLabel = false, className = '' }) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    return (
        <motion.button
            className={`relative flex items-center gap-1.5 rounded-full border border-accent/60 text-accent hover:bg-accent/10 transition overflow-hidden ${className}`}
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
            whileTap={{ scale: 0.9 }}
            aria-label={theme === 'dark' ? t('header.themeLight') : t('header.themeDark')}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-1.5"
                >
                    {theme === 'dark' ? (
                        <>
                            <i className="fa fa-moon text-accent" />
                            {showLabel && <span className="text-xs font-semibold">{t('header.themeDark')}</span>}
                        </>
                    ) : (
                        <>
                            <i className="fa fa-sun text-amber-400" />
                            {showLabel && <span className="text-xs font-semibold">{t('header.themeLight')}</span>}
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}

function LanguageDropdown({ mobile = false, langDropdown, setLangDropdown, langRef }) {
    const { language, setLanguage, getLanguageCode, t } = useLanguage();
    return (
        <div className="relative" ref={langRef}>
            <motion.button
                className="flex items-center gap-1.5 rounded-full border border-accent/60 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10 transition"
                type="button"
                onClick={(e) => { e.stopPropagation(); setLangDropdown(o => !o); }}
                aria-label={t('header.changeLanguage')}
                aria-expanded={langDropdown}
                whileTap={{ scale: 0.9 }}
            >
                <i className="fa fa-globe" />
                <span>{getLanguageCode()}</span>
                <i className={`fa fa-chevron-down text-[10px] transition-transform ${langDropdown ? 'rotate-180' : ''}`} />
            </motion.button>
            <AnimatePresence>
                {langDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${mobile ? 'left-0' : 'right-0'} top-full mt-2 w-40 rounded-lg border shadow-xl overflow-hidden z-50`}
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                    >
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLanguage(lang.code);
                                    setLangDropdown(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-accent/10 ${
                                    language === lang.code ? 'text-accent font-semibold' : 'text-secondary'
                                }`}
                            >
                                <span className="text-base">{lang.flag}</span>
                                <span>{lang.label}</span>
                                {language === lang.code && <i className="fa fa-check text-accent text-xs ml-auto" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Header() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [langDropdown, setLangDropdown] = useState(false);
    const { language, t } = useLanguage();
    const navRef = useRef(null);
    const langRef = useRef(null);
    const hamburgerRef = useRef(null);
    const activeSection = useActiveSection(SECTION_IDS);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => { setOpen(false); setLangDropdown(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (hamburgerRef.current && hamburgerRef.current.contains(e.target)) return;
            if (navRef.current && !navRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('touchstart', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('touchstart', handleClick);
        };
    }, [open]);

    useEffect(() => {
        if (!langDropdown) return;
        const handleClick = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) setLangDropdown(false);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [langDropdown]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const navItems = [
        { href: '#home', id: 'home', label: t('nav.home') },
        { href: '#services', id: 'services', label: t('nav.services') },
        { href: '#skills', id: 'skills', label: t('nav.skills') },
        { href: '#projects', id: 'projects', label: t('nav.projects') },
        { href: '#education', id: 'education', label: t('nav.education') },
        { href: '#experience', id: 'experience', label: t('nav.experience') },
        { href: '#contact', id: 'contact', label: t('nav.contact') },
    ];

    const isRTL = language === 'ar';

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
                scrolled ? 'backdrop-blur-xl shadow-lg shadow-black/5' : ''
            }`}
            style={{ backgroundColor: scrolled ? 'color-mix(in srgb, var(--bg-primary) 90%, transparent)' : 'var(--bg-primary)' }}
            dir={isRTL ? 'rtl' : 'ltr'}
            role="banner"
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
                <motion.a href="#home" className="text-2xl font-extrabold text-accent shrink-0" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    yahya
                </motion.a>

                <div className="flex items-center gap-2 lg:hidden">
                    <ThemeToggle className="h-9 w-9 justify-center" />
                    <LanguageDropdown mobile langDropdown={langDropdown} setLangDropdown={setLangDropdown} langRef={langRef} />
                    <motion.button
                        ref={hamburgerRef}
                        className="grid h-9 w-9 place-items-center rounded-full border border-accent/60 text-accent text-lg hover:bg-accent/10 transition"
                        aria-label={t('header.toggleNavigation')}
                        aria-expanded={open}
                        onClick={() => { setOpen(prev => !prev); setLangDropdown(false); }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.i
                                key={open ? 'close' : 'open'}
                                className={`fa ${open ? 'fa-xmark' : 'fa-bars'}`}
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        </AnimatePresence>
                    </motion.button>
                </div>

                <nav className="hidden lg:block" role="navigation" aria-label="Main navigation">
                    <div className="flex items-center gap-1 xl:gap-2">
                        <LayoutGroup>
                        {navItems.map(item => (
                            <motion.a
                                key={item.href}
                                href={item.href}
                                className={`relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                                    activeSection === item.id
                                        ? 'text-accent'
                                        : 'text-secondary hover:text-accent hover:bg-accent/10'
                                }`}
                                aria-current={activeSection === item.id ? 'page' : undefined}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {item.label}
                                {activeSection === item.id && (
                                    <motion.span
                                        layoutId="activeNavIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-accent"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </motion.a>
                        ))}
                        </LayoutGroup>
                        <div className={isRTL ? 'flex items-center gap-2 mr-3 pr-3 border-r' : 'flex items-center gap-2 ml-3 pl-3 border-l'} style={{ borderColor: 'var(--border-color)' }}>
                            <motion.a
                                href="/resume.pdf"
                                download
                                className="flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent hover:text-black transition"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label={t('hero.downloadCV')}
                            >
                                <i className="fa fa-download" />
                                <span>CV</span>
                            </motion.a>
                            <ThemeToggle showLabel className="px-3 py-1 text-xs font-semibold" />
                            <LanguageDropdown langDropdown={langDropdown} setLangDropdown={setLangDropdown} langRef={langRef} />
                        </div>
                    </div>
                </nav>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            className="fixed inset-0 top-[57px] z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            onTouchEnd={() => setOpen(false)}
                        />
                    )}
                </AnimatePresence>

                <nav
                    ref={navRef}
                    role="navigation"
                    aria-label="Mobile navigation"
                    className={`fixed top-[57px] z-50 h-[calc(100dvh-57px)] w-64 backdrop-blur-md transition-transform duration-300 ease-in-out lg:hidden ${
                        isRTL ? 'right-0 border-l' : 'left-0 border-r'
                    } ${open ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}`}
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                    <div className="flex flex-col gap-1 p-4 overflow-y-auto h-full">
                        {navItems.map((item, i) => (
                            <motion.a
                                key={item.href}
                                href={item.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setOpen(false);
                                    setTimeout(() => {
                                        const el = document.querySelector(item.href);
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }, 150);
                                }}
                                className={`relative rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                                    activeSection === item.id
                                        ? 'text-accent bg-accent/10 border-l-2 border-accent'
                                        : 'text-secondary hover:text-accent hover:bg-accent/10'
                                }`}
                                aria-current={activeSection === item.id ? 'page' : undefined}
                                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                animate={open ? { opacity: 1, x: 0 } : {}}
                                transition={{ delay: i * 0.05 }}
                            >
                                {item.label}
                            </motion.a>
                        ))}
                        <motion.a
                            href="/resume.pdf"
                            download
                            onClick={() => setOpen(false)}
                            className="rounded-lg px-4 py-3 text-base font-medium text-accent flex items-center gap-2 hover:bg-accent/10 transition-colors"
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={open ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: navItems.length * 0.05 }}
                        >
                            <i className="fa fa-download" />
                            {t('hero.downloadCV')}
                        </motion.a>
                    </div>
                </nav>
            </div>
        </header>
    );
}