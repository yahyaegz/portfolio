import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';

export default function DevArcade() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('snake');
    const isRtl = language === 'ar';

    // ==========================================
    // NEO-SNAKE (VAPORWAVE EDITION) STATES & ENGINE
    // ==========================================
    const [snakeScore, setSnakeScore] = useState(0);
    const [snakeHigh, setSnakeHigh] = useState(() => {
        if (typeof window !== 'undefined') {
            return parseInt(localStorage.getItem('devarcade-snake-high') || '0', 10);
        }
        return 0;
    });
    const [snakeIsRunning, setSnakeIsRunning] = useState(false);
    const [snakeIsOver, setSnakeIsOver] = useState(false);
    const [snakeSpeed, setSnakeSpeed] = useState(1); // 1 = Normal, 2 = Fast

    const snakeCanvasRef = useRef(null);
    const snakeLoopRef = useRef(null);
    
    // Game Physics State Refs to bypass React batching during fast canvas ticks
    const snakeBodyRef = useRef([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    const snakeDirRef = useRef({ x: 0, y: -1 }); // Default: moving Up
    const snakeFoodRef = useRef({ x: 5, y: 5 });
    const snakeParticlesRef = useRef([]); // Glowing explosive pixel bursts
    const snakeGridSize = 20; // 20x20 grid
    const snakeCellSize = 15; // 15px cells => 300x300 canvas size

    // Keyboard controls binder
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!snakeIsRunning || snakeIsOver || activeTab !== 'snake') return;

            const dir = snakeDirRef.current;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (dir.y === 0) {
                        snakeDirRef.current = { x: 0, y: -1 };
                        e.preventDefault();
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (dir.y === 0) {
                        snakeDirRef.current = { x: 0, y: 1 };
                        e.preventDefault();
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (dir.x === 0) {
                        snakeDirRef.current = { x: -1, y: 0 };
                        e.preventDefault();
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (dir.x === 0) {
                        snakeDirRef.current = { x: 1, y: 0 };
                        e.preventDefault();
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [snakeIsRunning, snakeIsOver, activeTab]);

    // Snake Manual Mobile controls
    const changeSnakeDir = (dx, dy) => {
        if (!snakeIsRunning || snakeIsOver) return;
        const currentDir = snakeDirRef.current;
        if (dx !== 0 && currentDir.x === 0) {
            snakeDirRef.current = { x: dx, y: 0 };
        } else if (dy !== 0 && currentDir.y === 0) {
            snakeDirRef.current = { x: 0, y: dy };
        }
    };

    // Respawn glowing food block
    const spawnFood = () => {
        let placed = false;
        while (!placed) {
            const fx = Math.floor(Math.random() * snakeGridSize);
            const fy = Math.floor(Math.random() * snakeGridSize);
            
            // Check if food coordinates collide with snake body
            const collides = snakeBodyRef.current.some(part => part.x === fx && part.y === fy);
            if (!collides) {
                snakeFoodRef.current = { x: fx, y: fy };
                placed = true;
            }
        }
    };

    // Spawn colorful neon pixel explosion particles
    const spawnSnakeExplosion = (x, y) => {
        const px = x * snakeCellSize + snakeCellSize / 2;
        const py = y * snakeCellSize + snakeCellSize / 2;
        const colors = ['#06b6d4', '#ec4899', '#f43f5e', '#eab308', '#ffffff'];
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 2.5;
            snakeParticlesRef.current.push({
                x: px,
                y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0,
                life: 30 + Math.floor(Math.random() * 20)
            });
        }
    };

    // Initialize Game State
    const initSnakeGame = () => {
        snakeBodyRef.current = [
            { x: 10, y: 10 },
            { x: 10, y: 11 },
            { x: 10, y: 12 }
        ];
        snakeDirRef.current = { x: 0, y: -1 };
        snakeParticlesRef.current = [];
        setSnakeScore(0);
        setSnakeIsOver(false);
        setSnakeIsRunning(false);
        spawnFood();
        drawSnakeFrame();
    };

    // Draw snake canvas frame at 60fps
    const drawSnakeFrame = () => {
        const canvas = snakeCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        // Fills cyber dark background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, W, H);

        // Draw glowing grid lines (vaporwave mesh grid)
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += snakeCellSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y <= H; y += snakeCellSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Draw Food (Pulsing glowing magenta capsule)
        const fx = snakeFoodRef.current.x * snakeCellSize;
        const fy = snakeFoodRef.current.y * snakeCellSize;
        const pulse = 1.0 + Math.sin(Date.now() / 100) * 0.15;
        const radius = (snakeCellSize / 2) * pulse;
        
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ec4899';
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(fx + snakeCellSize / 2, fy + snakeCellSize / 2, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw Snake body (Glowing cyan links with fading trailing tail width/color)
        const body = snakeBodyRef.current;
        for (let i = 0; i < body.length; i++) {
            const part = body[i];
            const px = part.x * snakeCellSize;
            const py = part.y * snakeCellSize;
            
            // Fading opacity for tails
            const ratio = (body.length - i) / body.length; // 1 at head, closer to 0 at tail
            ctx.save();
            ctx.shadowBlur = i === 0 ? 10 : 3;
            ctx.shadowColor = '#06b6d4';
            ctx.fillStyle = i === 0 ? '#06b6d4' : `rgba(6, 182, 212, ${0.4 + 0.6 * ratio})`;
            
            ctx.beginPath();
            ctx.roundRect(px + 1, py + 1, snakeCellSize - 2, snakeCellSize - 2, 4);
            ctx.fill();
            ctx.restore();
        }

        // Render & Update Glowing Score particles
        const particles = snakeParticlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = p.life / 50;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0; // reset
    };

    // Snake Game tick physics loop (interval based)
    useEffect(() => {
        if (activeTab !== 'snake') return;

        // Initialize canvas dimensions
        const canvas = snakeCanvasRef.current;
        if (canvas) {
            canvas.width = snakeGridSize * snakeCellSize;
            canvas.height = snakeGridSize * snakeCellSize;
            drawSnakeFrame();
        }

        let lastTime = 0;
        // Game tick duration: standard levels speed up as score increases
        const baseSpeed = snakeSpeed === 1 ? 130 : 80;
        const tickRate = Math.max(50, baseSpeed - snakeScore * 2);

        const loop = (time) => {
            if (!lastTime) lastTime = time;
            const elapsed = time - lastTime;

            if (snakeIsRunning && !snakeIsOver) {
                if (elapsed > tickRate) {
                    lastTime = time;
                    
                    const body = [...snakeBodyRef.current];
                    const head = body[0];
                    const dir = snakeDirRef.current;
                    
                    // Construct new head coordinate
                    const newHead = {
                        x: head.x + dir.x,
                        y: head.y + dir.y
                    };

                    // Check border boundaries collision
                    if (newHead.x < 0 || newHead.x >= snakeGridSize || newHead.y < 0 || newHead.y >= snakeGridSize) {
                        setSnakeIsOver(true);
                        setSnakeIsRunning(false);
                        return;
                    }

                    // Check self-crash collision
                    const selfCollides = body.some(part => part.x === newHead.x && part.y === newHead.y);
                    if (selfCollides) {
                        setSnakeIsOver(true);
                        setSnakeIsRunning(false);
                        return;
                    }

                    // Prepend new head coordinate
                    body.unshift(newHead);

                    // Check food consumption collision
                    const food = snakeFoodRef.current;
                    if (newHead.x === food.x && newHead.y === food.y) {
                        const newScore = snakeScore + 1;
                        setSnakeScore(newScore);
                        spawnSnakeExplosion(food.x, food.y);
                        
                        // Update High score
                        if (newScore > snakeHigh) {
                            setSnakeHigh(newScore);
                            localStorage.setItem('devarcade-snake-high', newScore.toString());
                        }
                        
                        spawnFood();
                    } else {
                        // Remove tail coordinate if food wasn't consumed
                        body.pop();
                    }

                    snakeBodyRef.current = body;
                }
            }

            drawSnakeFrame();
            snakeLoopRef.current = requestAnimationFrame(loop);
        };

        snakeLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(snakeLoopRef.current);
    }, [snakeIsRunning, snakeIsOver, snakeScore, snakeSpeed, activeTab]);


    // ==========================================
    // TIC-TAC-TOE VS UNBEATABLE MINIMAX AI
    // ==========================================
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [tttWinner, setTttWinner] = useState(null); // 'X', 'O', 'draw'
    const [tttStats, setTttStats] = useState({ wins: 0, losses: 0, draws: 0 });
    
    // AI decision telemetry state
    const [aiTelemetry, setAiTelemetry] = useState({
        nodes: 0,
        depth: 0,
        latency: 0,
        score: 0
    });

    const checkBoardWinner = (b) => {
        const winLines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        for (const line of winLines) {
            const [x, y, z] = line;
            if (b[x] && b[x] === b[y] && b[x] === b[z]) {
                return b[x];
            }
        }
        if (!b.includes(null)) return 'draw';
        return null;
    };

    // Minimax Heuristic Scorer (X is Minimizer -10, O is Maximizer +10)
    const evaluateBoard = (b) => {
        const w = checkBoardWinner(b);
        if (w === 'O') return 10;
        if (w === 'X') return -10;
        return 0;
    };

    const makeTttMove = (cellIndex) => {
        if (board[cellIndex] !== null || isAiThinking || tttWinner) return;

        // Player (X) makes a move
        const newBoard = [...board];
        newBoard[cellIndex] = 'X';
        setBoard(newBoard);

        const winner = checkBoardWinner(newBoard);
        if (winner) {
            setTttWinner(winner);
            updateTttStats(winner);
            return;
        }

        // Trigger Minimax AI turn (O)
        setIsAiThinking(true);
        setTimeout(() => runAiMinimax(newBoard), 400);
    };

    const updateTttStats = (winner) => {
        setTttStats(prev => {
            if (winner === 'X') return { ...prev, wins: prev.wins + 1 };
            if (winner === 'O') return { ...prev, losses: prev.losses + 1 };
            return { ...prev, draws: prev.draws + 1 };
        });
    };

    // Unbeatable Minimax AI Engine with alpha-beta pruning
    const runAiMinimax = (currentBoard) => {
        const start = performance.now();
        let nodesEvaluated = 0;

        // Minimax recursive search tree traversal
        const minimax = (tempBoard, depth, isMax, alpha, beta) => {
            nodesEvaluated++;
            const score = evaluateBoard(tempBoard);

            // Leaf node terminal scores
            if (score === 10) return score - depth; // Favor faster AI wins
            if (score === -10) return score + depth; // Favor delayed AI losses
            if (!tempBoard.includes(null)) return 0; // Draw

            if (isMax) {
                let best = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (tempBoard[i] === null) {
                        tempBoard[i] = 'O';
                        const val = minimax(tempBoard, depth + 1, false, alpha, beta);
                        tempBoard[i] = null;
                        best = Math.max(best, val);
                        alpha = Math.max(alpha, val);
                        if (beta <= alpha) break; // pruning synapse
                    }
                }
                return best;
            } else {
                let best = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (tempBoard[i] === null) {
                        tempBoard[i] = 'X';
                        const val = minimax(tempBoard, depth + 1, true, alpha, beta);
                        tempBoard[i] = null;
                        best = Math.min(best, val);
                        beta = Math.min(beta, val);
                        if (beta <= alpha) break; // pruning synapse
                    }
                }
                return best;
            }
        };

        // Standard root node evaluation loop
        let bestScore = -Infinity;
        let bestMove = -1;
        const depthLimit = currentBoard.filter(v => v === null).length;

        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = 'O';
                const score = minimax(currentBoard, 0, false, -Infinity, Infinity);
                currentBoard[i] = null;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        const end = performance.now();
        const latency = end - start;

        // Apply best move coordinates
        if (bestMove !== -1) {
            const nextBoard = [...currentBoard];
            nextBoard[bestMove] = 'O';
            setBoard(nextBoard);

            // Set decision telemetry metrics
            setAiTelemetry({
                nodes: nodesEvaluated,
                depth: depthLimit,
                latency: Math.max(0.1, parseFloat(latency.toFixed(2))),
                score: bestScore
            });

            const winner = checkBoardWinner(nextBoard);
            if (winner) {
                setTttWinner(winner);
                updateTttStats(winner);
            }
        }

        setIsAiThinking(false);
    };

    const resetTttGame = () => {
        setBoard(Array(9).fill(null));
        setTttWinner(null);
        setIsAiThinking(false);
        setAiTelemetry({ nodes: 0, depth: 0, latency: 0, score: 0 });
    };

    return (
        <section id="dev-arcade" className="section-dark" aria-labelledby="arcade-heading">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
                
                {/* Header */}
                <motion.div
                    className="text-center mb-8 md:mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 id="arcade-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">
                        <SplitTextReveal>{t('devArcade.title')}</SplitTextReveal>{' '}
                        <span className="text-accent accent-glow-text">
                            <SplitTextReveal stagger={0.06}>{t('devArcade.titleSpan')}</SplitTextReveal>
                        </span>
                    </h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2">
                        {t('devArcade.subtitle')}
                    </p>
                </motion.div>

                {/* Tabs selection */}
                <div className="flex justify-center mb-8">
                    <div className="flex border rounded-full p-1 bg-slate-900/60" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            onClick={() => { setActiveTab('snake'); resetTttGame(); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
                                activeTab === 'snake'
                                    ? 'bg-accent text-black font-bold shadow-lg'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            <i className="fa-solid fa-gamepad text-xs" />
                            {t('devArcade.tabSnake')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('ttt'); setSnakeIsRunning(false); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
                                activeTab === 'ttt'
                                    ? 'bg-accent text-black font-bold shadow-lg'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            <i className="fa-solid fa-microchip text-xs" />
                            {t('devArcade.tabTtt')}
                        </button>
                    </div>
                </div>

                {/* Dynamic Arcade frame viewport */}
                <AnimatePresence mode="wait">
                    {activeTab === 'snake' && (
                        <motion.div
                            key="snake"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-center max-w-4xl mx-auto"
                        >
                            {/* Controls card panel */}
                            <div className="md:col-span-5 flex flex-col card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.snakeTitle')}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.snakeDesc')}</p>
                                </div>

                                {/* Score matrix grid */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.score')}
                                        </span>
                                        <span className="text-lg font-black text-cyan-400 tabular-nums block">
                                            {snakeScore}
                                        </span>
                                    </div>
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.highScore')}
                                        </span>
                                        <span className="text-lg font-black text-accent tabular-nums block">
                                            {snakeHigh}
                                        </span>
                                    </div>
                                </div>

                                {/* Difficulty/Speed setup */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Game Level</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1, 2].map((s) => (
                                            <button
                                                key={s}
                                                disabled={snakeIsRunning}
                                                onClick={() => setSnakeSpeed(s)}
                                                className={`py-2 rounded-lg text-xs font-bold border transition ${
                                                    snakeSpeed === s
                                                        ? 'bg-accent border-accent text-black'
                                                        : 'border-slate-800 text-secondary hover:border-slate-700 disabled:opacity-40'
                                                }`}
                                            >
                                                {s === 1 ? 'Normal' : 'Hyper'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions list button */}
                                <div className="pt-2">
                                    {!snakeIsOver ? (
                                        <button
                                            onClick={() => setSnakeIsRunning(!snakeIsRunning)}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5 ${
                                                snakeIsRunning
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                                    : 'bg-accent hover:bg-opacity-90 text-black'
                                            }`}
                                        >
                                            <i className={`fa-solid ${snakeIsRunning ? 'fa-pause' : 'fa-play'}`} />
                                            {snakeIsRunning ? t('devArcade.btnPause') : t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={initSnakeGame}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                            {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Canvas Visualizer viewport */}
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[300px] aspect-square bg-slate-950">
                                    <canvas
                                        ref={snakeCanvasRef}
                                        className="block aspect-square w-full"
                                    />
                                    
                                    {/* Game states overlay banners */}
                                    {!snakeIsRunning && !snakeIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none flex flex-col items-center justify-center text-center p-4">
                                            <i className="fa-solid fa-gamepad text-4xl text-accent mb-3 animate-pulse" />
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">
                                                Neo-Snake Vaporwave
                                            </span>
                                            <span className="text-[10px] text-muted max-w-[200px] leading-relaxed block">
                                                Press W/A/S/D or arrow keys on desktop, or D-pad below to steer.
                                            </span>
                                        </div>
                                    )}

                                    {snakeIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 pointer-events-none flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl">
                                            <i className="fa-solid fa-skull-crossbones text-4xl text-rose-500 mb-3" />
                                            <span className="text-base uppercase font-black tracking-wider text-rose-500 block mb-1">
                                                {t('devArcade.gameOver')}
                                            </span>
                                            <span className="text-sm font-bold text-primary block">
                                                {t('devArcade.score')}: {snakeScore}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* On-screen mobile friendly virtual D-pad */}
                                <div className="grid grid-cols-3 gap-2 w-36 select-none md:mt-2">
                                    <div />
                                    <button
                                        onClick={() => changeSnakeDir(0, -1)}
                                        className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary transition shadow-md bg-slate-950/50"
                                    >
                                        <i className="fa-solid fa-chevron-up" />
                                    </button>
                                    <div />

                                    <button
                                        onClick={() => changeSnakeDir(-1, 0)}
                                        className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary transition shadow-md bg-slate-950/50"
                                    >
                                        <i className="fa-solid fa-chevron-left" />
                                    </button>
                                    <div className="h-10 w-10 flex items-center justify-center text-[10px] font-extrabold text-muted">
                                        DIR
                                    </div>
                                    <button
                                        onClick={() => changeSnakeDir(1, 0)}
                                        className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary transition shadow-md bg-slate-950/50"
                                    >
                                        <i className="fa-solid fa-chevron-right" />
                                    </button>

                                    <div />
                                    <button
                                        onClick={() => changeSnakeDir(0, 1)}
                                        className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary transition shadow-md bg-slate-950/50"
                                    >
                                        <i className="fa-solid fa-chevron-down" />
                                    </button>
                                    <div />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ttt' && (
                        <motion.div
                            key="ttt"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center"
                        >
                            {/* Board & controls */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                <div className="card-bg border rounded-2xl p-5 flex flex-col items-center gap-5">
                                    <div className="w-full max-w-[280px]">
                                        <div className="mb-4 text-center">
                                            <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.tttTitle')}</h3>
                                            <p className="text-xs text-muted leading-relaxed">{t('devArcade.tttDesc')}</p>
                                        </div>

                                        {/* Dynamic Tic-Tac-Toe 3x3 Grid board */}
                                        <div className="grid grid-cols-3 gap-3 aspect-square w-full">
                                            {board.map((cell, idx) => (
                                                <button
                                                    key={idx}
                                                    disabled={cell !== null || isAiThinking || tttWinner}
                                                    onClick={() => makeTttMove(idx)}
                                                    className={`aspect-square border border-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black transition relative overflow-hidden bg-slate-950/60 disabled:cursor-not-allowed ${
                                                        cell === null && !tttWinner && !isAiThinking ? 'hover:border-accent' : ''
                                                    }`}
                                                >
                                                    {cell === 'X' && (
                                                        <motion.span
                                                            initial={{ scale: 0, rotate: -45 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            className="text-cyan-400 font-extrabold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                                                        >
                                                            X
                                                        </motion.span>
                                                    )}
                                                    {cell === 'O' && (
                                                        <motion.span
                                                            initial={{ scale: 0, rotate: 45 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            className="text-rose-400 font-extrabold drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]"
                                                        >
                                                            O
                                                        </motion.span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Game telemetry status banners */}
                                    <div className="w-full flex flex-col items-center gap-3.5 pt-2">
                                        <div className="text-center font-bold text-xs uppercase tracking-widest min-h-[1.5rem]">
                                            {!tttWinner && !isAiThinking && (
                                                <span className="text-cyan-400">{t('devArcade.playerTurn')}</span>
                                            )}
                                            {isAiThinking && (
                                                <span className="text-rose-400 animate-pulse">{t('devArcade.aiTurn')}</span>
                                            )}
                                            {tttWinner === 'X' && (
                                                <span className="text-emerald-400">{t('devArcade.playerWon')}</span>
                                            )}
                                            {tttWinner === 'O' && (
                                                <span className="text-rose-500">{t('devArcade.aiWon')}</span>
                                            )}
                                            {tttWinner === 'draw' && (
                                                <span className="text-amber-400">{t('devArcade.draw')}</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center w-full max-w-xs text-[10px] font-bold text-muted uppercase tracking-wider">
                                            <div className="border border-slate-900 rounded-xl p-2 bg-slate-950/20">
                                                <span>{t('devArcade.statsWins')}</span>
                                                <span className="block text-primary text-sm font-black pt-1">{tttStats.wins}</span>
                                            </div>
                                            <div className="border border-slate-900 rounded-xl p-2 bg-slate-950/20">
                                                <span>{t('devArcade.statsLosses')}</span>
                                                <span className="block text-primary text-sm font-black pt-1">{tttStats.losses}</span>
                                            </div>
                                            <div className="border border-slate-900 rounded-xl p-2 bg-slate-950/20">
                                                <span>{t('devArcade.statsDraws')}</span>
                                                <span className="block text-primary text-sm font-black pt-1">{tttStats.draws}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={resetTttGame}
                                            className="w-full max-w-[200px] font-bold text-xs border border-slate-800 hover:bg-slate-800 text-secondary py-2.5 rounded-full transition"
                                        >
                                            <i className="fa-solid fa-rotate-left mr-1.5" />
                                            Reset Grid
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live minimax algorithm telemetry panel */}
                            <div className="lg:col-span-5 flex flex-col card-bg border rounded-2xl p-5 space-y-4">
                                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                                    {t('devArcade.telemetryTitle')}
                                </h4>

                                <div className="space-y-3 pt-1">
                                    {/* Stat 1: Nodes Evaluated */}
                                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-900">
                                        <span className="font-semibold text-secondary">{t('devArcade.nodesEvaluated')}</span>
                                        <span className="font-extrabold text-primary tabular-nums">
                                            {aiTelemetry.nodes.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Stat 2: Search Depth */}
                                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-900">
                                        <span className="font-semibold text-secondary">{t('devArcade.depthReached')}</span>
                                        <span className="font-extrabold text-cyan-400 tabular-nums">
                                            {aiTelemetry.depth} layers
                                        </span>
                                    </div>
                                    {/* Stat 3: Decision Latency */}
                                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-900">
                                        <span className="font-semibold text-secondary">{t('devArcade.latency')}</span>
                                        <span className="font-extrabold text-accent tabular-nums flex items-center gap-0.5">
                                            {aiTelemetry.latency} <span className="text-[10px] text-muted">{t('devArcade.ms')}</span>
                                        </span>
                                    </div>
                                    {/* Stat 4: Path branch score */}
                                    <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-900">
                                        <span className="font-semibold text-secondary">{t('devArcade.bestScore')}</span>
                                        <span className={`font-extrabold tabular-nums ${
                                            aiTelemetry.score > 0 ? 'text-emerald-400' : aiTelemetry.score < 0 ? 'text-rose-400' : 'text-slate-400'
                                        }`}>
                                            {aiTelemetry.nodes > 0 ? aiTelemetry.score : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-950/40 text-[10px] leading-relaxed text-muted space-y-1.5">
                                    <div className="font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                                        <i className="fa-solid fa-circle-info text-accent" />
                                        Algorithm Specifications
                                    </div>
                                    <p>
                                        The AI agent implements recursive **Minimax search** with **Alpha-Beta pruning** to check all future board combinations ($9! = 362,880$ permutations at step 1).
                                    </p>
                                    <p>
                                        Alpha-beta pruning eliminates exploring sub-branches once a better path is found, reducing search nodes by up to **80%** without losing optimal play.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
