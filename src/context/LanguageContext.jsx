import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const htmlElement = document.documentElement;
        htmlElement.lang = language;
        htmlElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.body.style.direction = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => {
            if (prev === 'en') return 'ar';
            if (prev === 'ar') return 'fr';
            if (prev === 'fr') return 'es';
            return 'en';
        });
    };

    const getLanguageName = () => {
        const lang = LANGUAGES.find(l => l.code === language);
        return lang ? lang.label : 'English';
    };

    const getLanguageCode = () => language.toUpperCase();

    const t = (path) => {
        const keys = path.split('.');

        let value = translations[language];
        for (const key of keys) {
            if (value != null && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                value = undefined;
                break;
            }
        }
        if (value !== undefined) return value;

        let fallback = translations.en;
        for (const key of keys) {
            if (fallback != null && typeof fallback === 'object' && key in fallback) {
                fallback = fallback[key];
            } else {
                return path;
            }
        }
        return fallback;
    };

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            toggleLanguage,
            getLanguageName,
            getLanguageCode,
            t
        }}>
            {children}
        </LanguageContext.Provider>
    );
};
