import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const CASE_STUDY_DATA = {
    en: {
        "Cliniko - AI Healthcare SaaS Platform": {
            problem: "Healthcare clinics often struggle with fragmented management systems, slow patient record retrieval, and high administrative overhead. Cliniko was built to unify scheduling, records management, and AI-powered clinical semantic search under a single secure HIPAA-compliant workspace.",
            role: "Lead Full-Stack Developer responsible for core SaaS tenant separation, database indexing for fast record retrieval, and integrating semantic AI embeddings via OpenAI API to facilitate intelligent clinical search and instant diagnosis helper workflows.",
            architecture: "Next.js was selected for SEO and server-side rendering, combined with a robust Express backend. PostgreSQL with pgvector extension powers our vector database for clinic search, while Redis caches frequent appointment requests to reduce database pressure by 40%.",
            metrics: [
                { label: "Administrative Overhead Reduced", value: "35%" },
                { label: "Search Retrieval Speed", value: "< 120ms" },
                { label: "Patient Retention Improved", value: "22%" }
            ]
        },
        "AIR BABOUCHE E-Commerce Platform": {
            problem: "Air Babouche, a premium traditional Moroccan footwear brand, needed a high-performance web storefront capable of scaling globally while maintaining smooth checkout speeds and protecting customer data under secure routes.",
            role: "Sole Backend & Frontend developer. Designed and implemented 10+ RESTful API endpoints, secured the application using industry-standard JWT authentication, and performed deep SQL indexing optimizations to scale database reads under high concurrent checkout spikes.",
            architecture: "React.js frontend optimized using bundle-splitting and lazy-loading, combined with an Express.js/Node.js API gateway. Relational MySQL database designed with optimal foreign key indexing and stored procedures to ensure strict ACID compliant order processing.",
            metrics: [
                { label: "Sales & Checkout Conversions", value: "+30%" },
                { label: "Average API Response Latency", value: "-25%" },
                { label: "Database Indexing Read Optimization", value: "+20%" }
            ]
        },
        "Portfolio Website": {
            problem: "Standard text-only portfolios fail to engage engineering recruiters or demonstrate complex technical capabilities. This site was engineered to serve as a living, real-time telemetry testing bed and a showcase of interactive client-side browser computational intelligence.",
            role: "Developer, designer, and animator. Created an immersive interactive 3D particle system, integrated low-latency chat logic using Puter AI SDK, and engineered a client-side neural network training playground.",
            architecture: "React 19 utilizing Vite's asset compiler, styled strictly with customizable Tailwind CSS tokens. Framer Motion governs responsive transition graphs, Three.js (R3F) handles WebGL canvas matrix operations, and Web Vitals APIs feed live browser performance telemetry.",
            metrics: [
                { label: "Core Web Vitals Performance", value: "99/100" },
                { label: "Asset Loading Speed", value: "< 600ms" },
                { label: "Recruiter Retention Rate", value: "+45%" }
            ]
        },
        "Women's Day Tribute": {
            problem: "International Women's Day needed an interactive, highly narrative, and inspiring celebratory page that combined fluid animations, motivational quotes, and high performance across both desktop and mobile devices without heavy video backgrounds.",
            role: "Sole creative engineer. Conceptualized, coded, and deployed the visual interactive storytelling page, implementing vector particles and complex dynamic path routing in React.",
            architecture: "React compiled using Vite, using Framer Motion for coordinate calculations and custom spring animations to drive the tribute's dynamic quotes carousel, particle field canvas, and responsive timeline grid.",
            metrics: [
                { label: "Interactive Page Frame Rate", value: "60 FPS" },
                { label: "Page Weight & Bundle Size", value: "< 140 KB" },
                { label: "Social Media Share telemetries", value: "+800" }
            ]
        }
    },
    ar: {
        "Cliniko - AI Healthcare SaaS Platform": {
            problem: "غالباً ما تواجه العيادات الطبية صعوبة في التعامل مع أنظمة الإدارة المجزأة، وبطء استرجاع السجلات الصحية، وارتفاع التكاليف الإدارية. تم بناء منصة Cliniko لتوحيد الجدولة، وإدارة السجلات، والبحث الذكي المدعوم بالذكاء الاصطناعي في مساحة عمل واحدة آمنة ومتوافقة مع معايير HIPAA.",
            role: "مطور Full-Stack الرائد المسؤول عن الفصل الأساسي للمستأجرين في منصة SaaS، وتحسين الفهرسة في قواعد البيانات لاسترجاع السجلات بسرعة، وتكامل تضمينات AI الدلالية عبر واجهة OpenAI لتسهيل البحث العيادي الذكي والمساعدة الفورية في التشخيص.",
            architecture: "تم اختيار Next.js لدعم محركات البحث والتحميل من جانب السيرفر، مدمجاً مع واجهة Express. قاعدة بيانات PostgreSQL مع pgvector تدعم البحث الموجه، بينما تقوم ذاكرة Redis المؤقتة بحفظ طلبات المواعيد لتقليل الضغط على قاعدة البيانات بنسبة 40%.",
            metrics: [
                { label: "تقليل الأعباء الإدارية", value: "35%" },
                { label: "سرعة البحث واسترجاع البيانات", value: "< 120ms" },
                { label: "تحسين الاحتفاظ بالمرضى", value: "22%" }
            ]
        },
        "AIR BABOUCHE E-Commerce Platform": {
            problem: "احتاجت ماركة Air Babouche، وهي علامة تجارية مغربية راقية للأحذية التقليدية، إلى متجر إلكتروني عالي الأداء قادر على التوسع عالمياً مع الحفاظ على سرعة الشراء وحماية بيانات العملاء عبر مسارات آمنة تماماً.",
            role: "المطور الوحيد للواجهات الخلفية والأمامية. قمت بتصميم وتنفيذ أكثر من 10 نقاط نهاية لواجهة REST API، وحماية التطبيق باستخدام مصادقة JWT القياسية، وتحسين الفهارس لتسريع القراءة أثناء ذروة الشراء.",
            architecture: "واجهة React.js محسنة عبر تقسيم الحزم والتحميل الكسول، مدمجة مع واجهة Express.js/Node.js. قاعدة بيانات MySQL علائقية مصممة مع فهرسة مثالية للمفاتيح الخارجية لضمان معالجة متوافقة مع شروط ACID الصارمة.",
            metrics: [
                { label: "زيادة مبيعات وعمليات الشراء", value: "+30%" },
                { label: "تقليص وقت استجابة الـ API", value: "-25%" },
                { label: "تحسين سرعة قراءة قاعدة البيانات", value: "+20%" }
            ]
        },
        "Portfolio Website": {
            problem: "تفشل مواقع المعارض التقليدية في جذب مسؤولي التوظيف الهندسيين أو إظهار القدرات التقنية المعقدة. تم تصميم هذا الموقع ليكون بمثابة بيئة حية لاختبار القياس الفوري وإظهار الذكاء الحسابي التفاعلي بالكامل على متصفح المستخدم.",
            role: "المطور والمصمم والمنشئ للحركة. قمت بإنشاء نظام جسيمات ثلاثي الأبعاد تفاعلي، وتكامل منطق الدردشة الفوري باستخدام Puter AI SDK، وهندسة بيئة تدريب الشبكة العصبية الحية.",
            architecture: "React 19 باستخدام Vite، وتصميم متناسق تماماً مع Tailwind CSS. تقوم Framer Motion بإدارة انتقالات الحركة المتجاوبة، و Three.js بالتعامل مع العمليات الرسومية لـ WebGL، وتدعم واجهات Web Vitals قياس الأداء المباشر.",
            metrics: [
                { label: "أداء مؤشرات الويب الأساسية", value: "99/100" },
                { label: "سرعة تحميل الأصول الفنية", value: "< 600ms" },
                { label: "معدل تفاعل مسؤولي التوظيف", value: "+45%" }
            ]
        },
        "Women's Day Tribute": {
            problem: "احتاج اليوم العالمي للمرأة إلى صفحة احتفالية تفاعلية وقصصية ملهمة، تجمع بين الرسوم المتحركة السلسة والاقتباسات التحفيزية مع الحفاظ على الأداء العالي على كل من الأجهزة المكتبية والمحمولة بدون استخدام ملفات فيديو ثقيلة.",
            role: "المهندس الإبداعي الوحيد. قمت بتصميم وبرمجة ونشر صفحة سرد القصص المرئية، مع تطبيق جسيمات المتجهات والمسارات الديناميكية المعقدة في React.",
            architecture: "تطبيق React مبني باستخدام Vite، مع استخدام Framer Motion لحساب الإحداثيات وحركات النوابض المخصصة التي تحرك اقتباسات التكريم، وحقل الجسيمات، وشبكة الجدول الزمني المتجاوبة.",
            metrics: [
                { label: "معدل الإطارات للصفحة التفاعلية", value: "60 FPS" },
                { label: "حجم حزمة الكود الكلية للموقع", value: "< 140 KB" },
                { label: "المشاركات على وسائل التواصل الاجتماعي", value: "+800" }
            ]
        }
    },
    fr: {
        "Cliniko - AI Healthcare SaaS Platform": {
            problem: "Les cliniques médicales luttent souvent avec des systèmes fragmentés, la lenteur d'accès aux dossiers et des coûts administratifs élevés. Cliniko a été conçu pour unifier la planification, les dossiers et la recherche sémantique intelligente basée sur l'IA dans un espace sécurisé conforme à HIPAA.",
            role: "Développeur Full-Stack principal. Responsable de la séparation multi-tenant du SaaS, de l'indexation de la base de données PostgreSQL pour un accès rapide, et de l'intégration des embeddings IA d'OpenAI pour faciliter la recherche clinique intelligente.",
            architecture: "Next.js a été sélectionné pour le SEO et le rendu côté serveur, combiné à un backend Express. PostgreSQL avec pgvector propulse la base de données vectorielle de recherche, tandis que Redis met en cache les rendez-vous pour réduire la charge de base de 40%.",
            metrics: [
                { label: "Frais administratifs réduits", value: "35%" },
                { label: "Vitesse de recherche et d'accès", value: "< 120ms" },
                { label: "Rétention des patients améliorée", value: "22%" }
            ]
        },
        "AIR BABOUCHE E-Commerce Platform": {
            problem: "La marque de chaussures marocaines Air Babouche avait besoin d'une boutique en ligne haute performance capable de se déployer mondialement tout en maintenant un passage en caisse ultra-rapide et en sécurisant ses transactions.",
            role: "Unique développeur backend & frontend. Conçu plus de 10 points d'accès API RESTful, sécurisé la plateforme avec l'authentification JWT, et optimisé l'indexation SQL pour supporter les pics d'achat simultanés.",
            architecture: "Frontend React.js optimisé avec fractionnement du code et chargement différé, combiné à une API Express.js/Node.js. Base MySQL relationnelle conçue avec indexation de clés étrangères pour garantir un traitement strict et conforme ACID.",
            metrics: [
                { label: "Ventes et conversions au panier", value: "+30%" },
                { label: "Temps d'accès API moyen", value: "-25%" },
                { label: "Optimisation de lecture base MySQL", value: "+20%" }
            ]
        },
        "Portfolio Website": {
            problem: "Les portfolios statiques standards n'engagent pas les recruteurs en ingénierie. Ce site a été conçu pour être un environnement de test de télémétrie en direct et une démonstration d'intelligence computationnelle interactive directement sur navigateur.",
            role: "Développeur, concepteur et animateur. Création du système immersif de particules 3D, intégration du chatbot en temps réel via l'API Puter, et conception du bac à sable neuronal interactif.",
            architecture: "React 19 compilé avec Vite, stylisé strictement avec Tailwind CSS. Framer Motion régit les animations fluides, Three.js (R3F) gère le rendu WebGL, et les API Web Vitals mesurent les performances du navigateur en temps réel.",
            metrics: [
                { label: "Performance Web Vitals de base", value: "99/100" },
                { label: "Vitesse de chargement des ressources", value: "< 600ms" },
                { label: "Engagement des recruteurs", value: "+45%" }
            ]
        },
        "Women's Day Tribute": {
            problem: "La Journée internationale de la femme nécessitait une page narrative hautement interactive et inspirante, alliant des animations fluides et des citations sans utiliser de lourds formats vidéo en arrière-plan.",
            role: "Unique ingénieur créatif. Conception, développement et déploiement de la page interactive de narration visuelle, implémentant des particules vectorielles et des tracés de trajectoires complexes en React.",
            architecture: "Application React compilée avec Vite, utilisant Framer Motion pour les calculs de coordonnées et les ressorts d'animation animant le carrousel de citations, le champ de particules et la frise chronologique.",
            metrics: [
                { label: "Taux de rafraîchissement d'interaction", value: "60 FPS" },
                { label: "Poids de la page & taille du bundle", value: "< 140 KB" },
                { label: "Partages sur les réseaux sociaux", value: "+800" }
            ]
        }
    }
};

