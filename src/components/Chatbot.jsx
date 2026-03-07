import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profile, skills, experience, projects, education, contactInfo, services, certifications, coreCompetencies, testimonials, languages as langData } from '../data';
import { useLanguage } from '../context/LanguageContext';

function YLogo({ size = 36 }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size}>
            <defs>
                <linearGradient id="chatbot-y-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#10b981' }} />
                    <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="#060b18" />
            <text x="32" y="45" fontFamily="Arial,sans-serif" fontSize="36" fontWeight="bold" fill="url(#chatbot-y-grad)" textAnchor="middle">Y</text>
        </svg>
    );
}


function buildSystemPrompt(language) {
    const langNames = { en: 'English', ar: 'Arabic', fr: 'French', es: 'Spanish' };
    const currentLang = langNames[language] || 'English';

    const skillsSummary = skills.map(c => `${c.category}: ${c.items.map(i => i.title).join(', ')}`).join('\n');
    const projectsSummary = projects.map(p => `• ${p.title} — ${p.description} | Tech: ${p.tech.join(', ')}${p.link && p.link !== '#' ? ` | Link: ${p.link}` : ''}`).join('\n');
    const experienceSummary = experience.map(e => `• ${e.company} — ${e.role} (${e.period}, ${e.location})\n  ${e.summary}`).join('\n');
    const educationSummary = education.map(e => `• ${e.text} (${e.period})`).join('\n');
    const certsSummary = certifications.flatMap(cat => cat.items.map(c => `• ${c.name} (${cat.category}) — Issued: ${c.issued}`)).join('\n');
    const servicesSummary = services.map(s => `• ${s.title}: ${s.text}`).join('\n');
    const testimonialsSummary = testimonials.map(t => `• "${t.quote}" — ${t.author} (${t.stars}★)`).join('\n');
    const languagesSummary = langData.map(l => `${l.language}: ${l.level}`).join(', ');

    return `You are Yahya El Gzouli's personal portfolio assistant. Your role is to answer visitors' questions about Yahya based ONLY on the data below. Be friendly, professional, concise, and helpful. Use emojis sparingly to keep things warm.

IMPORTANT: Always respond in ${currentLang}. If the user writes in a different language, still respond in ${currentLang}.

If someone asks something not covered by the data below, politely say you can only answer questions about Yahya and suggest what topics you can help with.

Never make up information that isn't in the data below. If you don't know, say so.

═══ PROFILE ═══
Name: ${profile.name}
Title: ${profile.title}
Location: Oujda, Morocco 🇲🇦
Age: 23
Phone: +212 654495827
Summary: ${profile.summary}

═══ SOCIAL LINKS ═══
LinkedIn: ${profile.social.linkedin}
GitHub: ${profile.social.github}
Twitter: ${profile.social.twitter}
Instagram: ${profile.social.instagram}

═══ CONTACT ═══
Email: ${contactInfo.email}
Phone: ${contactInfo.phone}
LinkedIn: ${contactInfo.linkedin}

═══ SKILLS ═══
${skillsSummary}

═══ CORE COMPETENCIES ═══
${coreCompetencies.join(', ')}

═══ PROJECTS ═══
${projectsSummary}

═══ EXPERIENCE ═══
${experienceSummary}

═══ EDUCATION ═══
${educationSummary}

═══ CERTIFICATIONS ═══
${certsSummary}

═══ SERVICES OFFERED ═══
${servicesSummary}

═══ LANGUAGES SPOKEN ═══
${languagesSummary}

═══ TESTIMONIALS ═══
${testimonialsSummary}

═══ ADDITIONAL INFO ═══
- Yahya is open to opportunities, freelance work, and collaboration.
- His CV can be downloaded from the hero section of this portfolio website.
- He is a 4th-year Computer Engineering student at EHEI Oujda.
- His favorite technologies are React (frontend), Node.js/ASP.NET Core (backend), and Python (AI/ML).
- He is self-taught in many areas, complementing his formal education with HackerRank, Scrimba, and Codédex courses.
- Pricing depends on project scope — visitors should reach out via the contact form or email.`;
}

function getQuickQuestions(t) {
    return [
        t('chatbot.quickSkills'),
        t('chatbot.quickProjects'),
        t('chatbot.quickContact'),
        t('chatbot.quickAbout'),
    ];
}

