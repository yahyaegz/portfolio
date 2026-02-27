import React, { Suspense, lazy, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import SkeletonLoader from './components/SkeletonLoader';

const Header = lazy(() => import('./components/Header'));
const ScrollProgress = lazy(() => import('./components/ScrollProgress'));
const Hero = lazy(() => import('./components/Hero'));
const ParticleField = lazy(() => import('./components/ParticleField'));
const BackToTop = lazy(() => import('./components/BackToTop'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const IntroSequence = lazy(() => import('./components/IntroSequence'));
const ScrollWarpDivider = lazy(() => import('./components/ScrollWarpDivider'));
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
            <Suspense fallback={null}>
                <IntroSequence onComplete={() => setIntroDone(true)} />
            </Suspense>

            <Suspense fallback={null}>
                <ParticleField />
            </Suspense>

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

            <Suspense fallback={null}>
                <ScrollProgress />
                <BackToTop />
                <Chatbot />
            </Suspense>
            <Suspense fallback={<SkeletonLoader />}>
                <Header />
            </Suspense>
            <main className="flex-grow relative z-10">
                <Suspense fallback={<SkeletonLoader />}>
                    <Hero />
                </Suspense>
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
            <Analytics />
        </div>
    );
}