import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import useActiveSection from '../hooks/useActiveSection';

const SECTION_IDS = ['home', 'services', 'skills', 'code-canvas', 'projects', 'ai-lab', 'algo-observatory', 'resume-hub', 'dev-arcade', 'devops-control', 'certifications', 'contact'];

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
        { href: '#code-canvas', id: 'code-canvas', label: 'Code Canvas' },
        { href: '#projects', id: 'projects', label: t('nav.projects') },
        { href: '#ai-lab', id: 'ai-lab', label: t('nav.aiLab') },
        { href: '#algo-observatory', id: 'algo-observatory', label: 'Observatory' },
        { href: '#resume-hub', id: 'resume-hub', label: t('nav.resumeHub') },
        { href: '#dev-arcade', id: 'dev-arcade', label: t('nav.devArcade') },
        { href: '#devops-control', id: 'devops-control', label: 'DevOps' },
        { href: '#certifications', id: 'certifications', label: t('nav.certifications') },
        { href: '#contact', id: 'contact', label: t('nav.contact') },
    ];

    const isRTL = language === 'ar';

    return (
        <header
            className={`fixed z-50 transition-all duration-500 ${
                scrolled 
                    ? 'top-0 left-0 w-full lg:top-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-[98%] lg:max-w-[1600px] lg:rounded-full backdrop-blur-xl shadow-lg shadow-black/10' 
                    : 'top-0 left-0 w-full lg:top-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-[98%] lg:max-w-[1600px] lg:rounded-full backdrop-blur-md'
            }`}
            style={{ 
                backgroundColor: scrolled ? 'color-mix(in srgb, var(--bg-primary) 85%, transparent)' : 'color-mix(in srgb, var(--bg-primary) 40%, transparent)',
                borderColor: scrolled ? 'var(--border-color)' : 'transparent',
                borderWidth: scrolled ? '1px' : '0px'
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
            >
            <div className="mx-auto flex w-full items-center justify-between px-4 sm:px-6 py-3 lg:px-6 lg:py-4">
                <motion.a 
                    href="#home" 
                    className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-accent shrink-0" 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="bg-gradient-to-r from-accent to-cyan-500 bg-clip-text text-transparent">yahya</span>
                </motion.a>

                <div className="flex items-center gap-2 xl:hidden">
                    <ThemeToggle className="h-9 w-9 justify-center" />
                    <LanguageDropdown mobile langDropdown={langDropdown} setLangDropdown={setLangDropdown} langRef={langRef} />
                    <motion.button
                        ref={hamburgerRef}
                        className="grid h-9 w-9 place-items-center rounded-full border border-accent/30 bg-accent/5 text-accent text-lg hover:bg-accent/15 transition-colors"
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

                <nav className="hidden xl:block" role="navigation" aria-label="Main navigation">
                    <div className="flex items-center gap-0.5 xl:gap-1 2xl:gap-2">
                        {navItems.map(item => (
                            <motion.a
                                key={item.href}
                                href={item.href}
                                className={`relative rounded-full px-2.5 2xl:px-3 py-1.5 text-[13px] 2xl:text-sm font-semibold transition-colors ${
                                    activeSection === item.id
                                        ? 'text-accent'
                                        : 'text-secondary hover:text-primary'
                                }`}
                                aria-current={activeSection === item.id ? 'page' : undefined}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {activeSection === item.id && (
                                    <motion.span
                                        layoutId="active-nav-pill"
                                        className="absolute inset-0 rounded-full bg-accent/10 border border-accent/20"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{item.label}</span>
                            </motion.a>
                        ))}
                        <div className={`flex items-center gap-2 ${isRTL ? 'mr-2 pr-2 border-r' : 'ml-2 pl-2 border-l'}`} style={{ borderColor: 'var(--border-color)' }}>
                            <motion.a
                                href="/yahya_el_gzouli_cv_en.pdf"
                                download
                                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-emerald-400 px-3 py-1.5 text-[13px] font-bold text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all"
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label={t('hero.downloadCV')}
                            >
                                <i className="fa fa-download" />
                                <span>CV</span>
                            </motion.a>
                            <ThemeToggle showLabel={false} className="h-8 w-8 justify-center" />
                            <LanguageDropdown langDropdown={langDropdown} setLangDropdown={setLangDropdown} langRef={langRef} />
                        </div>
                    </div>
                </nav>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            className="fixed inset-0 top-[60px] lg:top-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden"
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
                    className={`fixed top-[60px] lg:top-0 z-50 h-[calc(100dvh-60px)] lg:h-[100dvh] w-72 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out xl:hidden ${
                        isRTL ? 'right-0 border-l' : 'left-0 border-r'
                    } ${open ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}`}
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                    <div className="flex flex-col gap-1 p-6 overflow-y-auto h-full">
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
                                className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                                    activeSection === item.id
                                        ? 'text-accent bg-accent/10 border border-accent/20 shadow-sm'
                                        : 'text-secondary hover:text-primary hover:bg-white/5'
                                }`}
                                aria-current={activeSection === item.id ? 'page' : undefined}
                                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                animate={open ? { opacity: 1, x: 0 } : {}}
                                transition={{ delay: i * 0.03 + 0.1 }}
                            >
                                {activeSection === item.id && <span className={`absolute ${isRTL ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-1/2 -translate-y-1/2 w-1 h-1/2 bg-accent`} />}
                                {item.label}
                            </motion.a>
                        ))}
                        <motion.div 
                            className="mt-6 pt-6 border-t"
                            style={{ borderColor: 'var(--border-color)' }}
                            initial={{ opacity: 0 }}
                            animate={open ? { opacity: 1 } : {}}
                            transition={{ delay: navItems.length * 0.03 + 0.2 }}
                        >
                            <a
                                href="/yahya_el_gzouli_cv_en.pdf"
                                download
                                onClick={() => setOpen(false)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-emerald-400 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all"
                            >
                                <i className="fa fa-download" />
                                {t('hero.downloadCV')}
                            </a>
                        </motion.div>
                    </div>
                </nav>
            </div>
        </header>
    );
}
