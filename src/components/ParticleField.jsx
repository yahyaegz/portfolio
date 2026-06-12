import React, { useRef, useEffect } from 'react';

export default function ParticleField() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        let animId;
        let scrollY = window.scrollY;
        const particles = [];
        const count = window.innerWidth < 768 ? 35 : 60;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.3 + 0.1,
                parallax: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.4 + 0.1,
            });
        }

        const onScroll = () => { scrollY = window.scrollY; };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', resize);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.y -= p.speed;
                if (p.y < -10) {
                    p.y = canvas.height + 10;
                    p.x = Math.random() * canvas.width;
                }
                const offsetY = scrollY * p.parallax * 0.05;
                ctx.beginPath();
                ctx.arc(p.x, p.y - (offsetY % canvas.height), p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
                ctx.fill();
            }
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            aria-hidden="true"
        />
    );
}