export default function Chatbot() {
    const { t, language } = useLanguage();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showQuick, setShowQuick] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEnd = useRef(null);
    const inputRef = useRef(null);
    const welcomeSent = useRef(false);
    const conversationRef = useRef([]); // stores {role, content} for puter.ai.chat

    const ensureWelcome = () => {
        if (!welcomeSent.current) {
            welcomeSent.current = true;
            const welcomeText = t('chatbot.welcome');
            setMessages([{ role: 'bot', text: welcomeText }]);
            conversationRef.current = [
                { role: 'assistant', content: welcomeText },
            ];
        }
    };

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const sendToPuter = useCallback(async (userText) => {
        const systemPrompt = buildSystemPrompt(language);

        // Add user message to conversation history
        conversationRef.current = [
            ...conversationRef.current,
            { role: 'user', content: userText },
        ];

        // Keep conversation history manageable (last 20 messages)
        if (conversationRef.current.length > 20) {
            conversationRef.current = conversationRef.current.slice(-20);
        }

        try {
            const response = await window.puter.ai.chat(
                [
                    { role: 'system', content: systemPrompt },
                    ...conversationRef.current,
                ],
                { model: 'gpt-4o-mini' }
            );

            const botText = response?.message?.content || response?.toString?.() || t('chatbot.smartDefault');

            // Add assistant reply to history
            conversationRef.current = [
                ...conversationRef.current,
                { role: 'assistant', content: botText },
            ];

            return botText;
        } catch (err) {
            console.error('Puter AI error:', err);
            return t('chatbot.smartDefault');
        }
    }, [language, t]);

    const send = useCallback(async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || isTyping) return;

        const userMsg = { role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setShowQuick(false);
        setIsTyping(true);

        const botResponse = await sendToPuter(trimmed);
        const botMsg = { role: 'bot', text: botResponse };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, [input, isTyping, sendToPuter]);

    const handleSubmit = (e) => {
        e.preventDefault();
        send();
    };

    const isRtl = language === 'ar';

    return (
        <>
            <motion.button
                onClick={() => { setOpen(o => !o); ensureWelcome(); }}
                className="fixed bottom-[5.25rem] right-8 z-50 h-12 w-12 rounded-full bg-accent text-black shadow-lg shadow-accent/30 flex items-center justify-center hover:shadow-accent/50 transition-shadow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle chatbot"
            >
                <motion.span
                    key={open ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                >
                    {open ? <i className="fa fa-times text-lg" /> : <YLogo size={28} />}
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="fixed bottom-[9.5rem] right-8 z-50 w-[340px] sm:w-[380px] max-h-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-color)',
                            border: '1px solid var(--border-color)',
                        }}
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="bg-accent px-4 py-3 flex items-center gap-3 flex-shrink-0">
                            <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                                <YLogo size={36} />
                            </div>
                            <div>
                                <p className="text-black font-semibold text-sm">{t('chatbot.title')}</p>
                                <p className="text-black/60 text-xs">{t('chatbot.subtitle')}</p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="ml-auto text-black/60 hover:text-black transition"
                                style={isRtl ? { marginLeft: 0, marginRight: 'auto' } : {}}
                            >
                                <i className="fa fa-times" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[340px]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'bot' && (
                                        <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1">
                                            <YLogo size={24} />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                                            msg.role === 'user'
                                                ? 'bg-accent text-black rounded-br-sm'
                                                : 'card-bg border rounded-bl-sm'
                                        }`}
                                        style={msg.role === 'bot' ? { color: 'var(--text-primary)' } : {}}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start items-center"
                                >
                                    <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 mr-2">
                                        <YLogo size={24} />
                                    </div>
                                    <div className="card-bg border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-accent inline-block" />
                                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-accent inline-block" />
                                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-accent inline-block" />
                                    </div>
                                </motion.div>
                            )}

                            {showQuick && messages.length <= 1 && !isTyping && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {getQuickQuestions(t).map((q, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            onClick={() => send(q)}
                                            className="text-xs rounded-full px-3 py-1.5 border border-accent/40 text-accent hover:bg-accent/10 transition"
                                        >
                                            {q}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <div ref={messagesEnd} />
                        </div>

                        <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 flex gap-2" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t('chatbot.placeholder')}
                                className="flex-1 text-sm px-4 py-2.5 rounded-full input-bg border outline-none focus:border-accent transition"
                                disabled={isTyping}
                            />
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="h-10 w-10 rounded-full bg-accent text-black flex items-center justify-center flex-shrink-0"
                                disabled={!input.trim() || isTyping}
                            >
                                <i className={`fa fa-paper-plane text-sm ${isRtl ? 'fa-flip-horizontal' : ''}`} />
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
