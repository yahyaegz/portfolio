import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplitTextReveal from './SplitTextReveal';

// ─── Colour Palettes ──────────────────────────────────────────────────────────
const PALETTES = {
    emerald:  ['#10b981','#34d399','#6ee7b7','#a7f3d0','#064e3b'],
    cyan:     ['#06b6d4','#22d3ee','#67e8f9','#a5f3fc','#164e63'],
    sunset:   ['#f97316','#fb923c','#fbbf24','#f43f5e','#7c2d12'],
    purple:   ['#8b5cf6','#a78bfa','#c4b5fd','#ec4899','#4c1d95'],
};

// ─── Value Noise helper ───────────────────────────────────────────────────────
function buildNoiseGrid(size = 64) {
    const grid = [];
    for (let y = 0; y < size; y++) {
        grid.push([]);
        for (let x = 0; x < size; x++) {
            grid[y].push(Math.random() * Math.PI * 2);
        }
    }
    // 3-pass box blur to smooth the field
    for (let pass = 0; pass < 3; pass++) {
        const next = grid.map(row => [...row]);
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                let sum = 0;
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += grid[y+dy][x+dx];
                next[y][x] = sum / 9;
            }
        }
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) grid[y][x] = next[y][x];
    }
    return grid;
}

function sampleNoise(grid, nx, ny) {
    const size = grid.length;
    const gx = ((nx % 1 + 1) % 1) * (size - 1);
    const gy = ((ny % 1 + 1) % 1) * (size - 1);
    const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, size - 1);
    const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, size - 1);
    const tx = gx - x0, ty = gy - y0;
    const top = grid[y0][x0] * (1 - tx) + grid[y0][x1] * tx;
    const bot = grid[y1][x0] * (1 - tx) + grid[y1][x1] * tx;
    return top * (1 - ty) + bot * ty;
}

// ─── Fractal Tree ─────────────────────────────────────────────────────────────
function drawFractalTree(ctx, x, y, angle, length, depth, maxDepth, branchAngle, lengthRatio, windPhase, windStrength) {
    if (depth === 0 || length < 1.5) return;
    const windOff = Math.sin(windPhase + depth * 0.8) * windStrength * (1 - depth / maxDepth) * 0.4;
    const x2 = x + Math.cos(angle + windOff) * length;
    const y2 = y + Math.sin(angle + windOff) * length;
    const ratio = depth / maxDepth;
    const r = Math.round(20 + ratio * 130);
    const g = Math.round(30 + ratio * 160);
    const b = Math.round(50 + ratio * 100);
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.25 + ratio * 0.75})`;
    ctx.lineWidth = Math.max(0.4, depth * 0.55);
    ctx.shadowBlur = depth < 3 ? 0 : 6;
    ctx.shadowColor = '#10b981';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawFractalTree(ctx, x2, y2, angle - branchAngle, length * lengthRatio, depth - 1, maxDepth, branchAngle, lengthRatio, windPhase, windStrength);
    drawFractalTree(ctx, x2, y2, angle + branchAngle, length * lengthRatio, depth - 1, maxDepth, branchAngle, lengthRatio, windPhase, windStrength);
}

// ─── Slider component ─────────────────────────────────────────────────────────
function Slider({ label, min, max, step, value, onChange, display }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="text-xs font-mono text-accent">{display ?? value}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full cursor-pointer accent-emerald-500"
                style={{ background: `linear-gradient(to right, #10b981 ${((value-min)/(max-min))*100}%, rgba(51,65,85,0.5) 0%)` }}
            />
        </div>
    );
}

