import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    profile,
    topSkills,
    skills,
    experience,
    projects,
    education,
    contactInfo,
    services,
    certifications,
    coreCompetencies,
    testimonials,
    languages as langData,
} from '../data';
import { useLanguage } from '../context/LanguageContext';

const PUTER_SDK_SRC = 'https://js.puter.com/v2/';
const SPEECH_LANGS = {
    en: 'en-US',
    ar: 'ar-MA',
    fr: 'fr-FR',
    es: 'es-ES',
};

let puterLoadPromise;

function setPuterQuietMode() {
    window.PUTER_QUIET = true;
    window.puter = window.puter || {};
    window.puter.quiet = true;
}

function loadPuter() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Puter is only available in the browser.'));
    }

    setPuterQuietMode();

    if (window.puter?.ai?.chat) {
        return Promise.resolve(window.puter);
    }

    if (puterLoadPromise) {
        return puterLoadPromise;
    }

    puterLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PUTER_SDK_SRC;
        script.async = true;
        script.dataset.puterSdk = 'true';

        script.onload = () => {
            setPuterQuietMode();

            if (window.puter?.ai?.chat) {
                resolve(window.puter);
                return;
            }

            puterLoadPromise = undefined;
            reject(new Error('Puter AI did not initialize.'));
        };

        script.onerror = () => {
            puterLoadPromise = undefined;
            reject(new Error('Puter SDK failed to load.'));
        };

        document.head.appendChild(script);
    });

    return puterLoadPromise;
}

