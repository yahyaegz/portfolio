import React, { Suspense, lazy, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import ScrollProgress from './components/ScrollProgress';
import Hero from './components/Hero';
import SkeletonLoader from './components/SkeletonLoader';
import ParticleField from './components/ParticleField';
import BackToTop from './components/BackToTop';
import Chatbot from './components/Chatbot';
import IntroSequence from './components/IntroSequence';
import ScrollWarpDivider from './components/ScrollWarpDivider';

const Services = lazy(() => import('./components/Services'));
const Skills = lazy(() => import('./components/Skills'));
const Projects = lazy(() => import('./components/Projects'));
const Education = lazy(() => import('./components/Education'));
const Experience = lazy(() => import('./components/Experience'));
const Certifications = lazy(() => import('./components/Certifications'));
const CallToAction = lazy(() => import('./components/CallToAction'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));

export default function App() {
    const [introDone, setIntroDone] = useState(
        () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('intro-played') === '1'
    );

    return (
        <div className="section-dark min-h-screen flex flex-col overflow-x-hidden w-full relative">
            <IntroSequence onComplete={() => setIntroDone(true)} />

            <ParticleField />

            <a
                href="#home"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-black focus:font-semibold"
            >
                Skip to content
            </a>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
            />

            <ScrollProgress />
            <BackToTop />
            <Chatbot />
            <Header />
            <main className="flex-grow relative z-10">
                <Hero />
                <Suspense fallback={<SkeletonLoader />}>
                    <ScrollWarpDivider />
                    <Services />
                    <ScrollWarpDivider flip />
                    <Skills />
                    <ScrollWarpDivider />
                    <Projects />
                    <ScrollWarpDivider flip />
                    <Education />
                    <ScrollWarpDivider />
                    <Experience />
                    <ScrollWarpDivider flip />
                    <Certifications />
                    <ScrollWarpDivider />
                    <CallToAction />
                    <ScrollWarpDivider flip />
                    <Contact />
                </Suspense>
            </main>
            <Suspense fallback={null}>
                <Footer />
            </Suspense>
        </div>
    );
}