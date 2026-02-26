import { useState, useEffect } from 'react';

export default function useActiveSection(sectionIds) {
    const [active, setActive] = useState(sectionIds[0] || '');

    useEffect(() => {
        const observers = [];
        const handleIntersect = (id) => (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActive(id);
                }
            });
        };

        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const observer = new IntersectionObserver(handleIntersect(id), {
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0,
            });
            observer.observe(el);
            observers.push(observer);
        });

        return () => observers.forEach((o) => o.disconnect());
    }, [sectionIds]);

    return active;
}