function getSpeechRecognition() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function cleanForSpeech(text) {
    return text
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/[*_`>#-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 900);
}

function formatSkillCategory(category) {
    if (category.groups?.length) {
        return `${category.category}: ${category.groups
            .map(group => `${group.label}: ${group.items.map(item => item.title).join(', ')}`)
            .join('; ')}`;
    }

    return `${category.category}: ${category.items.map(item => item.title).join(', ')}`;
}

function buildWebsiteKnowledge() {
    const skillsSummary = skills
        .map(formatSkillCategory)
        .join('\n');
    const projectsSummary = projects
        .map(project => [
            `${project.title}: ${project.description}`,
            `Tech: ${project.tech.join(', ')}`,
            project.link && project.link !== '#' ? `Link: ${project.link}` : null,
            project.githubUrl ? `GitHub: ${project.githubUrl}` : null,
            project.localNote || null,
        ].filter(Boolean).join(' | '))
        .join('\n');
    const experienceSummary = experience
        .map(item => [
            `${item.company}: ${item.role}`,
            `${item.period}, ${item.location}`,
            item.summary,
            item.highlights?.length ? `Highlights: ${item.highlights.join('; ')}` : null,
            item.link && item.link !== '#' ? `Company link: ${item.link}` : null,
        ].filter(Boolean).join(' | '))
        .join('\n');
    const educationSummary = education
        .map(item => `${item.period}: ${item.text}`)
        .join('\n');
    const certsSummary = certifications
        .map(category => `${category.category}\n${category.items.map(cert => [
            cert.name,
            cert.type,
            `Issued: ${cert.issued}`,
            cert.credentialId ? `Credential ID: ${cert.credentialId}` : null,
            cert.skills?.length ? `Skills: ${cert.skills.join(', ')}` : null,
            cert.credentialUrl && cert.credentialUrl !== '#' ? `URL: ${cert.credentialUrl}` : null,
        ].filter(Boolean).join(' | ')).join('\n')}`)
        .join('\n\n');
    const servicesSummary = services
        .map(service => `${service.title}: ${service.text}`)
        .join('\n');
    const testimonialsSummary = testimonials
        .map(testimonial => `"${testimonial.quote}" - ${testimonial.author} (${testimonial.stars}/5)`)
        .join('\n');
    const languagesSummary = langData
        .map(languageItem => `${languageItem.language}: ${languageItem.level}`)
        .join(', ');

    return `PROFILE
Name: ${profile.name}
Title: ${profile.title}
Location and contact line: ${profile.subtitle}
Email: ${contactInfo.email}
Phone: ${contactInfo.phone}
LinkedIn: ${contactInfo.linkedin}
GitHub: ${contactInfo.github}
Twitter/X: ${profile.social.twitter}
Instagram: ${profile.social.instagram}
Summary: ${profile.summary}

POSITIONING
Top skills: ${topSkills.join(', ')}
Core competencies: ${coreCompetencies.join(', ')}
Open to: opportunities, freelance projects, collaboration, full-stack work, backend/API work, AI/ML integrations, DevOps learning projects, and SaaS/product work.
Favorite technologies: React for frontend, Node.js and ASP.NET Core for backend, Python for AI/ML, and Docker/Jenkins/SonarQube/Prometheus/Grafana for DevOps practice.

WEBSITE SECTIONS
Home: introduction, profile photo, contact CTA, CV download, social links.
Services: full-stack development, database design and optimization, secure authentication, machine learning solutions, data analytics, neural networks and deep learning.
Skills: grouped technical stack across programming, frontend, backend, databases, cloud/tools, AI/ML, and DevOps/CI/CD/monitoring.
Projects: portfolio case studies and external project links when available.
Education: EHEI Oujda, preparatory classes, baccalaureate.
Experience: Codveda Technologies and AIR BABOUCHE.
Certifications: Meta, HackerRank, Codedex, and Scrimba credentials.
Contact: email, phone, LinkedIn, and contact form.

SERVICES
${servicesSummary}

SKILLS
${skillsSummary}

PROJECTS
${projectsSummary}

EXPERIENCE
${experienceSummary}

EDUCATION
${educationSummary}

CERTIFICATIONS
${certsSummary}

LANGUAGES
${languagesSummary}

TESTIMONIALS
${testimonialsSummary}`;
}

function buildSystemPrompt(language) {
    const langNames = { en: 'English', ar: 'Arabic', fr: 'French', es: 'Spanish' };
    const currentLang = langNames[language] || 'English';

    return `You are Yahya El Gzouli's personal portfolio assistant and voice-capable website guide.

Always respond in ${currentLang}. If the visitor writes or speaks in a different language, still respond in ${currentLang}.

Use only the website knowledge below. Do not invent jobs, dates, metrics, links, credentials, or claims. If something is missing, say you do not see that detail on the website and offer a useful next step.

Be powerful but concise: answer directly, organize complex answers, recommend the most relevant projects/skills/services for the visitor's goal, and guide people toward the CV, contact form, email, LinkedIn, or project links when helpful.

When asked about Yahya, services, experience, projects, skills, certifications, education, contact, pricing, timeline, languages, or availability, use the exact facts below.

WEBSITE KNOWLEDGE
${buildWebsiteKnowledge()}`;
}

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
    const [isListening, setIsListening] = useState(false);
    const [speechInputSupported, setSpeechInputSupported] = useState(false);
    const [speechOutputSupported, setSpeechOutputSupported] = useState(false);
    const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false);
    const messagesEnd = useRef(null);
    const inputRef = useRef(null);
    const welcomeSent = useRef(false);
    const conversationRef = useRef([]);
    const recognitionRef = useRef(null);

    const ensureWelcome = useCallback(() => {
        if (!welcomeSent.current) {
            welcomeSent.current = true;
            const welcomeText = t('chatbot.welcome');
            setMessages([{ role: 'bot', text: welcomeText }]);
            conversationRef.current = [
                { role: 'assistant', content: welcomeText },
            ];
        }
    }, [t]);

    useEffect(() => {
        setSpeechInputSupported(Boolean(getSpeechRecognition()));
        setSpeechOutputSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);

        return () => {
            recognitionRef.current?.abort?.();
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!voiceReplyEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [voiceReplyEnabled]);

    const speak = useCallback((text) => {
        if (!voiceReplyEnabled || !speechOutputSupported || typeof window === 'undefined' || !window.speechSynthesis) {
            return;
        }

        const spokenText = cleanForSpeech(text);
        if (!spokenText) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(spokenText);
        const lang = SPEECH_LANGS[language] || SPEECH_LANGS.en;
        const voices = window.speechSynthesis.getVoices?.() || [];
        const matchingVoice = voices.find(voice => voice.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));

        utterance.lang = lang;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        if (matchingVoice) utterance.voice = matchingVoice;

        window.speechSynthesis.speak(utterance);
    }, [language, speechOutputSupported, voiceReplyEnabled]);

    const sendToPuter = useCallback(async (userText) => {
        const systemPrompt = buildSystemPrompt(language);

        conversationRef.current = [
            ...conversationRef.current,
            { role: 'user', content: userText },
        ];

        if (conversationRef.current.length > 20) {
            conversationRef.current = conversationRef.current.slice(-20);
        }

        try {
            const puter = await loadPuter();
            const response = await puter.ai.chat(
                [
                    { role: 'system', content: systemPrompt },
                    ...conversationRef.current,
                ],
                { model: 'gpt-4o-mini' }
            );

            const botText = response?.message?.content || response?.toString?.() || t('chatbot.smartDefault');

            conversationRef.current = [
                ...conversationRef.current,
                { role: 'assistant', content: botText },
            ];

            return botText;
        } catch {
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

        try {
            const botResponse = await sendToPuter(trimmed);
            const botMsg = { role: 'bot', text: botResponse };
            setMessages(prev => [...prev, botMsg]);
            speak(botResponse);
        } finally {
            setIsTyping(false);
        }
    }, [input, isTyping, sendToPuter, speak]);

    const startListening = useCallback(() => {
        if (!speechInputSupported || isTyping || isListening) return;

        const Recognition = getSpeechRecognition();
        if (!Recognition) return;

        recognitionRef.current?.abort?.();

        const recognition = new Recognition();
        recognition.lang = SPEECH_LANGS[language] || SPEECH_LANGS.en;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0]?.transcript)
                .filter(Boolean)
                .join(' ')
                .trim();

            if (transcript) {
                send(transcript);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [isListening, isTyping, language, send, speechInputSupported]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop?.();
        setIsListening(false);
    }, []);

    const toggleVoiceReplies = useCallback(() => {
        if (!speechOutputSupported) return;
        setVoiceReplyEnabled(current => {
            if (current && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            return !current;
        });
    }, [speechOutputSupported]);

    const handleSubmit = (e) => {
        e.preventDefault();
        send();
    };

    const isRtl = language === 'ar';

    return (
        <>
            <motion.button
                onClick={() => { setOpen(current => !current); ensureWelcome(); }}
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
                        className="fixed bottom-[9.5rem] right-4 sm:right-8 z-50 w-[calc(100vw-2rem)] max-w-[390px] max-h-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
                                type="button"
                                onClick={() => setOpen(false)}
                                className="ml-auto text-black/60 hover:text-black transition"
                                style={isRtl ? { marginLeft: 0, marginRight: 'auto' } : {}}
                                aria-label="Close chatbot"
                            >
                                <i className="fa fa-times" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[340px]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
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
                                    {getQuickQuestions(t).map((question, index) => (
                                        <motion.button
                                            key={index}
                                            type="button"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                            onClick={() => send(question)}
                                            className="text-xs rounded-full px-3 py-1.5 border border-accent/40 text-accent hover:bg-accent/10 transition"
                                        >
                                            {question}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <div ref={messagesEnd} />
                        </div>

                        <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 flex gap-2" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                            <motion.button
                                type="button"
                                whileHover={{ scale: speechInputSupported ? 1.05 : 1 }}
                                whileTap={{ scale: speechInputSupported ? 0.95 : 1 }}
                                className={`h-10 w-10 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                                    isListening
                                        ? 'bg-accent text-black border-accent shadow-lg shadow-accent/30'
                                        : 'text-accent border-accent/40 hover:bg-accent/10 disabled:opacity-40 disabled:hover:bg-transparent'
                                }`}
                                onClick={isListening ? stopListening : startListening}
                                disabled={!speechInputSupported || isTyping}
                                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                                aria-pressed={isListening}
                                title={speechInputSupported ? 'Voice input' : 'Voice input unavailable'}
                            >
                                <i className={`fa ${isListening ? 'fa-stop' : 'fa-microphone'} text-sm`} />
                            </motion.button>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t('chatbot.placeholder')}
                                className="min-w-0 flex-1 text-sm px-4 py-2.5 rounded-full input-bg border outline-none focus:border-accent transition"
                                disabled={isTyping}
                            />
                            <motion.button
                                type="button"
                                whileHover={{ scale: speechOutputSupported ? 1.05 : 1 }}
                                whileTap={{ scale: speechOutputSupported ? 0.95 : 1 }}
                                className={`h-10 w-10 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                                    voiceReplyEnabled
                                        ? 'bg-accent text-black border-accent'
                                        : 'text-accent border-accent/40 hover:bg-accent/10 disabled:opacity-40 disabled:hover:bg-transparent'
                                }`}
                                onClick={toggleVoiceReplies}
                                disabled={!speechOutputSupported}
                                aria-label={voiceReplyEnabled ? 'Disable spoken replies' : 'Enable spoken replies'}
                                aria-pressed={voiceReplyEnabled}
                                title={speechOutputSupported ? 'Spoken replies' : 'Spoken replies unavailable'}
                            >
                                <i className={`fa ${voiceReplyEnabled ? 'fa-volume-high' : 'fa-volume-xmark'} text-sm`} />
                            </motion.button>
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="h-10 w-10 rounded-full bg-accent text-black flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                                disabled={!input.trim() || isTyping}
                                aria-label="Send message"
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
