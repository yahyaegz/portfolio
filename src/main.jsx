import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

if (typeof window !== 'undefined') {
    window.PUTER_QUIET = true;
    window.puter = window.puter || {};
    window.puter.quiet = true;
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <LanguageProvider>
                <App />
            </LanguageProvider>
        </ThemeProvider>
    </React.StrictMode>,
);