// ─── How It Works box ─────────────────────────────────────────────────────────
function HowItWorks({ text }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-accent hover:bg-emerald-500/10 transition"
            >
                <span><i className="fa fa-circle-info mr-2" />How it works</span>
                <i className={`fa fa-chevron-down text-[10px] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="px-4 pb-3 pt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function CodeCanvas() {
    const [activeTab, setActiveTab] = useState('flowfield');

    // ── Flow Field state ──────────────────────────────────────────────────────
    const [ffCount, setFfCount]         = useState(800);
    const [ffSpeed, setFfSpeed]         = useState(1.5);
    const [ffFade, setFfFade]           = useState(0.015);
    const [ffPalette, setFfPalette]     = useState('emerald');
    const ffCanvasRef   = useRef(null);
    const ffRafRef      = useRef(null);
    const ffParticles   = useRef([]);
    const ffNoiseGrid   = useRef(null);
    const ffInitDone    = useRef(false);
    const ffParams      = useRef({ count: 800, speed: 1.5, fade: 0.015, palette: 'emerald' });

    // ── Fractal Tree state ────────────────────────────────────────────────────
    const [ftAngle, setFtAngle]         = useState(25);
    const [ftDepth, setFtDepth]         = useState(8);
    const [ftRatio, setFtRatio]         = useState(0.68);
    const [ftWind, setFtWind]           = useState(0.3);
    const ftCanvasRef   = useRef(null);
    const ftRafRef      = useRef(null);
    const ftPhaseRef    = useRef(0);
    const ftParams      = useRef({ angle: 25, depth: 8, ratio: 0.68, wind: 0.3 });

    // ── Waveform state ────────────────────────────────────────────────────────
    const [wvFreq1, setWvFreq1]         = useState(3);
    const [wvFreq2, setWvFreq2]         = useState(5);
    const [wvAmp, setWvAmp]             = useState(80);
    const [wvPhase, setWvPhase]         = useState(0);
    const [wvSpeed, setWvSpeed]         = useState(1);
    const wvCanvasRef   = useRef(null);
    const wvRafRef      = useRef(null);
    const wvTimeRef     = useRef(0);
    const wvParams      = useRef({ freq1: 3, freq2: 5, amp: 80, phase: 0, speed: 1 });

    // ── Sync params to refs (avoid stale closure in rAF) ─────────────────────
    useEffect(() => { ffParams.current = { count: ffCount, speed: ffSpeed, fade: ffFade, palette: ffPalette }; }, [ffCount, ffSpeed, ffFade, ffPalette]);
    useEffect(() => { ftParams.current = { angle: ftAngle * Math.PI / 180, depth: ftDepth, ratio: ftRatio, wind: ftWind }; }, [ftAngle, ftDepth, ftRatio, ftWind]);
    useEffect(() => { wvParams.current = { freq1: wvFreq1, freq2: wvFreq2, amp: wvAmp, phase: wvPhase * Math.PI / 180, speed: wvSpeed }; }, [wvFreq1, wvFreq2, wvAmp, wvPhase, wvSpeed]);

    // ══════════════════════════════════════════════════════════════════════════
    //  FLOW FIELD
    // ══════════════════════════════════════════════════════════════════════════
    const spawnParticles = useCallback((canvas, count, palette) => {
        const W = canvas.width, H = canvas.height;
        const colors = PALETTES[palette] || PALETTES.emerald;
        ffParticles.current = Array.from({ length: count }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: 0, vy: 0,
            life: Math.random() * 200,
            maxLife: 150 + Math.random() * 200,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));
    }, []);

    const initFlowField = useCallback((canvas) => {
        ffNoiseGrid.current = buildNoiseGrid(64);
        spawnParticles(canvas, ffParams.current.count, ffParams.current.palette);
        ffInitDone.current = true;
    }, [spawnParticles]);

    useEffect(() => {
        if (activeTab !== 'flowfield') { cancelAnimationFrame(ffRafRef.current); return; }
        const canvas = ffCanvasRef.current;
        if (!canvas) return;
        canvas.width  = canvas.offsetWidth  || 600;
        canvas.height = canvas.offsetHeight || 400;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#06080f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!ffInitDone.current) initFlowField(canvas);

        const loop = () => {
            const W = canvas.width, H = canvas.height;
            const p = ffParams.current;
            const colors = PALETTES[p.palette] || PALETTES.emerald;

            // Slow fade
            ctx.fillStyle = `rgba(6,8,15,${p.fade})`;
            ctx.fillRect(0, 0, W, H);

            const particles = ffParticles.current;
            for (const pt of particles) {
                const nx = pt.x / W, ny = pt.y / H;
                const angle = sampleNoise(ffNoiseGrid.current, nx, ny);
                pt.vx = pt.vx * 0.95 + Math.cos(angle) * p.speed * 0.3;
                pt.vy = pt.vy * 0.95 + Math.sin(angle) * p.speed * 0.3;
                const ox = pt.x, oy = pt.y;
                pt.x += pt.vx * p.speed;
                pt.y += pt.vy * p.speed;
                pt.life++;
                if (pt.life > pt.maxLife || pt.x < 0 || pt.x > W || pt.y < 0 || pt.y > H) {
                    pt.x = Math.random() * W; pt.y = Math.random() * H;
                    pt.vx = 0; pt.vy = 0; pt.life = 0;
                    pt.maxLife = 150 + Math.random() * 200;
                    pt.color = colors[Math.floor(Math.random() * colors.length)];
                }
                const alpha = Math.sin((pt.life / pt.maxLife) * Math.PI) * 0.65;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = pt.color;
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(pt.x, pt.y); ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ffRafRef.current = requestAnimationFrame(loop);
        };
        ffRafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(ffRafRef.current);
    }, [activeTab, initFlowField]);

    const clearFlowField = () => {
        const canvas = ffCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#06080f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        spawnParticles(canvas, ffParams.current.count, ffParams.current.palette);
    };

    const newFlowField = () => {
        ffNoiseGrid.current = buildNoiseGrid(64);
        clearFlowField();
    };

    // ══════════════════════════════════════════════════════════════════════════
    //  FRACTAL TREE
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (activeTab !== 'fractal') { cancelAnimationFrame(ftRafRef.current); return; }
        const canvas = ftCanvasRef.current;
        if (!canvas) return;
        canvas.width  = canvas.offsetWidth  || 600;
        canvas.height = canvas.offsetHeight || 450;
        const ctx = canvas.getContext('2d');

        const loop = () => {
            const W = canvas.width, H = canvas.height;
            const p = ftParams.current;
            ftPhaseRef.current += 0.015;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#06080f';
            ctx.fillRect(0, 0, W, H);
            ctx.save();
            drawFractalTree(ctx, W / 2, H - 20, -Math.PI / 2, 80, p.depth, p.depth, p.angle, p.ratio, ftPhaseRef.current, p.wind);
            ctx.restore();
            ftRafRef.current = requestAnimationFrame(loop);
        };
        ftRafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(ftRafRef.current);
    }, [activeTab]);

    const randomizeFractal = () => {
        setFtAngle(Math.random() * 50 + 10);
        setFtDepth(Math.floor(Math.random() * 7) + 4);
        setFtRatio(Math.random() * 0.35 + 0.5);
        setFtWind(Math.random());
    };

    // ══════════════════════════════════════════════════════════════════════════
    //  WAVEFORM COLLIDER
    // ══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (activeTab !== 'waveform') { cancelAnimationFrame(wvRafRef.current); return; }
        const canvas = wvCanvasRef.current;
        if (!canvas) return;
        canvas.width  = canvas.offsetWidth  || 600;
        canvas.height = canvas.offsetHeight || 350;
        const ctx = canvas.getContext('2d');

        const loop = () => {
            const W = canvas.width, H = canvas.height;
            const p = wvParams.current;
            wvTimeRef.current += 0.02 * p.speed;
            const t = wvTimeRef.current;
            const midY = H / 2;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#06080f';
            ctx.fillRect(0, 0, W, H);

            // Draw wave 1 (cyan fill)
            ctx.beginPath();
            ctx.moveTo(0, midY);
            for (let x = 0; x <= W; x++) {
                const y = midY + Math.sin((x / W) * Math.PI * 2 * p.freq1 + t) * p.amp;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.lineTo(W, midY); ctx.lineTo(0, midY); ctx.closePath();
            ctx.fillStyle = 'rgba(6,182,212,0.18)';
            ctx.fill();

            // Wave 1 line
            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                const y = midY + Math.sin((x / W) * Math.PI * 2 * p.freq1 + t) * p.amp;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(6,182,212,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

            // Draw wave 2 (emerald fill)
            ctx.beginPath();
            ctx.moveTo(0, midY);
            for (let x = 0; x <= W; x++) {
                const y = midY + Math.sin((x / W) * Math.PI * 2 * p.freq2 + t + p.phase) * p.amp;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.lineTo(W, midY); ctx.lineTo(0, midY); ctx.closePath();
            ctx.fillStyle = 'rgba(16,185,129,0.18)';
            ctx.fill();

            // Wave 2 line
            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                const y = midY + Math.sin((x / W) * Math.PI * 2 * p.freq2 + t + p.phase) * p.amp;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(16,185,129,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

            // Sum wave (bright glow)
            const sumPoints = [];
            for (let x = 0; x <= W; x++) {
                const y1 = Math.sin((x / W) * Math.PI * 2 * p.freq1 + t) * p.amp;
                const y2 = Math.sin((x / W) * Math.PI * 2 * p.freq2 + t + p.phase) * p.amp;
                sumPoints.push(midY + (y1 + y2) / 2);
            }

            ctx.save();
            ctx.shadowBlur = 14; ctx.shadowColor = '#10b981';
            ctx.beginPath();
            sumPoints.forEach((y, x) => x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.restore();

            // Intersection glow nodes where sum is near zero
            for (let x = 2; x < W - 2; x += 3) {
                const y1 = Math.sin((x / W) * Math.PI * 2 * p.freq1 + t) * p.amp;
                const y2 = Math.sin((x / W) * Math.PI * 2 * p.freq2 + t + p.phase) * p.amp;
                if (Math.abs(y1 + y2) < p.amp * 0.12) {
                    ctx.save();
                    ctx.shadowBlur = 10; ctx.shadowColor = '#eab308';
                    ctx.fillStyle = '#eab308';
                    ctx.beginPath(); ctx.arc(x, midY + (y1 + y2) / 2, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                }
            }

            wvRafRef.current = requestAnimationFrame(loop);
        };
        wvRafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(wvRafRef.current);
    }, [activeTab]);

    // ── Export PNG ────────────────────────────────────────────────────────────
    const exportPNG = () => {
        const map = { flowfield: ffCanvasRef, fractal: ftCanvasRef, waveform: wvCanvasRef };
        const canvas = map[activeTab]?.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `code-canvas-${activeTab}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // ── Tab config ────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'flowfield', label: 'Flow Field',    icon: 'fa-wind' },
        { id: 'fractal',   label: 'Fractal Tree',  icon: 'fa-tree' },
        { id: 'waveform',  label: 'Waveform',      icon: 'fa-wave-square' },
    ];

    const beatFreq = Math.abs(wvFreq1 - wvFreq2);

    return (
        <section id="code-canvas" className="section-dark py-12 md:py-20">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 mb-4">
                        <i className="fa fa-palette text-accent text-xs" />
                        <span className="text-xs font-mono text-accent">&lt; Code Canvas /&gt;</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
                        Creative{' '}
                        <span className="text-accent">Code Canvas</span>
                    </h2>
                    <p className="text-secondary max-w-xl mx-auto text-sm md:text-base">
                        Generative art powered by algorithms — adjust the parameters and watch mathematics paint.
                    </p>
                </motion.div>

                {/* Tab bar */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex gap-1 p-1 rounded-full border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-emerald-500 text-black shadow'
                                        : 'text-secondary hover:text-accent hover:bg-accent/10'
                                }`}
                            >
                                <i className={`fa ${tab.icon} text-xs`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    {/* ── FLOW FIELD ── */}
                    {activeTab === 'flowfield' && (
                        <motion.div key="flowfield" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Controls */}
                                <div className="lg:col-span-4 space-y-4">
                                    <div className="card-bg border rounded-2xl p-5 space-y-4">
                                        <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                                            <i className="fa fa-sliders" /> Parameters
                                        </h3>
                                        <Slider label="Particle Count" min={200} max={2000} step={100} value={ffCount} onChange={setFfCount} />
                                        <Slider label="Speed" min={0.5} max={4} step={0.1} value={ffSpeed} onChange={setFfSpeed} display={ffSpeed.toFixed(1)} />
                                        <Slider label="Trail Fade" min={0.005} max={0.05} step={0.005} value={ffFade} onChange={setFfFade} display={ffFade.toFixed(3)} />
                                    </div>
                                    <div className="card-bg border rounded-2xl p-5">
                                        <h3 className="text-sm font-semibold text-accent flex items-center gap-2 mb-3">
                                            <i className="fa fa-palette" /> Color Palette
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(PALETTES).map(([name, colors]) => (
                                                <button
                                                    key={name}
                                                    onClick={() => { setFfPalette(name); clearFlowField(); }}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border transition ${ffPalette === name ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent hover:border-accent/30'}`}
                                                >
                                                    <div className="flex gap-0.5">
                                                        {colors.slice(0,3).map((c,i) => <div key={i} style={{ background: c, width: 10, height: 10, borderRadius: 2 }} />)}
                                                    </div>
                                                    <span className="text-xs capitalize text-secondary">{name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={clearFlowField} className="flex-1 py-2 rounded-xl border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/10 transition">
                                            <i className="fa fa-eraser mr-1" /> Clear
                                        </button>
                                        <button onClick={newFlowField} className="flex-1 py-2 rounded-xl border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/10 transition">
                                            <i className="fa fa-shuffle mr-1" /> New Field
                                        </button>
                                    </div>
                                    <HowItWorks text="A 64×64 grid of random angles is generated and smoothed with a box blur filter. Each particle reads the angle at its position and moves in that direction, leaving a faint colored trail. As thousands of particles follow the same field, organic flow patterns emerge from pure math." />
                                </div>
                                {/* Canvas */}
                                <div className="lg:col-span-8">
                                    <div className="card-bg border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                                        <canvas
                                            ref={ffCanvasRef}
                                            className="w-full block"
                                            style={{ height: '400px', background: '#06080f' }}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={exportPNG} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition">
                                            <i className="fa fa-download" /> Export PNG
                                        </button>
                                        <span className="text-xs text-muted flex items-center">{ffCount} particles • value noise field</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── FRACTAL TREE ── */}
                    {activeTab === 'fractal' && (
                        <motion.div key="fractal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-4 space-y-4">
                                    <div className="card-bg border rounded-2xl p-5 space-y-4">
                                        <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                                            <i className="fa fa-sliders" /> Parameters
                                        </h3>
                                        <Slider label="Branch Angle" min={10} max={60} step={1} value={ftAngle} onChange={setFtAngle} display={`${Math.round(ftAngle)}°`} />
                                        <Slider label="Recursion Depth" min={4} max={11} step={1} value={ftDepth} onChange={setFtDepth} display={`${ftDepth} (${Math.pow(2, ftDepth).toLocaleString()} tips)`} />
                                        <Slider label="Length Ratio" min={0.5} max={0.85} step={0.01} value={ftRatio} onChange={setFtRatio} display={ftRatio.toFixed(2)} />
                                        <Slider label="Wind Strength" min={0} max={1} step={0.05} value={ftWind} onChange={setFtWind} display={ftWind.toFixed(2)} />
                                    </div>
                                    <button onClick={randomizeFractal} className="w-full py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 transition">
                                        <i className="fa fa-dice mr-2" /> Randomize
                                    </button>
                                    <HowItWorks text={`A recursive function splits each branch into two children at ±${Math.round(ftAngle)}°, scaling length by ${ftRatio.toFixed(2)}. At depth ${ftDepth}, this creates ${Math.pow(2, ftDepth).toLocaleString()} tip branches. Wind applies a sine oscillation that varies with depth, making deeper branches sway more.`} />
                                </div>
                                <div className="lg:col-span-8">
                                    <div className="card-bg border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                                        <canvas
                                            ref={ftCanvasRef}
                                            className="w-full block"
                                            style={{ height: '450px', background: '#06080f' }}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={exportPNG} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition">
                                            <i className="fa fa-download" /> Export PNG
                                        </button>
                                        <span className="text-xs text-muted flex items-center">Depth {ftDepth} • {Math.pow(2, ftDepth).toLocaleString()} branches</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── WAVEFORM ── */}
                    {activeTab === 'waveform' && (
                        <motion.div key="waveform" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-4 space-y-4">
                                    <div className="card-bg border rounded-2xl p-5 space-y-4">
                                        <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                                            <i className="fa fa-sliders" /> Wave 1 <span className="text-xs text-cyan-400">(cyan)</span>
                                        </h3>
                                        <Slider label="Frequency" min={1} max={10} step={1} value={wvFreq1} onChange={setWvFreq1} display={`${wvFreq1} Hz`} />
                                    </div>
                                    <div className="card-bg border rounded-2xl p-5 space-y-4">
                                        <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                                            <i className="fa fa-sliders" /> Wave 2 <span className="text-xs text-emerald-400">(emerald)</span>
                                        </h3>
                                        <Slider label="Frequency" min={1} max={10} step={1} value={wvFreq2} onChange={setWvFreq2} display={`${wvFreq2} Hz`} />
                                    </div>
                                    <div className="card-bg border rounded-2xl p-5 space-y-4">
                                        <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                                            <i className="fa fa-sliders" /> Shared
                                        </h3>
                                        <Slider label="Amplitude" min={20} max={120} step={5} value={wvAmp} onChange={setWvAmp} display={`${wvAmp}px`} />
                                        <Slider label="Phase Shift" min={0} max={360} step={5} value={wvPhase} onChange={setWvPhase} display={`${wvPhase}°`} />
                                        <Slider label="Speed" min={0.5} max={3} step={0.1} value={wvSpeed} onChange={setWvSpeed} display={`${wvSpeed.toFixed(1)}×`} />
                                    </div>
                                    <button
                                        onClick={() => { setWvFreq2(wvFreq1); }}
                                        className="w-full py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/20 transition"
                                    >
                                        <i className="fa fa-equals mr-2" /> Sync Waves (Constructive)
                                    </button>
                                    {beatFreq > 0 && beatFreq < 4 && (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-400">
                                            <i className="fa fa-music mr-2" />
                                            Beat Frequency: {beatFreq} Hz — amplitude pulsing!
                                        </div>
                                    )}
                                    <HowItWorks text="Two sine waves are drawn and their sum shown as a glowing line. When frequencies differ, the result shows 'beats' — periodic amplitude modulation caused by constructive and destructive interference. Yellow nodes mark points where the waves nearly cancel. When frequencies match, the amplitude doubles." />
                                </div>
                                <div className="lg:col-span-8">
                                    <div className="card-bg border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                                        <canvas
                                            ref={wvCanvasRef}
                                            className="w-full block"
                                            style={{ height: '350px', background: '#06080f' }}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        <button onClick={exportPNG} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition">
                                            <i className="fa fa-download" /> Export PNG
                                        </button>
                                        <div className="flex gap-3 items-center text-xs text-muted">
                                            <span className="flex items-center gap-1"><span className="w-3 h-1 rounded inline-block bg-cyan-400" /> f₁={wvFreq1}Hz</span>
                                            <span className="flex items-center gap-1"><span className="w-3 h-1 rounded inline-block bg-emerald-400" /> f₂={wvFreq2}Hz</span>
                                            <span className="flex items-center gap-1"><span className="w-3 h-1 rounded inline-block bg-emerald-500" /> Σ Sum</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
