import React, { useState, useRef, useEffect } from 'react';
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

function buildKnowledge() {
    const kb = [];

    kb.push({ keys: ['name', 'who', 'yahya', 'about', 'introduce', 'yourself', 'tell me about', 'gzouli', 'portfolio owner', 'developer', 'engineer', 'من', 'يحيى', 'acerca', 'qui'], category: 'about', data: profile });

    kb.push({ keys: ['summary', 'bio', 'background', 'describe', 'overview', 'profile', 'ملخص', 'résumé', 'biografía'], category: 'summary', data: profile.summary });

    skills.forEach(cat => {
        const items = cat.items.map(i => i.title).join(', ');
        kb.push({ keys: [cat.category.toLowerCase(), ...cat.items.map(i => i.title.toLowerCase())], category: 'skills', data: { category: cat.category, items } });
    });
    kb.push({ keys: ['skill', 'tech', 'stack', 'technology', 'tool', 'framework', 'programming', 'competenc', 'مهار', 'habilidad', 'compétence', 'what can', 'what do you know', 'capable'], category: 'allSkills', data: skills });

    kb.push({ keys: ['competenc', 'core', 'strength', 'strong', 'best at', 'speciali', 'expert', 'كفاء', 'compétence clé', 'competencia'], category: 'competencies', data: coreCompetencies });

    projects.forEach(p => {
        kb.push({ keys: [p.title.toLowerCase(), ...p.tech.map(t => t.toLowerCase())], category: 'project', data: p });
    });
    kb.push({ keys: ['project', 'work', 'built', 'build', 'create', 'made', 'develop', 'مشر', 'proyecto', 'projet', 'portfolio', 'app', 'application', 'website', 'platform'], category: 'allProjects', data: projects });

    experience.forEach(e => {
        kb.push({ keys: [e.company.toLowerCase(), e.role.toLowerCase(), e.period.toLowerCase()], category: 'experience', data: e });
    });
    kb.push({ keys: ['experience', 'job', 'work', 'intern', 'stage', 'employ', 'company', 'career', 'خبر', 'experiencia', 'expérience', 'worked', 'where did', 'professional'], category: 'allExperience', data: experience });

    kb.push({ keys: ['education', 'study', 'school', 'university', 'degree', 'college', 'learn', 'academic', 'ehei', 'bac', 'preparatory', 'تعليم', 'formación', 'formation', 'studied', 'graduated', 'diploma'], category: 'education', data: education });

    kb.push({ keys: ['contact', 'email', 'phone', 'reach', 'message', 'call', 'connect', 'touch', 'تواصل', 'contacto', 'how to reach', 'get in touch', 'write', 'send'], category: 'contact', data: contactInfo });

    kb.push({ keys: ['service', 'offer', 'provide', 'what do you do', 'can you', 'help', 'خدم', 'servicio', 'propose'], category: 'services', data: services });

    kb.push({ keys: ['where', 'location', 'city', 'country', 'live', 'based', 'from', 'أين', 'dónde', 'où', 'morocco', 'oujda', 'maroc', 'marruecos', 'المغرب', 'وجدة'], category: 'location', data: null });

    kb.push({ keys: ['hire', 'available', 'freelance', 'open to', 'job', 'opportunity', 'recruit', 'توظيف', 'disponible', 'contract', 'remote', 'looking for', 'need developer'], category: 'hire', data: null });

    kb.push({ keys: ['language', 'speak', 'tongue', 'لغ', 'idioma', 'langue', 'arabic', 'french', 'english', 'spanish', 'عربي', 'فرنسي', 'انجليزي'], category: 'languages', data: langData });

    kb.push({ keys: ['cv', 'resume', 'download', 'pdf', 'سيرة', 'currículum', 'télécharger', 'descargar'], category: 'cv', data: null });

    kb.push({ keys: ['certif', 'badge', 'credential', 'hackerrank', 'scrimba', 'codédex', 'شهاد', 'certificación', 'achievement', 'award', 'earned'], category: 'certifications', data: certifications });

    kb.push({ keys: ['testimonial', 'review', 'feedback', 'client', 'what people say', 'recommend', 'آراء', 'testimonio', 'témoignage', 'opinion', 'say about'], category: 'testimonials', data: testimonials });

    kb.push({ keys: ['age', 'old', 'born', 'birthday', 'عمر', 'edad', 'âge', 'year born'], category: 'age', data: null });

    kb.push({ keys: ['github', 'linkedin', 'twitter', 'instagram', 'social', 'link', 'مواقع', 'redes sociales', 'réseaux'], category: 'social', data: profile.social });

    kb.push({ keys: ['hi', 'hello', 'hey', 'salam', 'bonjour', 'hola', 'مرحبا', 'السلام', 'good morning', 'good evening', 'sup', 'yo', 'wassup', 'what\'s up', 'howdy'], category: 'greeting', data: null });

    kb.push({ keys: ['thank', 'thanks', 'merci', 'gracias', 'شكر', 'appreciate', 'helpful', 'great', 'awesome', 'cool', 'nice'], category: 'thanks', data: null });

    kb.push({ keys: ['bye', 'goodbye', 'see you', 'later', 'وداع', 'adiós', 'au revoir', 'ciao', 'take care'], category: 'goodbye', data: null });

    kb.push({ keys: ['joke', 'funny', 'fun', 'humor', 'laugh', 'نكت', 'chiste', 'blague'], category: 'fun', data: null });

    kb.push({ keys: ['how are you', 'how\'s it going', 'how do you do', 'what\'s up', 'كيف حالك', 'comment ça va', 'cómo estás', 'ça va'], category: 'howareyou', data: null });

    kb.push({ keys: ['what can you', 'what do you', 'help me', 'your purpose', 'your job', 'why are you here', 'capabilities', 'features', 'ماذا تفعل'], category: 'capabilities', data: null });

    kb.push({ keys: ['price', 'cost', 'rate', 'charge', 'how much', 'budget', 'سعر', 'precio', 'tarif', 'combien', 'cuánto'], category: 'pricing', data: null });

    kb.push({ keys: ['when', 'timeline', 'how long', 'deadline', 'start', 'متى', 'cuándo', 'quand', 'available when'], category: 'timeline', data: null });

    kb.push({ keys: ['favorite', 'prefer', 'best', 'love', 'like most', 'مفضل', 'favorito', 'préféré', 'enjoy'], category: 'favorites', data: null });

    kb.push({ keys: ['how did you learn', 'self-taught', 'course', 'bootcamp', 'training', 'كيف تعلمت', 'cómo aprendiste', 'comment as-tu appris'], category: 'learning', data: null });

    kb.push({ keys: ['asp.net', '.net', 'c#', 'csharp'], category: 'skills', data: { category: 'Backend', items: 'C# / .NET / ASP.NET Core — Full-stack backend development with secure APIs' } });
    kb.push({ keys: ['react', 'frontend', 'front-end', 'next.js', 'nextjs'], category: 'skills', data: { category: 'Frontend', items: 'React.js, Next.js, HTML5, CSS3, Tailwind CSS, Bootstrap' } });
    kb.push({ keys: ['python', 'machine learning', 'ml', 'ai', 'artificial intelligence', 'tensorflow', 'deep learning', 'neural'], category: 'skills', data: { category: 'ML & AI', items: 'Python, TensorFlow, Keras, Deep Learning, Neural Networks, NLP, Data Analysis' } });
    kb.push({ keys: ['database', 'sql', 'mysql', 'postgres', 'mongodb', 'nosql', 'قاعدة بيانات'], category: 'skills', data: { category: 'Databases', items: 'PostgreSQL, MySQL, MongoDB' } });
    kb.push({ keys: ['docker', 'devops', 'deploy', 'cloud', 'aws', 'azure', 'vercel', 'netlify', 'ci/cd'], category: 'skills', data: { category: 'Tools & Cloud', items: 'Docker, Git & GitHub, Linux, AWS, Microsoft Azure, Vercel & Netlify' } });

    return kb;
}

