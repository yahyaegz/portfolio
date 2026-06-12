import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function CurrentlyOpenTo({ variant = 'hero' }) {
    const { t } = useLanguage();

    const isHero = variant === 'hero';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`card-bg border rounded-2xl p-4 sm:p-5 relative overflow-hidden max-w-xl ${
                isHero ? 'w-full shadow-lg' : 'w-full shadow-md'
            }`}
            style={{
                borderColor: 'var(--border-color)',
                background: 'var(--bg-card)'
            }}
        >
            {/* Top Header Row */}
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase">
                        {t('currentlyOpenTo.title')}
                    </span>
                </div>
                <motion.span
                    className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase"
                    whileHover={{ scale: 1.05 }}
                >
                    {t('currentlyOpenTo.badgeText')}
                </motion.span>
            </div>

            {/* Grid Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wider">
                        {t('currentlyOpenTo.rolesLabel')}
                    </p>
                    <p className="font-semibold text-primary leading-snug">
                        {t('currentlyOpenTo.roles')}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wider">
                        {t('currentlyOpenTo.locationLabel')}
                    </p>
                    <p className="font-medium text-secondary leading-snug">
                        {t('currentlyOpenTo.location')}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wider">
                        {t('currentlyOpenTo.responseLabel')}
                    </p>
                    <p className="font-medium text-secondary leading-snug flex items-center gap-1.5">
                        <i className="fa-regular fa-clock text-emerald-500" />
                        {t('currentlyOpenTo.responseTime')}
                    </p>
                </div>
            </div>
            
            {/* Background Glow */}
            <div 
                className="absolute -right-16 -bottom-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" 
                aria-hidden="true" 
            />
        </motion.div>
    );
}
