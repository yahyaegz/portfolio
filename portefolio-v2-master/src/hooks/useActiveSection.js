import { useState, useEffect, useRef } from 'react';

export default function useActiveSection(sectionIds) {
    const [active, setActive] = useState(sectionIds[0] || '');
    const observersRef = useRef([]);

    useEffect(() => {
        const observerOptions = {
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0,
        };

        const handleIntersect = (id) => (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActive(id);
                }
            });
        };

        const observeSection = (id) => {
            const el = document.getElementById(id);
            if (!el) return false;
            const observer = new IntersectionObserver(handleIntersect(id), observerOptions);
            observer.observe(el);
            observersRef.current.push(observer);
            return true;
        };

        // Track which sections still need observing
        const pending = new Set(sectionIds);

        // Try to observe all sections immediately
        for (const id of sectionIds) {
            if (observeSection(id)) pending.delete(id);
        }

        // Watch for lazy-loaded sections appearing in the DOM
        let mutationObserver;
        if (pending.size > 0) {
            mutationObserver = new MutationObserver(() => {
                for (const id of [...pending]) {
                    if (observeSection(id)) pending.delete(id);
                }
                if (pending.size === 0) mutationObserver.disconnect();
            });
            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }

        return () => {
            observersRef.current.forEach((o) => o.disconnect());
            observersRef.current = [];
            if (mutationObserver) mutationObserver.disconnect();
        };
    }, [sectionIds]);

    return active;
}

