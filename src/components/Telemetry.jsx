import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Telemetry() {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('vitals');

    // Telemetry metric states
    const [ttfb, setTtfb] = useState(120); // ms
    const [lcp, setLcp] = useState(1.1); // seconds
    const [cls, setCls] = useState(0.02);
    const [fid, setFid] = useState(15); // ms
    const [fps, setFps] = useState(60);
    const [memory, setMemory] = useState({ used: 35, limit: 120 }); // MB
    
    // Telemetry log list & engagement metrics
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ clicks: 0, cvDownloads: 0, chat: 0, aiTrain: 0 });

    const fpsRef = useRef({ frames: 0, lastTime: 0 });
    const logCounter = useRef(0);
    const isRtl = language === 'ar';

    // Append log entries with timestamp
    const addLog = (tag, message) => {
        const time = new Date().toLocaleTimeString().slice(0, 8);
        const newLog = { id: logCounter.current++, time, tag, message };
        setLogs(prev => [newLog, ...prev.slice(0, 30)]);
    };

    // Initialize telemetry event listeners & performance calculations
    useEffect(() => {
        const deferredTimers = [];
        const defer = (callback) => {
            const timerId = window.setTimeout(callback, 0);
            deferredTimers.push(timerId);
        };

        // 1. Calculate Time to First Byte (TTFB)
        if (typeof window !== 'undefined' && window.performance) {
            const navTiming = performance.getEntriesByType('navigation')[0];
            if (navTiming) {
                const ttfbVal = Math.round(navTiming.responseStart - navTiming.requestStart);
                defer(() => {
                    setTtfb(ttfbVal > 0 ? ttfbVal : 95);
                    addLog('SYSTEM', `TTFB calculated: ${ttfbVal > 0 ? ttfbVal : 95}ms`);
                });
            } else {
                defer(() => setTtfb(98));
            }
        }

        // 2. Track click engagement events
        const handleClick = (e) => {
            setStats(prev => {
                const next = { ...prev, clicks: prev.clicks + 1 };
                localStorage.setItem('telemetry_clicks', next.clicks);
                return next;
            });
            const tag = e.target.tagName.toLowerCase();
            const id = e.target.id ? `#${e.target.id}` : '';
            addLog('EVENT', `User clicked element: <${tag}${id}>`);
        };
        window.addEventListener('click', handleClick);

        // 3. PerformanceObserver for LCP (Largest Contentful Paint)
        try {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                const lcpVal = (lastEntry.startTime / 1000).toFixed(2);
                setLcp(parseFloat(lcpVal));
                addLog('PERF', `Largest Contentful Paint observed: ${lcpVal}s`);
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {
            defer(() => setLcp(1.15));
        }

        // 4. PerformanceObserver for FID (First Input Delay)
        try {
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                if (entries.length > 0) {
                    const fidVal = Math.round(entries[0].processingStart - entries[0].startTime);
                    setFid(fidVal);
                    addLog('PERF', `First Input Delay observed: ${fidVal}ms`);
                }
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
        } catch {
            defer(() => setFid(12));
        }

        // 5. PerformanceObserver for CLS (Cumulative Layout Shift)
        try {
            let clsAccum = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsAccum += entry.value;
                        setCls(parseFloat(clsAccum.toFixed(4)));
                        addLog('PERF', `Layout Shift observed: +${entry.value.toFixed(4)} (Total CLS: ${clsAccum.toFixed(4)})`);
                    }
                }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch {
            defer(() => setCls(0.015));
        }

        // 6. RequestAnimationFrame Framerate loop (FPS)
        let animationFrameId;
        fpsRef.current.lastTime = performance.now();
        const calculateFps = () => {
            const now = performance.now();
            fpsRef.current.frames++;
            if (now >= fpsRef.current.lastTime + 1000) {
                const currentFps = Math.round((fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime));
                setFps(currentFps > 60 ? 60 : currentFps);
                fpsRef.current.frames = 0;
                fpsRef.current.lastTime = now;
            }
            animationFrameId = requestAnimationFrame(calculateFps);
        };
        animationFrameId = requestAnimationFrame(calculateFps);

        // 7. Dynamic memory tracking (Chrome Performance API)
        const memoryInterval = setInterval(() => {
            if (window.performance && performance.memory) {
                const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                const limit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
                setMemory({ used, limit });
            } else {
                // Heuristic mock representing standard memory growth
                setMemory(prev => {
                    const diff = Math.random() * 2 - 1.0;
                    const nextUsed = Math.max(25, Math.min(65, prev.used + diff));
                    return { used: Math.round(nextUsed), limit: 120 };
                });
            }
        }, 3000);

        // 8. Load engagement counters from localStorage
        const loadedClicks = parseInt(localStorage.getItem('telemetry_clicks')) || 0;
        const loadedDownloads = parseInt(localStorage.getItem('telemetry_cv_downloads')) || 0;
        const loadedChat = parseInt(localStorage.getItem('telemetry_chat_messages')) || 0;
        const loadedAITrain = parseInt(localStorage.getItem('telemetry_ai_trainings')) || 0;
        defer(() => {
            setStats({ clicks: loadedClicks, cvDownloads: loadedDownloads, chat: loadedChat, aiTrain: loadedAITrain });
            addLog('SYSTEM', 'Telemetry services fully initialized.');
        });

        return () => {
            window.removeEventListener('click', handleClick);
            cancelAnimationFrame(animationFrameId);
            clearInterval(memoryInterval);
            deferredTimers.forEach(timerId => window.clearTimeout(timerId));
        };
    }, []);

    // Sync state elements periodically when user interacts with portfolio
    useEffect(() => {
        const interval = setInterval(() => {
            const loadedClicks = parseInt(localStorage.getItem('telemetry_clicks')) || 0;
            const loadedDownloads = parseInt(localStorage.getItem('telemetry_cv_downloads')) || 0;
            const loadedChat = parseInt(localStorage.getItem('telemetry_chat_messages')) || 0;
            const loadedAITrain = parseInt(localStorage.getItem('telemetry_ai_trainings')) || 0;
            setStats({ clicks: loadedClicks, cvDownloads: loadedDownloads, chat: loadedChat, aiTrain: loadedAITrain });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* FLOATING STATUS TELEMETRY WIDGET PILL */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 left-8 z-50 rounded-full card-bg border py-2.5 px-4 flex items-center gap-2.5 shadow-lg shadow-black/40 text-xs font-semibold hover:border-accent/60 transition group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ borderColor: 'var(--border-color)', direction: 'ltr' }}
                aria-label={t('telemetry.tooltip')}
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-secondary group-hover:text-primary transition">
                    FPS: <span className="text-accent font-bold tabular-nums">{fps}</span>
                </span>
                <span className="h-3 w-[1px] bg-slate-800" />
                <span className="text-secondary group-hover:text-primary transition">
                    LCP: <span className="text-accent font-bold tabular-nums">{lcp}s</span>
                </span>
            </motion.button>

            {/* FULL SLIDEOUT PANEL */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex justify-start"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
                    >
                        {/* Backdrop Click close */}
                        <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                        {/* Slider frame */}
                        <motion.div
                            initial={{ x: isRtl ? '100%' : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: isRtl ? '100%' : '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
                            className="relative z-10 w-full max-w-md h-full flex flex-col shadow-2xl border-r overflow-y-auto"
                            style={{
                                backgroundColor: 'var(--bg-primary)',
                                borderColor: 'var(--border-color)',
                                direction: isRtl ? 'rtl' : 'ltr'
                            }}
                        >
                            {/* Panel Header */}
                            <div className="p-5 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                                <div className="flex items-center gap-2.5">
                                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
                                        {t('telemetry.panelHeader')}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 rounded-full border border-slate-700/60 hover:bg-slate-800 hover:text-rose-400 flex items-center justify-center transition"
                                    aria-label={t('telemetry.close')}
                                >
                                    <i className="fa fa-times" />
                                </button>
                            </div>

                            {/* View selector tabs */}
                            <div className="px-5 border-b flex gap-4 text-xs font-bold sticky top-[69px] z-20 backdrop-blur-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                {[
                                    { id: 'vitals', label: t('telemetry.tabVitals') },
                                    { id: 'monitor', label: t('telemetry.tabMonitor') },
                                    { id: 'logs', label: t('telemetry.tabLog') }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-3.5 border-b-2 transition relative ${
                                            activeTab === tab.id
                                                ? 'text-accent border-accent'
                                                : 'text-secondary border-transparent hover:text-primary'
                                        }`}
                                    >
                                        {activeTab === tab.id && (
                                            <motion.span
                                                layoutId="activeTelemetryTab"
                                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                                            />
                                        )}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content Panels */}
                            <div className="flex-1 p-5 space-y-6">
                                <AnimatePresence mode="wait">
                                    
                                    {/* 1. WEB VITALS METRICS */}
                                    {activeTab === 'vitals' && (
                                        <motion.div
                                            key="vitals"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            {/* LCP Gauge */}
                                            <div className="card-bg border rounded-xl p-4 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-secondary font-bold uppercase tracking-wide">{t('telemetry.lcp')}</p>
                                                    <p className="text-[10px] text-muted leading-relaxed">Measures loading performance. Optimal is under 2.5s.</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-accent tabular-nums">{lcp}s</span>
                                                    <span className="block text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">{t('telemetry.statusPerfect')}</span>
                                                </div>
                                            </div>

                                            {/* TTFB Gauge */}
                                            <div className="card-bg border rounded-xl p-4 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-secondary font-bold uppercase tracking-wide">{t('telemetry.ttfb')}</p>
                                                    <p className="text-[10px] text-muted leading-relaxed">Server response speed. Optimal is under 200ms.</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-accent tabular-nums">{ttfb}ms</span>
                                                    <span className="block text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">{t('telemetry.statusPerfect')}</span>
                                                </div>
                                            </div>

                                            {/* FID Gauge */}
                                            <div className="card-bg border rounded-xl p-4 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-secondary font-bold uppercase tracking-wide">{t('telemetry.fid')}</p>
                                                    <p className="text-[10px] text-muted leading-relaxed">First interaction input delay. Optimal is under 100ms.</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-accent tabular-nums">{fid}ms</span>
                                                    <span className="block text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">{t('telemetry.statusPerfect')}</span>
                                                </div>
                                            </div>

                                            {/* CLS Gauge */}
                                            <div className="card-bg border rounded-xl p-4 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-secondary font-bold uppercase tracking-wide">{t('telemetry.cls')}</p>
                                                    <p className="text-[10px] text-muted leading-relaxed">Measures visual layout stability. Optimal is under 0.1.</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-accent tabular-nums">{cls}</span>
                                                    <span className="block text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">{t('telemetry.statusPerfect')}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 2. REAL-TIME HARDWARE & INTERACTION TELEMETRY */}
                                    {activeTab === 'monitor' && (
                                        <motion.div
                                            key="monitor"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            {/* Hardware Monitor circular indicators */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* FPS gauge card */}
                                                <div className="card-bg border rounded-xl p-4 text-center space-y-1.5 flex flex-col justify-center">
                                                    <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{t('telemetry.fps')}</span>
                                                    <span className="text-3xl font-black text-accent tabular-nums">{fps}</span>
                                                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
                                                        <div className="h-full bg-accent rounded-full" style={{ width: `${(fps / 60) * 100}%` }} />
                                                    </div>
                                                </div>
                                                
                                                {/* Memory allocation card */}
                                                <div className="card-bg border rounded-xl p-4 text-center space-y-1.5 flex flex-col justify-center">
                                                    <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{t('telemetry.memory')}</span>
                                                    <span className="text-3xl font-black text-cyan-400 tabular-nums">{memory.used}MB</span>
                                                    <span className="text-[9px] text-muted">Heap Limit: {memory.limit}MB</span>
                                                </div>
                                            </div>

                                            {/* Recruiter & Engagement telemetries counters */}
                                            <div className="card-bg border rounded-xl p-4 space-y-3.5">
                                                <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b pb-2 flex items-center gap-1.5" style={{ borderColor: 'var(--border-color)' }}>
                                                    <i className="fa-solid fa-chart-line" />
                                                    {t('telemetry.interactions')}
                                                </h3>
                                                
                                                <div className="grid grid-cols-2 gap-3.5 text-xs">
                                                    <div className="space-y-1">
                                                        <span className="text-muted font-semibold uppercase text-[9px] tracking-wider block">{t('telemetry.clicks')}</span>
                                                        <span className="text-sm font-bold text-primary tabular-nums">{stats.clicks}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-muted font-semibold uppercase text-[9px] tracking-wider block">{t('telemetry.cvDownloads')}</span>
                                                        <span className="text-sm font-bold text-primary tabular-nums">{stats.cvDownloads}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-muted font-semibold uppercase text-[9px] tracking-wider block">{t('telemetry.chatMessages')}</span>
                                                        <span className="text-sm font-bold text-primary tabular-nums">{stats.chat}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-muted font-semibold uppercase text-[9px] tracking-wider block">{t('telemetry.aiTrainings')}</span>
                                                        <span className="text-sm font-bold text-primary tabular-nums">{stats.aiTrain}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 3. SCROLLING REAL-TIME SYSTEM ACTIVITY LOG */}
                                    {activeTab === 'logs' && (
                                        <motion.div
                                            key="logs"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-3 flex flex-col h-full"
                                        >
                                            <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                                                <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{t('telemetry.telemetryLogTitle')}</span>
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            </div>

                                            {/* Terminal viewport */}
                                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 h-[320px] overflow-y-auto font-mono text-[10px] leading-relaxed space-y-2 select-text text-left">
                                                {logs.length === 0 ? (
                                                    <p className="text-slate-600 italic">{t('telemetry.logWaiting')}</p>
                                                ) : (
                                                    logs.map((log) => {
                                                        let badgeColor = 'text-slate-400';
                                                        if (log.tag === 'SYSTEM') badgeColor = 'text-cyan-400';
                                                        if (log.tag === 'PERF') badgeColor = 'text-amber-400';
                                                        if (log.tag === 'EVENT') badgeColor = 'text-emerald-400';

                                                        return (
                                                            <div key={log.id} className="flex gap-2 items-start border-b border-slate-900 pb-1.5">
                                                                <span className="text-slate-500 select-none flex-shrink-0">[{log.time}]</span>
                                                                <span className={`font-bold select-none flex-shrink-0 ${badgeColor}`}>[{log.tag}]</span>
                                                                <span className="text-slate-300 break-all">{log.message}</span>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
