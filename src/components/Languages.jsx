import React from 'react';
import { languages } from '../data';
import { useLanguage } from '../context/LanguageContext';

export default function Languages() {
    const { t } = useLanguage();
    return (
        <section id="languages" className="section-alt">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">{t('languages.title')} <span className="text-accent">{t('languages.titleSpan')}</span></h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2 md:px-0">{t('languages.subtitle')}</p>
                </div>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-2xl mx-auto">
                    {languages.map((lang, index) => (
                        <div
                            key={lang.language}
                            className="rounded-xl card-bg border p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                            style={{ transitionDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-semibold text-accent">{lang.language}</h3>
                                <i className="fa fa-globe text-2xl text-accent opacity-30" />
                            </div>
                            <p className="text-secondary font-medium">{lang.level}</p>
                            <div className="mt-3 w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
                                <div
                                    className="bg-gradient-to-r from-accent to-cyan-400 h-2 rounded-full transition-all duration-500"
                                    style={{
                                        width: lang.level === 'Native' ? '100%' : lang.level === 'Conversational' ? '75%' : '50%',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