const knowledgeBase = buildKnowledge();

function findBestMatch(input) {
    const q = input.toLowerCase().trim();
    const words = q.split(/\s+/);

    let bestMatch = null;
    let bestScore = 0;

    for (const entry of knowledgeBase) {
        let score = 0;
        for (const key of entry.keys) {
            if (q.includes(key)) {
                score += key.length * 3;
            }
            for (const word of words) {
                if (word.length < 2) continue;
                if (key.includes(word)) {
                    score += word.length * 2;
                }
                if (word.includes(key) && key.length >= 3) {
                    score += key.length;
                }
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    return { match: bestMatch, score: bestScore };
}

function getResponse(input, t, _language) {
    const q = input.toLowerCase().trim();
    const { match, score } = findBestMatch(q);

    if (!match || score < 3) {
        return generateSmartFallback(q, t);
    }

    switch (match.category) {
        case 'greeting':
            return t('chatbot.greeting');

        case 'thanks':
            return t('chatbot.thanks');

        case 'goodbye':
            return t('chatbot.goodbye');

        case 'howareyou':
            return t('chatbot.howareyou');

        case 'fun':
            return t('chatbot.fun');

        case 'capabilities':
            return t('chatbot.capabilities');

        case 'about':
            return `${t('chatbot.aboutIntro')} ${profile.name} — ${profile.title}. ${profile.subtitle}`;

        case 'summary':
            return profile.summary;

        case 'skills':
            if (match.data?.category) {
                return `**${match.data.category}:** ${match.data.items}`;
            }
            return t('chatbot.skillsIntro') + ' ' + skills.map(c => c.category).join(', ') + '.';

        case 'allSkills': {
            const cats = skills.map(c => `• ${c.category}: ${c.items.map(i => i.title).join(', ')}`).join('\n');
            return `${t('chatbot.skillsIntro')}\n${cats}`;
        }

        case 'competencies':
            return `${t('chatbot.competenciesIntro')} ${coreCompetencies.join(', ')}.`;

        case 'project':
            if (match.data?.title) {
                return `📦 **${match.data.title}**: ${match.data.description}\n🛠️ Tech: ${match.data.tech.join(', ')}${match.data.link && match.data.link !== '#' ? `\n🔗 ${match.data.link}` : ''}`;
            }
            break;

        case 'allProjects': {
            const real = projects.filter(p => p.type === 'project');
            return `${t('chatbot.projectsIntro')} ${real.map(p => `• ${p.title}`).join(', ')}.`;
        }

        case 'experience':
            if (match.data?.company) {
                return `💼 **${match.data.company}** — ${match.data.role} (${match.data.period})\n📍 ${match.data.location}\n${match.data.summary}`;
            }
            break;

        case 'allExperience': {
            const exp = experience.map(e => `• ${e.company} — ${e.role} (${e.period})`).join('\n');
            return `${t('chatbot.experienceIntro')}\n${exp}`;
        }

        case 'education': {
            const edu = education.map(e => `• ${e.text} (${e.period})`).join('\n');
            return `${t('chatbot.educationIntro')}\n${edu}`;
        }

        case 'contact':
            return `${t('chatbot.contactIntro')} ✉️ ${contactInfo.email} | 📞 ${contactInfo.phone} | 💼 LinkedIn: ${contactInfo.linkedin}`;

        case 'services': {
            const svc = services.map(s => `• ${s.title}: ${s.text}`).join('\n');
            return `${t('chatbot.servicesIntro')}\n${svc}`;
        }

        case 'location':
            return t('chatbot.location');

        case 'hire':
            return t('chatbot.hire');

        case 'languages':
            return t('chatbot.languages');

        case 'cv':
            return t('chatbot.cv');

        case 'certifications': {
            const certs = certifications.flatMap(cat =>
                cat.items.map(c => `• ${c.name} (${cat.category}) — ${c.issued}`)
            ).join('\n');
            return `${t('chatbot.certificationsIntro')}\n${certs}`;
        }

        case 'testimonials': {
            const test = testimonials.map(t => `⭐ "${t.quote}" — ${t.author}`).join('\n\n');
            return `${t('chatbot.testimonialsIntro')}\n\n${test}`;
        }

        case 'age':
            return t('chatbot.age');

        case 'social':
            return `${t('chatbot.socialIntro')}\n🔗 GitHub: ${profile.social.github}\n💼 LinkedIn: ${profile.social.linkedin}\n🐦 Twitter: ${profile.social.twitter}\n📸 Instagram: ${profile.social.instagram}`;

        case 'pricing':
            return t('chatbot.pricing');

        case 'timeline':
            return t('chatbot.timeline');

        case 'favorites':
            return t('chatbot.favorites');

        case 'learning':
            return t('chatbot.learning');

        default:
            return generateSmartFallback(q, t);
    }

    return generateSmartFallback(q, t);
}

function generateSmartFallback(q, t) {
    const isQuestion = /\?|^(what|who|how|where|when|why|can|do|does|is|are|will|would|should|could|tell|show|list|explain|describe|ما|من|كيف|أين|هل|لماذا|qué|quién|cómo|dónde|est-ce|quel|pourquoi|comment)/.test(q);

    const isConversational = /^(i |my |we |our |please|can you|could you|i'm|i am|i need|i want|looking for|help me|yo |أنا|أريد|je |j'|necesito|quiero)/.test(q);

    if (isQuestion) {
        return t('chatbot.smartQuestion');
    }

    if (isConversational) {
        return t('chatbot.smartConversational');
    }

    return t('chatbot.smartDefault');
}

function getQuickQuestions(t) {
    return [
        t('chatbot.quickSkills'),
        t('chatbot.quickProjects'),
        t('chatbot.quickContact'),
        t('chatbot.quickAbout'),
    ];
}

function getRandomDelay() {
    return 400 + Math.floor(Math.random() * 600);
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

    // Initialize welcome message when chat first opens
    const ensureWelcome = () => {
        if (!welcomeSent.current) {
            welcomeSent.current = true;
            setMessages([{ role: 'bot', text: t('chatbot.welcome') }]);
        }
    };

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const send = (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed) return;

        const userMsg = { role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setShowQuick(false);
        setIsTyping(true);

        const delay = getRandomDelay();
        setTimeout(() => {
            const botResponse = getResponse(trimmed, t, language);
            const botMsg = { role: 'bot', text: botResponse };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, delay);
    };

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
