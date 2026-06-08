import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { experience, education, skills, contactInfo } from '../data';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';

const getCategoryItems = (category) => {
    if (category.groups?.length) {
        return category.groups.flatMap(group =>
            group.items.map(item => ({ ...item, group: group.label }))
        );
    }

    return category.items;
};

export default function InteractiveCV() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('timeline');
    const [timelineFilter, setTimelineFilter] = useState('all');
    const [skillSearch, setSkillSearch] = useState('');

    const isRtl = language === 'ar';

    // 1. Unified Timeline Merging experience & education
    const unifiedTimeline = [
        ...experience.map((item, idx) => {
            // Translate experience properties based on current language context
            const translatedItems = t('experience.items');
            const translated = translatedItems?.[idx] || {};
            return {
                type: 'experience',
                dateSort: item.period.split('–')[0].trim().replace(/\D/g, ''),
                period: item.period,
                company: item.company,
                role: translated.role || item.role,
                location: translated.location || item.location,
                summary: translated.summary || item.summary,
                highlights: translated.highlights || item.highlights,
                link: item.link
            };
        }),
        ...education.map((item, idx) => {
            const translatedItems = t('education.items');
            const translated = translatedItems?.[idx] || {};
            return {
                type: 'education',
                dateSort: item.period.split('–')[0].trim().replace(/\D/g, ''),
                period: translated.period || item.period,
                company: (translated.text || item.text).split('—')[0].trim(),
                role: (translated.text || item.text).split('—')[1]?.trim() || (translated.text || item.text),
                location: 'Oujda, Morocco',
                summary: '',
                highlights: [],
                link: '#'
            };
        })
    ].sort((a, b) => {
        // Sort descending: current first
        const yearA = parseInt(a.period.includes('Present') || a.period.includes('الآن') || a.period.includes('Présent') ? 2026 : a.dateSort) || 0;
        const yearB = parseInt(b.period.includes('Present') || b.period.includes('الآن') || b.period.includes('Présent') ? 2026 : b.dateSort) || 0;
        return yearB - yearA;
    });

    const filteredTimeline = unifiedTimeline.filter(item => {
        if (timelineFilter === 'all') return true;
        return item.type === timelineFilter;
    });

    return (
        <section id="resume-hub" className="section-alt" aria-labelledby="cv-heading">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
                
                {/* Header Title */}
                <motion.div
                    className="text-center mb-8 md:mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 id="cv-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">
                        <span className="text-accent accent-glow-text">
                            <SplitTextReveal>{t('cvTimeline.title')}</SplitTextReveal>
                        </span>{' '}
                        <SplitTextReveal stagger={0.06}>{t('cvTimeline.titleSpan')}</SplitTextReveal>
                    </h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2">
                        {t('cvTimeline.subtitle')}
                    </p>
                </motion.div>

                {/* Navigation Dashboard Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="flex border rounded-full p-1 bg-slate-900/60" style={{ borderColor: 'var(--border-color)' }}>
                        {[
                            { id: 'timeline', label: t('cvTimeline.tabTimeline'), icon: 'fa-timeline' },
                            { id: 'skills', label: t('cvTimeline.tabSkills'), icon: 'fa-cubes' },
                            { id: 'ats', label: t('cvTimeline.tabAts'), icon: 'fa-id-card' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? 'bg-accent text-black font-bold shadow-lg'
                                        : 'text-secondary hover:text-primary'
                                }`}
                            >
                                <i className={`fa-solid ${tab.icon}`} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ACTIVE VIEWPORT CONTAINER */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        
                        {/* VIEW 1: CAREER TIMELINE */}
                        {activeTab === 'timeline' && (
                            <motion.div
                                key="timeline"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6 max-w-3xl mx-auto"
                            >
                                {/* Filter Selector Row */}
                                <div className="flex justify-center gap-2 mb-6">
                                    {[
                                        { id: 'all', label: t('cvTimeline.filterAll') },
                                        { id: 'experience', label: t('cvTimeline.filterExp') },
                                        { id: 'education', label: t('cvTimeline.filterEdu') }
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setTimelineFilter(filter.id)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                                                timelineFilter === filter.id
                                                    ? 'bg-accent/15 border-accent text-accent'
                                                    : 'border-slate-800 bg-slate-900/40 text-secondary hover:text-primary hover:border-slate-700'
                                            }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Vertical Timeline Line layout */}
                                <div className="relative border-l-2 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-8" style={{ borderColor: 'var(--border-color)' }}>
                                    
                                    {filteredTimeline.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, margin: '-40px' }}
                                            className="relative"
                                        >
                                            {/* Left Icon Dot on line */}
                                            <span 
                                                className={`absolute -left-[35px] sm:-left-[51px] top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] z-10 bg-slate-950 ${
                                                    item.type === 'experience' ? 'border-accent text-accent' : 'border-cyan-400 text-cyan-400'
                                                }`}
                                            >
                                                <i className={`fa ${item.type === 'experience' ? 'fa-briefcase' : 'fa-graduation-cap'}`} />
                                            </span>

                                            {/* Detail Card Container */}
                                            <div className="card-bg border rounded-2xl p-5 space-y-3 relative">
                                                
                                                {/* Header row */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                                    <div>
                                                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase mb-1.5 ${
                                                            item.type === 'experience' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                        }`}>
                                                            {item.period}
                                                        </span>
                                                        <h3 className="text-base sm:text-lg font-bold text-primary">
                                                            {item.role}
                                                        </h3>
                                                    </div>
                                                    
                                                    <div className="text-left sm:text-right flex-shrink-0">
                                                        <p className="font-bold text-accent text-sm sm:text-base">
                                                            {item.company}
                                                        </p>
                                                        <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                                                            {item.location}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Summary Bio */}
                                                {item.summary && (
                                                    <p className="text-xs sm:text-sm text-secondary leading-relaxed border-t pt-2" style={{ borderColor: 'var(--border-color)' }}>
                                                        {item.summary}
                                                    </p>
                                                )}

                                                {/* Highlights bullets list */}
                                                {item.highlights && item.highlights.length > 0 && (
                                                    <ul className="space-y-1.5 text-xs text-secondary pl-4 list-disc marker:text-accent">
                                                        {item.highlights.map((bullet, bIdx) => (
                                                            <li key={bIdx} className="leading-normal">{bullet}</li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {/* Actions */}
                                                {item.link && item.link !== '#' && (
                                                    <div className="border-t pt-3 flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
                                                        <motion.a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-accent hover:underline"
                                                            whileHover={{ x: 3 }}
                                                        >
                                                            <span>{t('experience.visitCompany')}</span>
                                                            <i className="fa-solid fa-chevron-right text-[8px]" />
                                                        </motion.a>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW 2: INTERACTIVE SKILLS TAXONOMY */}
                        {activeTab === 'skills' && (
                            <motion.div
                                key="skills"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                {/* Search input widget */}
                                <div className="max-w-md mx-auto relative mb-6">
                                    <input
                                        type="text"
                                        value={skillSearch}
                                        onChange={e => setSkillSearch(e.target.value)}
                                        placeholder="Search technical competency..."
                                        className="w-full rounded-full input-bg border px-5 py-3 outline-none focus:border-accent text-sm pr-12 transition"
                                    />
                                    <i className="fa-solid fa-magnifying-glass absolute right-5 top-3.5 text-secondary text-sm" />
                                </div>

                                {/* Skills Categorized Lists */}
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {skills.map((category) => {
                                        const categoryItems = getCategoryItems(category);
                                        // Filter child items based on search query
                                        const filteredItems = categoryItems.filter(item =>
                                            item.title.toLowerCase().includes(skillSearch.toLowerCase())
                                        );

                                        if (filteredItems.length === 0) return null;

                                        return (
                                            <motion.div
                                                key={category.category}
                                                layout
                                                className="card-bg border rounded-2xl p-5 space-y-4"
                                            >
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-accent border-b pb-2 flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
                                                    <span className="h-2 w-2 rounded-full bg-accent inline-block" />
                                                    {category.category}
                                                </h3>

                                                <div className="space-y-2.5">
                                                    {filteredItems.map(item => (
                                                        <motion.div
                                                            key={item.title}
                                                            className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-900/40 transition"
                                                            whileHover={{ scale: 1.02 }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-accent/60 w-4 flex justify-center">
                                                                    <i className={item.brand ? `fa-brands fa-${item.icon}` : `fa fa-${item.icon || 'code'}`} />
                                                                </span>
                                                                <span className="text-secondary font-medium">{item.title}</span>
                                                                {item.group && (
                                                                    <span className="hidden sm:inline rounded-full border border-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase text-muted">
                                                                        {item.group}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-60" />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW 3: ATS RECRUITER PREVIEW */}
                        {activeTab === 'ats' && (
                            <motion.div
                                key="ats"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="max-w-2xl mx-auto space-y-6"
                            >
                                {/* Recruiter status summary card */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                                    <div className="card-bg border rounded-2xl p-4 flex flex-col justify-center">
                                        <span className="text-accent font-bold text-base block uppercase tracking-wider">{t('cvTimeline.remoteReady')}</span>
                                        <span className="text-xs text-secondary mt-1">Cross-Border distributed team experienced</span>
                                    </div>
                                    <div className="card-bg border rounded-2xl p-4 flex flex-col justify-center">
                                        <span className="text-cyan-400 font-bold text-base block uppercase tracking-wider">{t('cvTimeline.freelanceStatus')}</span>
                                        <span className="text-xs text-secondary mt-1">Available for immediate project scoping</span>
                                    </div>
                                </div>

                                {/* Printable ATS Summary Sheet */}
                                <div className="card-bg border rounded-2xl p-6 md:p-8 space-y-6 shadow-inner text-sm relative overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                    
                                    {/* Resume Header */}
                                    <div className="text-center space-y-1.5 border-b pb-5" style={{ borderColor: 'var(--border-color)' }}>
                                        <h3 className="text-xl md:text-2xl font-black tracking-wide text-primary">YAHYA EL GZOULI</h3>
                                        <p className="text-accent font-bold tracking-wider text-xs md:text-sm uppercase">Full-Stack Developer | Computer Engineering Student | DevOps Learner</p>
                                        <p className="text-secondary text-xs">Oujda, Morocco | {contactInfo.email} | +212 654495827</p>
                                    </div>

                                    {/* Career Summary */}
                                    <div className="space-y-2">
                                        <h4 className="font-extrabold text-accent uppercase tracking-wider text-xs border-b pb-1 flex items-center gap-1.5" style={{ borderColor: 'var(--border-color)' }}>
                                            <i className="fa-regular fa-id-badge text-xs" />
                                            Professional Summary
                                        </h4>
                                        <p className="text-secondary text-xs md:text-sm leading-relaxed font-medium">
                                            Full-Stack Developer and Computer Engineering student focused on building modern web applications and learning real-world DevOps workflows, including CI/CD automation, containerized deployment, code quality analysis, and monitoring.
                                        </p>
                                    </div>

                                    {/* Education preview list */}
                                    <div className="space-y-3">
                                        <h4 className="font-extrabold text-accent uppercase tracking-wider text-xs border-b pb-1 flex items-center gap-1.5" style={{ borderColor: 'var(--border-color)' }}>
                                            <i className="fa-solid fa-graduation-cap text-xs" />
                                            Education milestones
                                        </h4>
                                        <div className="space-y-2.5">
                                            {education.map((edu, idx) => (
                                                <div key={idx} className="flex justify-between items-start gap-4 text-xs font-semibold">
                                                    <div>
                                                        <p className="text-primary">{edu.text.split('—')[0].trim()}</p>
                                                        <p className="text-muted text-[10px]">{edu.text.split('—')[1]?.trim()}</p>
                                                    </div>
                                                    <span className="text-accent font-bold flex-shrink-0 text-right">{edu.period}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Experience preview list */}
                                    <div className="space-y-3">
                                        <h4 className="font-extrabold text-accent uppercase tracking-wider text-xs border-b pb-1 flex items-center gap-1.5" style={{ borderColor: 'var(--border-color)' }}>
                                            <i className="fa-solid fa-briefcase text-xs" />
                                            Professional landmarks
                                        </h4>
                                        <div className="space-y-3">
                                            {experience.map((exp, idx) => (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex justify-between items-start gap-4 text-xs font-bold">
                                                        <div>
                                                            <p className="text-primary">{exp.role} <span className="text-accent">@ {exp.company}</span></p>
                                                            <p className="text-muted text-[10px] font-semibold">{exp.location}</p>
                                                        </div>
                                                        <span className="text-accent font-bold flex-shrink-0 text-right">{exp.period}</span>
                                                    </div>
                                                    <p className="text-secondary text-[11px] leading-relaxed">{exp.summary}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Background decorative page stamp */}
                                    <div className="absolute right-4 bottom-4 opacity-[0.03] text-accent text-8xl pointer-events-none select-none z-0">
                                        <i className="fa-solid fa-file-contract" />
                                    </div>
                                </div>

                                {/* Visual Downloads Row */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <motion.a
                                        href="/yahya_el_gzouli_cv_en.pdf"
                                        download
                                        className="flex-1 text-center inline-flex items-center justify-center gap-2 rounded-full bg-accent text-black font-bold py-3 hover:shadow-lg hover:shadow-accent/20 transition duration-300"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <i className="fa-solid fa-file-pdf" />
                                        <span>{t('cvTimeline.downloadPdf')}</span>
                                    </motion.a>

                                    <motion.a
                                        href="/yahya_el_gzouli_cv_en.pdf"
                                        download
                                        className="flex-1 text-center inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent/40 text-accent font-bold py-3 hover:bg-accent/10 transition duration-300"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <i className="fa-solid fa-user-tie" />
                                        <span>{t('cvTimeline.downloadAts')}</span>
                                    </motion.a>
                                </div>
                            </motion.div>
                        )}
                        
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