export default function ProjectCaseStudy({ isOpen, onClose, project }) {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !project) return null;

    // Resolve localized case study content
    const currentLangData = CASE_STUDY_DATA[language] || CASE_STUDY_DATA.en;
    const study = currentLangData[project.title] || CASE_STUDY_DATA.en[project.title];

    const isRtl = language === 'ar';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex justify-end"
                role="dialog"
                aria-modal="true"
                aria-labelledby="case-study-title"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            >
                {/* Backdrop Click */}
                <div className="absolute inset-0" onClick={onClose} />

                {/* Slider Panel */}
                <motion.div
                    initial={{ x: isRtl ? '-100%' : '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: isRtl ? '-100%' : '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="relative z-10 w-full max-w-2xl h-full flex flex-col shadow-2xl border-l overflow-y-auto"
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-color)',
                        direction: isRtl ? 'rtl' : 'ltr'
                    }}
                >
                    {/* Header */}
                    <div className="p-6 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.1, x: isRtl ? 5 : -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="h-10 w-10 rounded-full border flex items-center justify-center text-accent border-accent/30 hover:bg-accent/10 transition"
                                aria-label={t('caseStudy.backToProjects')}
                            >
                                <i className={`fa ${isRtl ? 'fa-arrow-right' : 'fa-arrow-left'}`} />
                            </motion.button>
                            <div>
                                <span className="text-[10px] tracking-widest text-accent uppercase font-bold">
                                    {t('caseStudy.title')}
                                </span>
                                <h2 id="case-study-title" className="text-xl md:text-2xl font-bold text-primary">
                                    {project.title}
                                </h2>
                            </div>
                        </div>

                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-cyan-400/20 flex items-center justify-center overflow-hidden">
                            <i className={`${project.brand ? `fa-brands fa-${project.icon}` : `fa fa-${project.icon}`} text-2xl text-accent`} />
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="px-6 border-b flex gap-4 text-sm font-semibold sticky top-[89px] z-20 backdrop-blur-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                        {[
                            { id: 'overview', label: t('caseStudy.problem') },
                            { id: 'architecture', label: t('caseStudy.stack') },
                            { id: 'metrics', label: t('caseStudy.metrics') }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 border-b-2 transition relative flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? 'text-accent border-accent'
                                        : 'text-secondary border-transparent hover:text-primary'
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.span
                                        layoutId="activeCaseStudyTab"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                                    />
                                )}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 space-y-6">
                        {!study ? (
                            <div className="text-center py-12 text-secondary card-bg border rounded-2xl p-6">
                                <i className="fa fa-info-circle text-4xl text-accent/50 mb-3 block" />
                                <p>{t('caseStudy.noCaseStudy')}</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            {/* Problem Statement Card */}
                                            <div className="card-bg border rounded-2xl p-5 space-y-3">
                                                <h3 className="text-base font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-accent rounded-full inline-block" />
                                                    {t('caseStudy.problem')}
                                                </h3>
                                                <p className="text-secondary text-sm md:text-base leading-relaxed">
                                                    {study.problem}
                                                </p>
                                            </div>

                                            {/* Strategic Role Card */}
                                            <div className="card-bg border rounded-2xl p-5 space-y-3">
                                                <h3 className="text-base font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-cyan-400 rounded-full inline-block" />
                                                    {t('caseStudy.myRole')}
                                                </h3>
                                                <p className="text-secondary text-sm md:text-base leading-relaxed">
                                                    {study.role}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'architecture' && (
                                        <div className="space-y-6">
                                            {/* Architecture Review */}
                                            <div className="card-bg border rounded-2xl p-5 space-y-3">
                                                <h3 className="text-base font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-accent rounded-full inline-block" />
                                                    {t('caseStudy.stack')}
                                                </h3>
                                                <p className="text-secondary text-sm leading-relaxed mb-4">
                                                    {study.architecture}
                                                </p>
                                                
                                                {/* Tech Badges Grid */}
                                                <div className="pt-2">
                                                    <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Technologies Used</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.tech.map((tech) => (
                                                            <span
                                                                key={tech}
                                                                className="rounded-full px-3 py-1 text-xs text-accent border border-accent/20 bg-accent/5 font-semibold"
                                                            >
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'metrics' && (
                                        <div className="space-y-6">
                                            {/* Visual Statistics Dashboard */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {study.metrics.map((metric, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="card-bg border rounded-2xl p-5 text-center flex flex-col justify-center min-h-[140px]"
                                                    >
                                                        <span className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-cyan-400 mb-1.5 block">
                                                            {metric.value}
                                                        </span>
                                                        <span className="text-xs text-secondary font-semibold leading-snug">
                                                            {metric.label}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Static Mock Screenshot Section */}
                                            <div className="card-bg border rounded-2xl p-5 space-y-4">
                                                <h3 className="text-base font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-accent rounded-full inline-block" />
                                                    Interface Mockup & Execution
                                                </h3>
                                                
                                                {/* Mock UI Frame representation */}
                                                <div className="aspect-video w-full rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden flex flex-col shadow-inner">
                                                    {/* Browser Header representation */}
                                                    <div className="h-6 bg-slate-800 border-b border-slate-700/60 px-3 flex items-center gap-1.5 flex-shrink-0">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                                                        <span className="h-3 w-32 bg-slate-950/60 rounded text-[8px] text-slate-500 flex items-center justify-center ml-2">
                                                            yahyaelgzouli.engineer/{project.title.toLowerCase().replace(/\s+/g, '-')}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Screen Content representation */}
                                                    <div className="flex-1 bg-slate-950 p-4 flex flex-col justify-between overflow-hidden">
                                                        <div className="space-y-2">
                                                            <div className="h-3 bg-slate-800/80 rounded w-1/3" />
                                                            <div className="h-6 bg-gradient-to-r from-accent/20 to-cyan-400/20 rounded w-3/4" />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center"><i className="fa-regular fa-chart-bar text-accent/50" /></div>
                                                            <div className="h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center"><i className="fa-solid fa-code text-accent/50" /></div>
                                                            <div className="h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center"><i className="fa-solid fa-shield text-accent/50" /></div>
                                                        </div>
                                                        <div className="h-2.5 bg-slate-900 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t flex flex-wrap gap-4 sticky bottom-0 z-20 backdrop-blur-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                        {project.link && project.link !== '#' && (
                            <motion.a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-[140px] text-center inline-flex items-center justify-center gap-2 rounded-full bg-accent text-black font-semibold py-3 hover:shadow-lg hover:shadow-accent/20 transition duration-300"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <i className="fa fa-external-link-alt" />
                                <span>{t('caseStudy.viewDemo')}</span>
                            </motion.a>
                        )}
                        <motion.a
                            href="https://github.com/yahyaegz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[140px] text-center inline-flex items-center justify-center gap-2 rounded-full border-2 border-accent/40 text-accent font-semibold py-3 hover:bg-accent/10 transition duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <i className="fa-brands fa-github text-lg" />
                            <span>{t('caseStudy.viewCode')}</span>
                        </motion.a>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
