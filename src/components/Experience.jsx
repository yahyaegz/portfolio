import React from 'react';
import { experience } from '../data';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';
import TiltCard from './TiltCard';

export default function Experience() {
    const { t } = useLanguage();
    const translatedItems = t('experience.items');
    const items = experience.map((e, i) => ({
        ...e,
        role: translatedItems?.[i]?.role || e.role,
        location: translatedItems?.[i]?.location || e.location,
        summary: translatedItems?.[i]?.summary || e.summary,
        highlights: translatedItems?.[i]?.highlights || e.highlights,
    }));

    return (
        <section id="experience" className="section-alt">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-16">
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4"><SplitTextReveal>{t('experience.title')}</SplitTextReveal> <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('experience.titleSpan')}</SplitTextReveal></span></h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2 md:px-0">{t('experience.subtitle')}</p>
                </div>
                <div className="space-y-4 md:space-y-6">
                    {items.map((e) => (
                        <TiltCard
                            key={e.company}
                            className="rounded-xl card-bg border p-6 md:p-8 shadow-lg transition-all duration-300 hover:shadow-xl"
                        >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-2xl font-semibold text-accent">{e.company}</h3>
                                    <p className="text-lg font-medium">{e.role}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-accent font-semibold">{e.period}</p>
                                    <p className="text-sm text-muted">{e.location}</p>
                                </div>
                            </div>
                            {e.summary && <p className="text-secondary mb-4 leading-relaxed">{e.summary}</p>}
                            {e.highlights && (
                                <ul className="mb-4 space-y-2">
                                    {e.highlights.map((highlight, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-secondary">
                                            <i className="fa fa-check text-accent mt-1 flex-shrink-0" />
                                            <span>{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {e.link && e.link !== '#' && (
                                <a
                                    className="inline-flex items-center gap-2 text-accent hover:underline transition font-semibold text-sm"
                                    href={e.link}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <i className="fa fa-link" /> {t('experience.visitCompany')}
                                </a>
                            )}
                        </TiltCard>
                    ))}
                </div>
            </div>
        </section>
    );
}