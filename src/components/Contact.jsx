import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { contactInfo } from '../data';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';
import { slideRight } from '../utils/animationVariants';

export default function Contact() {
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async e => {
        e.preventDefault();
        const form = new FormData(e.target);
        const payload = Object.fromEntries(form.entries());

        setLoading(true);
        const toastId = toast.loading(t('contact.sending'));

        // Add Web3Forms access key
        const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
        
        if (!accessKey) {
            toast.error('Web3Forms Access Key is missing. Please check your .env file.', { id: toastId });
            setLoading(false);
            return;
        }

        payload.access_key = accessKey;
        payload.from_name = payload.name;
        payload.subject = payload.subject || `New message from ${payload.name}`;

        try {
            const response = await axios.post('https://api.web3forms.com/submit', payload, {
                timeout: 10000,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response?.data?.success) {
                toast.success(t('contact.successMessage'), { id: toastId });
                e.target.reset();
            } else {
                toast.error(response?.data?.message || 'Unexpected response', { id: toastId });
            }
        } catch (error) {
            let errorMsg = t('contact.errorMessage');

            if (error.response?.status === 400) {
                const errors = error.response.data.errors;
                errorMsg = errors?.[0]?.msg || error.response.data.message || errorMsg;
            } else if (error.response?.status === 429) {
                errorMsg = t('contact.rateLimitError') || 'Too many requests. Please try again later.';
            } else if (error.code === 'ECONNABORTED') {
                errorMsg = t('contact.timeoutError');
            } else if (error.message === 'Network Error') {
                errorMsg = t('contact.networkError');
            }

            toast.error(errorMsg, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="section-alt" aria-labelledby="contact-heading">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
                <motion.div
                    className="text-center mb-8 md:mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={slideRight}
                >
                    <h1 id="contact-heading" className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 md:mb-4"><SplitTextReveal>{t('contact.title')}</SplitTextReveal> <span className="text-accent accent-glow-text"><SplitTextReveal stagger={0.06}>{t('contact.titleSpan')}</SplitTextReveal></span></h1>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2">{t('contact.subtitle')}</p>
                </motion.div>

                <motion.div
                    className="grid gap-6 sm:gap-8 md:gap-12 grid-cols-1 md:grid-cols-3 mb-8 md:mb-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ staggerChildren: 0.2 }}
                >
                    {[
                        { icon: 'fa-envelope', title: t('contact.email'), value: contactInfo.email, href: `mailto:${contactInfo.email}`, brand: false },
                        { icon: 'fa-phone', title: t('contact.phone'), value: contactInfo.phone, href: `tel:${contactInfo.phone.replace(/\s/g, '')}`, brand: false },
                        { icon: 'linkedin', title: t('contact.linkedin'), value: t('contact.connectLinkedin'), href: contactInfo.linkedin, target: '_blank', brand: true },
                    ].map((item, idx) => (
                        <motion.a
                            key={idx}
                            href={item.href}
                            target={item.target}
                            rel="noopener noreferrer"
                            className="rounded-xl card-bg border p-6 shadow-lg text-center transition-all hover:shadow-xl hover:-translate-y-1"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.05 }}
                            viewport={{ once: true }}
                        >
                            <motion.div className="text-3xl text-accent mb-3" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                                <i className={item.brand ? `fa-brands fa-${item.icon}` : `fa ${item.icon}`} />
                            </motion.div>
                            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                            <p className="text-secondary hover:text-accent transition">{item.value}</p>
                        </motion.a>
                    ))}
                </motion.div>

                <motion.div
                    className="rounded-xl card-bg border backdrop-blur p-8 shadow-lg"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6 text-center">{t('contact.sendMessage')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
                            <label htmlFor="website">Website</label>
                            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
                        </div>
                        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
                            <motion.input
                                name="name"
                                placeholder={t('contact.name')}
                                required
                                minLength={2}
                                maxLength={100}
                                className="rounded-lg input-bg border px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
                                whileFocus={{ scale: 1.02 }}
                            />
                            <motion.input
                                name="email"
                                type="email"
                                placeholder={t('contact.emailPlaceholder')}
                                required
                                maxLength={254}
                                className="rounded-lg input-bg border px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
                                whileFocus={{ scale: 1.02 }}
                            />
                        </div>
                        <motion.input
                            name="subject"
                            placeholder={t('contact.subject')}
                            maxLength={200}
                            className="w-full rounded-lg input-bg border px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
                            whileFocus={{ scale: 1.02 }}
                        />
                        <motion.textarea
                            name="message"
                            rows="5"
                            placeholder={t('contact.message')}
                            required
                            minLength={10}
                            maxLength={5000}
                            className="w-full rounded-lg input-bg border px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition resize-none"
                            whileFocus={{ scale: 1.02 }}
                        />
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className={`w-full rounded-full border-2 border-accent px-6 py-3 font-semibold text-accent hover:bg-accent hover:text-black transition duration-300 disabled:opacity-50`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? t('contact.sending') : t('contact.send')}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </section>
    );
}