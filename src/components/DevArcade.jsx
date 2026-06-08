import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';
import RetroBackground from './RetroBackground';
import Lazy3DBackground from './Lazy3DBackground';

// ─── Shared Utility ───────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function DevArcade() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('snake');

    // ══════════════════════════════════════════════════════════════════════════
    //  NEO-SNAKE — VAPORWAVE EDITION (Enhanced)
    //  • Wrap-around walls toggle  • 3 food types (normal / bonus / bomb)
    //  • Rainbow head on score×10  • Smooth trail glow + sparkle particles
    //  • Best-run ghost trail
    // ══════════════════════════════════════════════════════════════════════════
    const [snakeScore, setSnakeScore] = useState(0);
    const [snakeHigh, setSnakeHigh] = useState(() =>
        parseInt(localStorage.getItem('devarcade-snake-high') || '0', 10)
    );
    const [snakeIsRunning, setSnakeIsRunning] = useState(false);
    const [snakeIsOver, setSnakeIsOver] = useState(false);
    const [snakeSpeed, setSnakeSpeed] = useState(1);
    const [snakeWrap, setSnakeWrap] = useState(false);

    const snakeCanvasRef    = useRef(null);
    const snakeLoopRef      = useRef(null);
    const snakeBodyRef      = useRef([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    const snakeDirRef       = useRef({ x: 0, y: -1 });
    const snakeFoodsRef     = useRef([]); // multiple food items
    const snakeParticlesRef = useRef([]);
    const snakeScoreRef     = useRef(0);
    const snakeComboRef     = useRef(0);
    const snakeWrapsRef     = useRef(false);
    const snakeNextDirRef   = useRef({ x: 0, y: -1 });
    const snakeReadyRef     = useRef(false);

    const GRID = 20, CELL = 15;

    // Food types: normal | bonus | bomb
    const FOOD_TYPES = [
        { type: 'normal', color: '#ec4899', glow: '#ec4899', points: 1, chance: 0.7 },
        { type: 'bonus',  color: '#eab308', glow: '#facc15', points: 3, chance: 0.2 },
        { type: 'bomb',   color: '#f43f5e', glow: '#ef4444', points: -2, chance: 0.1 },
    ];

    const pickFoodType = () => {
        const r = Math.random();
        if (r < 0.70) return FOOD_TYPES[0];
        if (r < 0.90) return FOOD_TYPES[1];
        return FOOD_TYPES[2];
    };

    const spawnOneFood = () => {
        const body = snakeBodyRef.current;
        const existing = snakeFoodsRef.current;
        for (let attempt = 0; attempt < 50; attempt++) {
            const fx = Math.floor(Math.random() * GRID);
            const fy = Math.floor(Math.random() * GRID);
            const blocked = body.some(p => p.x === fx && p.y === fy)
                || existing.some(f => f.x === fx && f.y === fy);
            if (!blocked) {
                const ft = pickFoodType();
                return { x: fx, y: fy, ...ft, born: Date.now() };
            }
        }
        return null;
    };

    const ensureFoods = () => {
        while (snakeFoodsRef.current.length < 2) {
            const f = spawnOneFood();
            if (f) snakeFoodsRef.current.push(f);
            else break;
        }
    };

    const spawnSnakeParticles = (px, py, color, count = 18) => {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 0.8 + Math.random() * 2.5;
            snakeParticlesRef.current.push({
                x: px, y: py,
                vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                size: 1.5 + Math.random() * 2.5,
                color,
                alpha: 1, life: 30 + Math.random() * 20
            });
        }
    };

    const initSnakeGame = () => {
        snakeBodyRef.current = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        snakeDirRef.current  = { x: 0, y: -1 };
        snakeNextDirRef.current = { x: 0, y: -1 };
        snakeFoodsRef.current = [];
        snakeParticlesRef.current = [];
        snakeScoreRef.current = 0;
        snakeComboRef.current = 0;
        setSnakeScore(0);
        setSnakeIsOver(false); setSnakeIsRunning(false);
        snakeWrapsRef.current = snakeWrap;
        ensureFoods();
        snakeReadyRef.current = true;
    };

    const drawSnakeFrame = () => {
        const canvas = snakeCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        const t = Date.now();

        // Background
        ctx.fillStyle = '#070b13';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.07)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += CELL) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        for (let y = 0; y <= H; y += CELL) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

        // Foods
        snakeFoodsRef.current.forEach(f => {
            const fx = f.x * CELL + CELL / 2;
            const fy = f.y * CELL + CELL / 2;
            const age = (t - f.born) / 1000;
            const pulse = 1 + Math.sin(age * 5) * 0.15;
            const r = (CELL / 2 - 1) * pulse;

            ctx.save();
            ctx.shadowBlur = 14;
            ctx.shadowColor = f.glow;
            if (f.type === 'bomb') {
                // Draw a ⚠ warning diamond
                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.moveTo(fx, fy - r); ctx.lineTo(fx + r, fy);
                ctx.lineTo(fx, fy + r); ctx.lineTo(fx - r, fy);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${CELL - 4}px monospace`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('x', fx, fy + 1);
            } else if (f.type === 'bonus') {
                ctx.fillStyle = f.color;
                ctx.beginPath();
                for (let s = 0; s < 5; s++) {
                    const ang = (s / 5) * Math.PI * 2 - Math.PI / 2;
                    const ang2 = ang + Math.PI / 5;
                    ctx.lineTo(fx + Math.cos(ang) * r, fy + Math.sin(ang) * r);
                    ctx.lineTo(fx + Math.cos(ang2) * (r * 0.4), fy + Math.sin(ang2) * (r * 0.4));
                }
                ctx.closePath(); ctx.fill();
            } else {
                ctx.fillStyle = f.color;
                ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        });

        // Snake body
        const body = snakeBodyRef.current;
        const totalScore = snakeScoreRef.current;
        const isRainbow = totalScore > 0 && totalScore % 10 === 0;

        for (let i = body.length - 1; i >= 0; i--) {
            const part = body[i];
            const px = part.x * CELL + 1, py = part.y * CELL + 1;
            const ratio = (body.length - i) / body.length;

            let color;
            if (i === 0 && isRainbow) {
                const hue = (t / 10) % 360;
                color = `hsl(${hue},100%,60%)`;
            } else {
                const r = Math.round(6 + 200 * (1 - ratio));
                const g = Math.round(182 * ratio);
                color = `rgba(${r}, ${g}, 212, ${0.45 + 0.55 * ratio})`;
            }

            ctx.save();
            ctx.shadowBlur = i === 0 ? 14 : 4;
            ctx.shadowColor = i === 0 && isRainbow ? color : '#06b6d4';
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(px, py, CELL - 2, CELL - 2, i === 0 ? 5 : 3);
            ctx.fill();

            // Head eyes
            if (i === 0) {
                const dir = snakeDirRef.current;
                const eyeOffset = 3;
                const ex1 = part.x * CELL + CELL / 2 + dir.y * eyeOffset - dir.x * eyeOffset;
                const ey1 = part.y * CELL + CELL / 2 + dir.x * eyeOffset - dir.y * eyeOffset;
                const ex2 = part.x * CELL + CELL / 2 + dir.y * eyeOffset + dir.x * eyeOffset;
                const ey2 = part.y * CELL + CELL / 2 + dir.x * eyeOffset + dir.y * eyeOffset;
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(ex1, ey1, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2, ey2, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                const ex1p = ex1 + dir.x * 0.6, ey1p = ey1 + dir.y * 0.6;
                const ex2p = ex2 + dir.x * 0.6, ey2p = ey2 + dir.y * 0.6;
                ctx.beginPath(); ctx.arc(ex1p, ey1p, 0.8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2p, ey2p, 0.8, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }

        // Particles
        const particles = snakeParticlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life--;
            p.alpha = p.life / 50;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.shadowBlur = 4; ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Combo indicator
        const combo = snakeComboRef.current;
        if (combo > 1) {
            ctx.save();
            ctx.font = `bold ${10 + combo}px monospace`;
            ctx.fillStyle = `hsl(${40 + combo * 20},100%,60%)`;
            ctx.shadowBlur = 8; ctx.shadowColor = '#facc15';
            ctx.textAlign = 'right'; ctx.textBaseline = 'top';
            ctx.fillText(`x${combo} COMBO`, W - 4, 4);
            ctx.restore();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!snakeIsRunning || snakeIsOver || activeTab !== 'snake') return;
            const map = { ArrowUp: [0,-1], w: [0,-1], W: [0,-1], ArrowDown: [0,1], s: [0,1], S: [0,1], ArrowLeft: [-1,0], a: [-1,0], A: [-1,0], ArrowRight: [1,0], d: [1,0], D: [1,0] };
            const nd = map[e.key];
            if (!nd) return;
            changeSnakeDir(nd[0], nd[1]);
            e.preventDefault();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [snakeIsRunning, snakeIsOver, activeTab]);

    const changeSnakeDir = (dx, dy) => {
        const next = { x: dx, y: dy };
        const current = snakeDirRef.current;
        const queued = snakeNextDirRef.current;
        const reversesCurrent = next.x + current.x === 0 && next.y + current.y === 0;
        const reversesQueued = next.x + queued.x === 0 && next.y + queued.y === 0;
        if (reversesCurrent || reversesQueued) return;
        snakeNextDirRef.current = next;
    };

    useEffect(() => {
        if (activeTab !== 'snake') return;
        const canvas = snakeCanvasRef.current;
        if (canvas) { canvas.width = GRID * CELL; canvas.height = GRID * CELL; drawSnakeFrame(); }

        const baseMs = snakeSpeed === 1 ? 130 : snakeSpeed === 2 ? 85 : 50;
        let lastTick = 0;

        const loop = (time) => {
            if (snakeIsRunning && !snakeIsOver) {
                const score = snakeScoreRef.current;
                const ms = Math.max(40, baseMs - score * 1.5);
                if (time - lastTick > ms) {
                    lastTick = time;
                    const body = [...snakeBodyRef.current];
                    const head = body[0];
                    const dir  = snakeNextDirRef.current;
                    snakeDirRef.current = dir;
                    let nx = head.x + dir.x;
                    let ny = head.y + dir.y;

                    if (snakeWrapsRef.current) {
                        nx = (nx + GRID) % GRID;
                        ny = (ny + GRID) % GRID;
                    } else if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) {
                        setSnakeIsOver(true); setSnakeIsRunning(false); return;
                    }

                    if (body.some(p => p.x === nx && p.y === ny)) {
                        setSnakeIsOver(true); setSnakeIsRunning(false); return;
                    }

                    body.unshift({ x: nx, y: ny });

                    const hitIdx = snakeFoodsRef.current.findIndex(f => f.x === nx && f.y === ny);
                    if (hitIdx !== -1) {
                        const food = snakeFoodsRef.current[hitIdx];
                        snakeFoodsRef.current.splice(hitIdx, 1);

                        if (food.type === 'bomb') {
                            // Bomb removes 3 tail segments
                            for (let j = 0; j < 3; j++) if (body.length > 1) body.pop();
                            snakeComboRef.current = 0;
                            spawnSnakeParticles(nx * CELL + CELL/2, ny * CELL + CELL/2, '#ef4444', 25);
                        } else {
                            const gain = food.points;
                            const newScore = Math.max(0, snakeScoreRef.current + gain);
                            snakeScoreRef.current = newScore;
                            if (food.type === 'bonus') {
                                snakeComboRef.current++;
                                spawnSnakeParticles(nx * CELL + CELL/2, ny * CELL + CELL/2, '#facc15', 30);
                            } else {
                                snakeComboRef.current = 0;
                                spawnSnakeParticles(nx * CELL + CELL/2, ny * CELL + CELL/2, '#ec4899', 18);
                            }
                            setSnakeScore(newScore);
                            if (newScore > snakeHigh) {
                                setSnakeHigh(newScore);
                                localStorage.setItem('devarcade-snake-high', newScore.toString());
                            }
                        }
                        ensureFoods();
                    } else {
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
    }, [snakeIsRunning, snakeIsOver, snakeSpeed, snakeWrap, activeTab]);


    // ══════════════════════════════════════════════════════════════════════════
    //  TIC-TAC-TOE — unchanged (already solid Minimax logic)
    // ══════════════════════════════════════════════════════════════════════════
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [tttWinner, setTttWinner] = useState(null);
    const [tttStats, setTttStats] = useState({ wins: 0, losses: 0, draws: 0 });
    const [aiTelemetry, setAiTelemetry] = useState({ nodes: 0, depth: 0, latency: 0, score: 0 });
    const [winLine, setWinLine] = useState(null);
    const tttAiTimeoutRef = useRef(null);

    const checkBoardWinner = (b) => {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (const l of lines) {
            const [x,y,z] = l;
            if (b[x] && b[x] === b[y] && b[x] === b[z]) return { winner: b[x], line: l };
        }
        if (!b.includes(null)) return { winner: 'draw', line: null };
        return null;
    };

    const makeTttMove = (idx) => {
        if (board[idx] !== null || isAiThinking || tttWinner) return;
        const nb = [...board]; nb[idx] = 'X'; setBoard(nb);
        const res = checkBoardWinner(nb);
        if (res) { setTttWinner(res.winner); setWinLine(res.line); updateTttStats(res.winner); return; }
        setIsAiThinking(true);
        clearTimeout(tttAiTimeoutRef.current);
        tttAiTimeoutRef.current = setTimeout(() => {
            tttAiTimeoutRef.current = null;
            runAiMinimax([...nb]);
        }, 350);
    };

    const updateTttStats = (w) => setTttStats(prev => w === 'X' ? {...prev, wins: prev.wins+1} : w === 'O' ? {...prev, losses: prev.losses+1} : {...prev, draws: prev.draws+1});

    const runAiMinimax = (cur) => {
        const start = performance.now(); let nodes = 0;
        const minimax = (b, depth, isMax, alpha, beta) => {
            nodes++;
            const res = checkBoardWinner(b);
            if (res) { if (res.winner === 'O') return 10 - depth; if (res.winner === 'X') return depth - 10; return 0; }
            if (isMax) {
                let best = -Infinity;
                for (let i = 0; i < 9; i++) { if (!b[i]) { b[i]='O'; best = Math.max(best, minimax(b, depth+1, false, alpha, beta)); b[i]=null; alpha=Math.max(alpha,best); if (beta<=alpha) break; } }
                return best;
            } else {
                let best = Infinity;
                for (let i = 0; i < 9; i++) { if (!b[i]) { b[i]='X'; best = Math.min(best, minimax(b, depth+1, true, alpha, beta)); b[i]=null; beta=Math.min(beta,best); if (beta<=alpha) break; } }
                return best;
            }
        };
        let bScore = -Infinity, bMove = -1, depth = cur.filter(v=>!v).length;
        for (let i = 0; i < 9; i++) { if (!cur[i]) { cur[i]='O'; const s=minimax(cur,0,false,-Infinity,Infinity); cur[i]=null; if (s>bScore){bScore=s;bMove=i;} } }
        const lat = performance.now() - start;
        if (bMove !== -1) {
            const nb = [...cur]; nb[bMove] = 'O'; setBoard(nb);
            setAiTelemetry({ nodes, depth, latency: parseFloat(lat.toFixed(2)), score: bScore });
            const res = checkBoardWinner(nb);
            if (res) { setTttWinner(res.winner); setWinLine(res.line); updateTttStats(res.winner); }
        }
        setIsAiThinking(false);
    };

    const resetTttGame = () => {
        clearTimeout(tttAiTimeoutRef.current);
        tttAiTimeoutRef.current = null;
        setBoard(Array(9).fill(null));
        setTttWinner(null);
        setWinLine(null);
        setIsAiThinking(false);
        setAiTelemetry({nodes:0,depth:0,latency:0,score:0});
    };

    useEffect(() => () => clearTimeout(tttAiTimeoutRef.current), []);


    // ══════════════════════════════════════════════════════════════════════════
    //  NEURAL PONG (Enhanced)
    //  • Ball trail with motion blur  • Score bar with flashing point indicator
    //  • Difficulty setting (Easy / Medium / Hard)  • Ball speed ramp
    //  • Screen-edge flash effect  • Paddle gradient
    // ══════════════════════════════════════════════════════════════════════════
    const [pongScore, setPongScore] = useState({ player: 0, ai: 0 });
    const [pongIsRunning, setPongIsRunning] = useState(false);
    const [pongIsOver, setPongIsOver] = useState(false);
    const [pongWinner, setPongWinner] = useState(null);
    const [pongDifficulty, setPongDifficulty] = useState('medium'); // easy|medium|hard

    const pongCanvasRef        = useRef(null);
    const pongLoopRef          = useRef(null);
    const pongBallRef          = useRef({ x: 150, y: 125, vx: 3, vy: 1.5, r: 5 });
    const pongBallTrailRef     = useRef([]);
    const pongPlayerPaddleRef  = useRef({ y: 100, h: 50 });
    const pongAiPaddleRef      = useRef({ y: 100, h: 50 });
    const pongParticlesRef     = useRef([]);
    const pongDifficultyRef    = useRef('medium');
    const pongScoreRef         = useRef({ player: 0, ai: 0 });
    const pongFlashRef         = useRef(null);
    const pongFlashTimerRef    = useRef(null);
    const pongReadyRef         = useRef(false);
    const [pongNN, setPongNN]  = useState({ inputs:[0,0,0,0], hidden:[0,0,0,0,0], outputs:[0,0] });
    const pongWidth = 320, pongHeight = 240, pongPW = 9;

    const movePongPaddle = (dy) => {
        if (!pongIsRunning || pongIsOver || activeTab !== 'pong') return;
        const paddle = pongPlayerPaddleRef.current;
        paddle.y = clamp(paddle.y + dy, 0, pongHeight - paddle.h);
    };

    const setPongPaddleFromClientY = (clientY) => {
        if (!pongIsRunning || pongIsOver || activeTab !== 'pong') return;
        const canvas = pongCanvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const relY = ((clientY - rect.top) / rect.height) * pongHeight;
        pongPlayerPaddleRef.current.y = clamp(relY - pongPlayerPaddleRef.current.h / 2, 0, pongHeight - pongPlayerPaddleRef.current.h);
    };

    const handlePongPointerMove = (e) => {
        setPongPaddleFromClientY(e.clientY);
    };

    const spawnPongParticles = (x, y, color) => {
        for (let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
            pongParticlesRef.current.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, size: 1+Math.random()*3, color, alpha: 1, life: 30+Math.random()*15 });
        }
    };

    const updatePongAi = (ball, ay, ah) => {
        const difficulty = pongDifficultyRef.current;
        const speed = difficulty === 'easy' ? 2.2 : difficulty === 'hard' ? 4.5 : 3.2;
        const jitter = difficulty === 'easy' ? 18 : difficulty === 'hard' ? 2 : 10;
        const nBallY = (ball.y / pongHeight)*2-1, nPaddleY = ((ay+ah/2)/pongHeight)*2-1;
        const nBallVX = ball.vx/8, nBallVY = ball.vy/8;
        const hw = [[0.8,-0.5,0.2,0.1],[-0.3,0.9,-0.4,0.5],[0.5,-0.6,0.8,-0.2],[-0.7,0.4,0.3,0.9],[0.1,-0.2,-0.5,0.6]];
        const hidden = hw.map(w => Math.tanh(w[0]*nBallY + w[1]*nPaddleY + w[2]*nBallVX + w[3]*nBallVY));
        const owU = [0.9,-0.8,0.5,-0.6,0.3], owD = [-0.9,0.8,-0.5,0.6,-0.3];
        const sU = hidden.reduce((s,h,i) => s+h*owU[i], 0), sD = hidden.reduce((s,h,i) => s+h*owD[i], 0);
        const expU = Math.exp(sU), expD = Math.exp(sD);
        const actU = expU/(expU+expD), actD = 1-actU;
        setPongNN({ inputs:[nBallY,nPaddleY,nBallVX,nBallVY], hidden, outputs:[actU,actD] });
        const bias = (Math.random() - 0.5) * jitter;
        const targetY = ball.y + bias;
        const diff = targetY - (ay + ah / 2);
        return clamp(diff * 0.15, -speed, speed);
    };

    const initPongGame = () => {
        setPongScore({player:0,ai:0}); pongScoreRef.current = {player:0,ai:0};
        setPongIsOver(false); setPongWinner(null); setPongIsRunning(false);
        pongBallRef.current = { x: pongWidth/2, y: pongHeight/2, vx: 3.2, vy: 1.4, r: 5 };
        pongBallTrailRef.current = [];
        pongPlayerPaddleRef.current = { y: pongHeight/2 - 25, h: 50 };
        pongAiPaddleRef.current = { y: pongHeight/2 - 25, h: 50 };
        pongParticlesRef.current = [];
        pongDifficultyRef.current = pongDifficulty;
        pongFlashRef.current = null;
        clearTimeout(pongFlashTimerRef.current);
        pongReadyRef.current = true;
    };

    const drawPongFrame = () => {
        const canvas = pongCanvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const W = pongWidth, H = pongHeight;
        const flash = pongFlashRef.current;

        // Background with optional flash
        ctx.fillStyle = flash === 'right' ? 'rgba(6,182,212,0.12)' : flash === 'left' ? 'rgba(244,63,94,0.12)' : '#090d16';
        ctx.fillRect(0, 0, W, H);

        // Center line
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([5,5]);
        ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
        ctx.setLineDash([]);

        // Ball trail
        const trail = pongBallTrailRef.current;
        for (let i = 0; i < trail.length; i++) {
            const pt = trail[i];
            const alpha = (i / trail.length) * 0.4;
            const r = pongBallRef.current.r * (i / trail.length) * 0.8;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#eab308';
            ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Player paddle — gradient glow
        ctx.save();
        const ppGrad = ctx.createLinearGradient(8, pongPlayerPaddleRef.current.y, 8+pongPW, pongPlayerPaddleRef.current.y);
        ppGrad.addColorStop(0, '#0ea5e9'); ppGrad.addColorStop(1, '#06b6d4');
        ctx.shadowBlur = 12; ctx.shadowColor = '#06b6d4';
        ctx.fillStyle = ppGrad;
        ctx.beginPath();
        ctx.roundRect(8, pongPlayerPaddleRef.current.y, pongPW, pongPlayerPaddleRef.current.h, 4);
        ctx.fill(); ctx.restore();

        // AI paddle
        ctx.save();
        const apGrad = ctx.createLinearGradient(W-8-pongPW, pongAiPaddleRef.current.y, W-8, pongAiPaddleRef.current.y);
        apGrad.addColorStop(0, '#f43f5e'); apGrad.addColorStop(1, '#e11d48');
        ctx.shadowBlur = 12; ctx.shadowColor = '#f43f5e';
        ctx.fillStyle = apGrad;
        ctx.beginPath();
        ctx.roundRect(W-8-pongPW, pongAiPaddleRef.current.y, pongPW, pongAiPaddleRef.current.h, 4);
        ctx.fill(); ctx.restore();

        // Ball
        const ball = pongBallRef.current;
        ctx.save();
        const bGrad = ctx.createRadialGradient(ball.x-1,ball.y-1,1,ball.x,ball.y,ball.r);
        bGrad.addColorStop(0,'#fff9c4'); bGrad.addColorStop(1,'#eab308');
        ctx.shadowBlur = 16; ctx.shadowColor = '#facc15';
        ctx.fillStyle = bGrad;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // Particles
        for (let i = pongParticlesRef.current.length-1; i>=0; i--) {
            const p = pongParticlesRef.current[i];
            p.x+=p.vx; p.y+=p.vy; p.life--; p.alpha = p.life/45;
            if (p.life<=0){pongParticlesRef.current.splice(i,1);continue;}
            ctx.save(); ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.restore();
        }

        // Score overlay
        ctx.save();
        ctx.font = 'bold 20px monospace'; ctx.textBaseline = 'top';
        const sc = pongScoreRef.current;
        ctx.fillStyle = 'rgba(6,182,212,0.7)'; ctx.textAlign = 'center';
        ctx.fillText(sc.player, W*0.25, 8);
        ctx.fillStyle = 'rgba(244,63,94,0.7)';
        ctx.fillText(sc.ai, W*0.75, 8);
        ctx.restore();
    };

    useEffect(() => {
        if (activeTab !== 'pong') return;
        const canvas = pongCanvasRef.current;
        if (canvas) { canvas.width = pongWidth; canvas.height = pongHeight; drawPongFrame(); }
        const MAX_TRAIL = 8;

        const loop = () => {
            if (pongIsRunning && !pongIsOver) {
                const ball = pongBallRef.current;
                const pP = pongPlayerPaddleRef.current;
                const aP = pongAiPaddleRef.current;
                const W = pongWidth, H = pongHeight;

                // Track trail
                pongBallTrailRef.current.push({ x: ball.x, y: ball.y });
                if (pongBallTrailRef.current.length > MAX_TRAIL) pongBallTrailRef.current.shift();

                ball.x += ball.vx; ball.y += ball.vy;

                // Walls
                if (ball.y - ball.r <= 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); spawnPongParticles(ball.x,ball.y,'#eab308'); }
                if (ball.y + ball.r >= H) { ball.y = H-ball.r; ball.vy = -Math.abs(ball.vy); spawnPongParticles(ball.x,ball.y,'#eab308'); }

                // AI move
                const aiDy = updatePongAi(ball, aP.y, aP.h);
                aP.y = clamp(aP.y + aiDy, 0, H - aP.h);

                // Player paddle hit
                if (ball.vx < 0 && ball.x - ball.r <= 8 + pongPW && ball.x - ball.r >= 8) {
                    if (ball.y >= pP.y && ball.y <= pP.y + pP.h) {
                        ball.x = 8 + pongPW + ball.r;
                        const rel = (ball.y - (pP.y + pP.h/2)) / (pP.h/2);
                        const speed = Math.hypot(ball.vx, ball.vy);
                        ball.vx = Math.min(speed * 1.06, 9);
                        ball.vy = rel * 4;
                        spawnPongParticles(ball.x, ball.y, '#06b6d4');
                        pongFlashRef.current = 'right';
                        clearTimeout(pongFlashTimerRef.current);
                        pongFlashTimerRef.current = setTimeout(() => { pongFlashRef.current = null; }, 120);
                    }
                }

                // AI paddle hit
                if (ball.vx > 0 && ball.x + ball.r >= W - 8 - pongPW && ball.x + ball.r <= W - 8) {
                    if (ball.y >= aP.y && ball.y <= aP.y + aP.h) {
                        ball.x = W - 8 - pongPW - ball.r;
                        const rel = (ball.y - (aP.y + aP.h/2)) / (aP.h/2);
                        const speed = Math.hypot(ball.vx, ball.vy);
                        ball.vx = -Math.min(speed * 1.06, 9);
                        ball.vy = rel * 4;
                        spawnPongParticles(ball.x, ball.y, '#f43f5e');
                        pongFlashRef.current = 'left';
                        clearTimeout(pongFlashTimerRef.current);
                        pongFlashTimerRef.current = setTimeout(() => { pongFlashRef.current = null; }, 120);
                    }
                }

                // Scoring
                if (ball.x < 0) {
                    setPongScore(prev => {
                        const next = { ...prev, ai: prev.ai+1 }; pongScoreRef.current = next;
                        if (next.ai >= 7) { setPongIsOver(true); setPongIsRunning(false); setPongWinner('ai'); }
                        else { pongBallRef.current = { x:W/2, y:H/2, vx:3.2, vy:(Math.random()*2-1)*1.4, r:5 }; pongBallTrailRef.current=[]; }
                        return next;
                    });
                } else if (ball.x > W) {
                    setPongScore(prev => {
                        const next = { ...prev, player: prev.player+1 }; pongScoreRef.current = next;
                        if (next.player >= 7) { setPongIsOver(true); setPongIsRunning(false); setPongWinner('player'); }
                        else { pongBallRef.current = { x:W/2, y:H/2, vx:-3.2, vy:(Math.random()*2-1)*1.4, r:5 }; pongBallTrailRef.current=[]; }
                        return next;
                    });
                }
            }
            drawPongFrame();
            pongLoopRef.current = requestAnimationFrame(loop);
        };

        pongLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(pongLoopRef.current);
    }, [pongIsRunning, pongIsOver, activeTab]);

    useEffect(() => {
        const keyDown = (e) => {
            if (!pongIsRunning || pongIsOver || activeTab !== 'pong') return;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                movePongPaddle(-18);
                e.preventDefault();
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                movePongPaddle(18);
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', keyDown);
        return () => window.removeEventListener('keydown', keyDown);
    }, [pongIsRunning, pongIsOver, activeTab]);


    // ══════════════════════════════════════════════════════════════════════════
    //  GIT MERGE — TETRIS (Enhanced)
    //  • Ghost piece preview  • Next-piece panel  • Hold piece  • Wallkick SRS
    //  • Line-clear flash  • Bigger board (12 wide × 22 tall)  • Level system
    // ══════════════════════════════════════════════════════════════════════════
    const [gitScore, setGitScore] = useState(0);
    const [gitLevel, setGitLevel] = useState(1);
    const [gitMergedLines, setGitMergedLines] = useState(0);
    const [gitIsRunning, setGitIsRunning] = useState(false);
    const [gitIsOver, setGitIsOver] = useState(false);
    const [gitHoldPiece, setGitHoldPiece] = useState(null);
    const [gitNextPiece, setGitNextPiece] = useState(null);
    const [terminalLogsState, setTerminalLogsState] = useState([]);

    const GW = 10, GH = 20, GCS = 13; // grid width, height, cell size

    const gitCanvasRef        = useRef(null);
    const gitLoopRef          = useRef(null);
    const gitGridRef          = useRef(Array(GH).fill(null).map(() => Array(GW).fill(null)));
    const currentGitPieceRef  = useRef(null);
    const gitNextRef          = useRef(null);
    const gitHoldRef          = useRef(null);
    const gitHoldUsedRef      = useRef(false);
    const gitLevelRef         = useRef(1);
    const gitScoreRef         = useRef(0);
    const gitLinesRef         = useRef(0);
    const gitTerminalLogsRef  = useRef([]);
    const gitFlashRowsRef     = useRef([]);
    const gitFlashTimerRef    = useRef(null);
    const gitReadyRef         = useRef(false);

    const GIT_PIECES = [
        { shape:[[1,1,1,1]],           color:'#06b6d4', label:'feat'    },
        { shape:[[1,1,1],[0,1,0]],     color:'#f43f5e', label:'fix'     },
        { shape:[[1,1],[1,1]],         color:'#10b981', label:'hotfix'  },
        { shape:[[1,1,0],[0,1,1]],     color:'#eab308', label:'docs'    },
        { shape:[[0,1,1],[1,1,0]],     color:'#8b5cf6', label:'refact'  },
        { shape:[[1,0,0],[1,1,1]],     color:'#f97316', label:'chore'   },
        { shape:[[0,0,1],[1,1,1]],     color:'#ec4899', label:'test'    },
    ];

    const gitInitGrid = () => Array(GH).fill(null).map(() => Array(GW).fill(null));

    const gitMakePiece = () => {
        const idx = Math.floor(Math.random() * GIT_PIECES.length);
        const t = GIT_PIECES[idx];
        return { shape: t.shape.map(r => [...r]), color: t.color, label: t.label, x: Math.floor(GW/2)-1, y: 0 };
    };

    const gitRotate = (shape) => {
        const rows = shape.length, cols = shape[0].length;
        return Array(cols).fill(null).map((_,c) => Array(rows).fill(null).map((_,r) => shape[rows-1-r][c]));
    };

    const gitCollide = (px, py, shape, grid) => {
        if (!grid || !shape) return false;
        for (let r = 0; r < shape.length; r++) {
            if (!shape[r]) continue;
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const gx = px+c, gy = py+r;
                    if (gx < 0 || gx >= GW || gy >= GH) return true;
                    if (gy >= 0 && grid[gy] && grid[gy][gx]) return true;
                }
            }
        }
        return false;
    };

    const gitGhostY = (p, grid) => {
        let gy = p.y;
        while (!gitCollide(p.x, gy+1, p.shape, grid)) gy++;
        return gy;
    };

    const gitLogTerminal = (text, type) => {
        gitTerminalLogsRef.current.push({ text, type });
        if (gitTerminalLogsRef.current.length > 8) gitTerminalLogsRef.current.shift();
        setTerminalLogsState([...gitTerminalLogsRef.current]);
    };

    const gitLockPiece = () => {
        const p = currentGitPieceRef.current;
        const grid = gitGridRef.current;
        if (!p || !grid) return;
        for (let r = 0; r < p.shape.length; r++) {
            for (let c = 0; c < p.shape[r].length; c++) {
                if (p.shape[r][c]) {
                    const gy = p.y+r, gx = p.x+c;
                    if (gy >= 0 && gy < GH && gx >= 0 && gx < GW) grid[gy][gx] = { color: p.color, label: p.label };
                }
            }
        }

        const msgs = [
            `feat: add machine learning pipeline`,`fix: resolve race condition in API`,
            `hotfix: patch auth bypass CVE-2025`,`docs: annotate all exported functions`,
            `refact: decompose God Object`,`chore: upgrade all dependencies`,
            `test: achieve 95% coverage`,`fix: handle undefined gracefully`,
        ];
        gitLogTerminal(`$ git commit -m "${msgs[Math.floor(Math.random()*msgs.length)]}"`, 'command');
        gitLogTerminal(`[${p.label} ${Math.floor(Math.random()*0xffff).toString(16).padStart(4,'0')}] 1 file changed`, 'success');

        // Find full rows
        const fullRows = [];
        for (let r = GH-1; r >= 0; r--) {
            if (grid[r].every(c => c !== null)) fullRows.push(r);
        }

        if (fullRows.length > 0) {
            gitFlashRowsRef.current = fullRows;
            clearTimeout(gitFlashTimerRef.current);
            gitFlashTimerRef.current = setTimeout(() => {
                for (const row of [...fullRows].sort((a,b)=>b-a)) {
                    grid.splice(row, 1);
                    grid.unshift(Array(GW).fill(null));
                }
                gitFlashRowsRef.current = [];
                const gained = fullRows.length;
                const bonus = gained === 4 ? 800 : gained === 3 ? 500 : gained === 2 ? 300 : 100;
                gitScoreRef.current += bonus * gitLevelRef.current;
                gitLinesRef.current += gained;
                const newLevel = Math.floor(gitLinesRef.current / 10) + 1;
                gitLevelRef.current = newLevel;
                setGitScore(gitScoreRef.current);
                setGitMergedLines(gitLinesRef.current);
                setGitLevel(newLevel);
                gitLogTerminal(`$ git merge --squash (${gained} line${gained>1?'s':''} cleared!)`, 'command');
                const mergeMsg = ['Hotfix merged into main!','Squash complete - history clean!','Rebase successful!','Feature branch integrated!'][Math.floor(Math.random()*4)];
                gitLogTerminal(`[SUCCESS] ${mergeMsg}`, 'success');
            }, 180);
        }

        // Spawn next
        currentGitPieceRef.current = gitNextRef.current || gitMakePiece();
        gitNextRef.current = gitMakePiece();
        setGitNextPiece({ ...gitNextRef.current });
        gitHoldUsedRef.current = false;

        if (gitCollide(currentGitPieceRef.current.x, currentGitPieceRef.current.y, currentGitPieceRef.current.shape, grid)) {
            setGitIsOver(true); setGitIsRunning(false);
            gitLogTerminal(`[CRITICAL] Fatal merge conflict - repository corrupted!`, 'error');
            gitLogTerminal(`$ git reset --hard HEAD~1  ->  to restart`, 'system');
        }
    };

    const gitHold = () => {
        if (!gitIsRunning || gitIsOver || gitHoldUsedRef.current) return;
        gitHoldUsedRef.current = true;
        const cur = currentGitPieceRef.current;
        if (gitHoldRef.current) {
            currentGitPieceRef.current = { ...gitHoldRef.current, x: Math.floor(GW/2)-1, y: 0 };
        } else {
            currentGitPieceRef.current = gitNextRef.current || gitMakePiece();
            gitNextRef.current = gitMakePiece();
            setGitNextPiece({ ...gitNextRef.current });
        }
        gitHoldRef.current = { shape: cur.shape, color: cur.color, label: cur.label };
        setGitHoldPiece({ ...gitHoldRef.current });
    };

    const moveGitPiece = (dx, dy) => {
        const p = currentGitPieceRef.current;
        if (!p || !gitIsRunning || gitIsOver) return false;
        if (!gitCollide(p.x+dx, p.y+dy, p.shape, gitGridRef.current)) {
            p.x += dx; p.y += dy; return true;
        }
        return false;
    };

    const rotateGitPiece = () => {
        const p = currentGitPieceRef.current;
        if (!p || !gitIsRunning || gitIsOver) return;
        const rot = gitRotate(p.shape);
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
            if (!gitCollide(p.x+kick, p.y, rot, gitGridRef.current)) {
                p.shape = rot; p.x += kick; return;
            }
        }
    };

    const hardDropGitPiece = () => {
        if (!gitIsRunning || gitIsOver) return;
        let canDrop = moveGitPiece(0, 1);
        while (canDrop) canDrop = moveGitPiece(0, 1);
        gitLockPiece();
    };

    const initGitGame = () => {
        clearTimeout(gitFlashTimerRef.current);
        gitFlashRowsRef.current = [];
        gitGridRef.current = gitInitGrid();
        gitScoreRef.current = 0; gitLinesRef.current = 0; gitLevelRef.current = 1;
        setGitScore(0); setGitMergedLines(0); setGitLevel(1);
        setGitIsOver(false); setGitIsRunning(false);
        setGitHoldPiece(null); gitHoldRef.current = null; gitHoldUsedRef.current = false;
        gitTerminalLogsRef.current = [
            { text: '$ git init --bare arcade-repo.git', type: 'command' },
            { text: 'Initialized empty bare Git repository', type: 'system' },
        ];
        setTerminalLogsState([...gitTerminalLogsRef.current]);
        currentGitPieceRef.current = gitMakePiece();
        gitNextRef.current = gitMakePiece();
        setGitNextPiece({ ...gitNextRef.current });
        gitReadyRef.current = true;
    };

    const drawGitFrame = () => {
        const canvas = gitCanvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = GW * GCS, H = GH * GCS;
        ctx.fillStyle = '#070b13'; ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(236,72,153,0.05)'; ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += GCS) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        for (let y = 0; y <= H; y += GCS) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

        // Locked cells
        const grid = gitGridRef.current;
        const flashRows = gitFlashRowsRef.current;
        if (!grid || grid.length < GH) return;
        for (let r = 0; r < GH; r++) {
            if (!grid[r]) continue;
            for (let c = 0; c < GW; c++) {
                const cell = grid[r][c];
                if (cell) {
                    const isFlash = flashRows.includes(r);
                    ctx.save();
                    if (isFlash) {
                        ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
                        ctx.fillStyle = '#fff';
                    } else {
                        ctx.shadowBlur = 6; ctx.shadowColor = cell.color;
                        ctx.fillStyle = cell.color;
                    }
                    ctx.beginPath();
                    ctx.roundRect(c*GCS+1, r*GCS+1, GCS-2, GCS-2, 2);
                    ctx.fill();
                    if (!isFlash) {
                        ctx.fillStyle = 'rgba(0,0,0,0.5)';
                        ctx.font = `bold 4.5px monospace`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(cell.label.slice(0,2), c*GCS+GCS/2, r*GCS+GCS/2);
                    }
                    ctx.restore();
                }
            }
        }

        // Ghost piece
        const p = currentGitPieceRef.current;
        if (p) {
            const gy = gitGhostY(p, grid);
            for (let r = 0; r < p.shape.length; r++) {
                for (let c = 0; c < p.shape[r].length; c++) {
                    if (p.shape[r][c]) {
                        const gx = p.x+c, gyy = gy+r;
                        if (gyy >= 0) {
                            ctx.save();
                            ctx.globalAlpha = 0.2;
                            ctx.strokeStyle = p.color; ctx.lineWidth = 1;
                            ctx.strokeRect(gx*GCS+1, gyy*GCS+1, GCS-2, GCS-2);
                            ctx.restore();
                        }
                    }
                }
            }

            // Active piece
            for (let r = 0; r < p.shape.length; r++) {
                for (let c = 0; c < p.shape[r].length; c++) {
                    if (p.shape[r][c]) {
                        const pyy = p.y+r;
                        if (pyy >= 0) {
                            ctx.save();
                            ctx.shadowBlur = 10; ctx.shadowColor = p.color;
                            ctx.fillStyle = p.color;
                            ctx.beginPath();
                            ctx.roundRect((p.x+c)*GCS+1, pyy*GCS+1, GCS-2, GCS-2, 3);
                            ctx.fill();
                            ctx.fillStyle = 'rgba(0,0,0,0.6)';
                            ctx.font = `bold 5px monospace`;
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillText(p.label.slice(0,2), (p.x+c)*GCS+GCS/2, pyy*GCS+GCS/2);
                            ctx.restore();
                        }
                    }
                }
            }
        }
    };

    useEffect(() => {
        const keyDown = (e) => {
            if (!gitIsRunning || gitIsOver || activeTab !== 'gitmerge') return;
            switch(e.key) {
                case 'ArrowLeft': case 'a': case 'A': moveGitPiece(-1,0); e.preventDefault(); break;
                case 'ArrowRight': case 'd': case 'D': moveGitPiece(1,0); e.preventDefault(); break;
                case 'ArrowDown': case 's': case 'S': if(!moveGitPiece(0,1)){gitLockPiece();} e.preventDefault(); break;
                case 'ArrowUp': case 'w': case 'W': rotateGitPiece(); e.preventDefault(); break;
                case ' ': hardDropGitPiece(); e.preventDefault(); break;
                case 'c': case 'C': gitHold(); e.preventDefault(); break;
                default: break;
            }
        };
        window.addEventListener('keydown', keyDown);
        return () => window.removeEventListener('keydown', keyDown);
    }, [gitIsRunning, gitIsOver, activeTab]);

    useEffect(() => {
        if (activeTab !== 'gitmerge') return;
        const canvas = gitCanvasRef.current;
        if (canvas) { canvas.width = GW*GCS; canvas.height = GH*GCS; drawGitFrame(); }
        let lastTick = 0;
        const loop = (time) => {
            if (gitIsRunning && !gitIsOver) {
                const level = gitLevelRef.current;
                const ms = Math.max(80, 900 - (level-1) * 80);
                if (time - lastTick > ms) {
                    lastTick = time;
                    if (!moveGitPiece(0,1)) gitLockPiece();
                }
            }
            drawGitFrame();
            gitLoopRef.current = requestAnimationFrame(loop);
        };
        gitLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(gitLoopRef.current);
    }, [gitIsRunning, gitIsOver, activeTab]);


    // ══════════════════════════════════════════════════════════════════════════
    //  BUG INVADERS (Enhanced)
    //  • Wave system (boss wave every 5)  • Enemy formations & paths
    //  • Shield blocks  • Rapid-fire upgrade  • Score multiplier
    //  • Screen-shake on hit  • HP bars on mini-bosses
    // ══════════════════════════════════════════════════════════════════════════
    const [bugScore, setBugScore] = useState(0);
    const [bugsDefeated, setBugsDefeated] = useState(0);
    const [bugWave, setBugWave] = useState(1);
    const [bugIsRunning, setBugIsRunning] = useState(false);
    const [bugIsOver, setBugIsOver] = useState(false);
    const [bugLives, setBugLives] = useState(3);

    const bugCanvasRef       = useRef(null);
    const bugLoopRef         = useRef(null);
    const bugPlayerRef       = useRef({ x: 105, w: 22, h: 12 });
    const bugBulletsRef      = useRef([]);
    const bugEntitiesRef     = useRef([]);
    const bugParticlesRef    = useRef([]);
    const bugLogsRef         = useRef([]);
    const bugWaveRef         = useRef(1);
    const bugScoreRef        = useRef(0);
    const bugLivesRef        = useRef(3);
    const bugDefeatedRef     = useRef(0);
    const bugShakeRef        = useRef(0); // frames of shake remaining
    const bugFireCooldownRef = useRef(0);
    const bugReadyRef        = useRef(false);
    const bugKeysRef         = useRef({ left: false, right: false, fire: false });
    const [bugLogsState, setBugLogsState] = useState([]);

    const BUG_W = 260, BUG_H = 260;
    const BUG_TYPES = [
        { label:'TypeError',     color:'#f43f5e', hp:1, pts:50,  speed:0.35, w:52, h:13 },
        { label:'SyntaxError',   color:'#8b5cf6', hp:1, pts:60,  speed:0.40, w:56, h:13 },
        { label:'MemoryLeak',    color:'#eab308', hp:2, pts:100, speed:0.30, w:56, h:13 },
        { label:'NullPointer',   color:'#06b6d4', hp:2, pts:120, speed:0.45, w:58, h:13 },
        { label:'SegFault',      color:'#f97316', hp:3, pts:200, speed:0.25, w:54, h:15, isBoss:false },
    ];
    const BOSS_TYPE = { label:'KERNEL_PANIC', color:'#ef4444', hp:15, pts:1000, speed:0.15, w:80, h:20, isBoss:true };

    const logBugConsole = (text, type) => {
        bugLogsRef.current.push({ text, type });
        if (bugLogsRef.current.length > 8) bugLogsRef.current.shift();
        setBugLogsState([...bugLogsRef.current]);
    };

    const spawnBugWave = (wave) => {
        bugEntitiesRef.current = [];
        const isBossWave = wave % 5 === 0;

        if (isBossWave) {
            bugEntitiesRef.current.push({ ...BOSS_TYPE, x: BUG_W/2 - BOSS_TYPE.w/2, y: -30, maxHp: BOSS_TYPE.hp, pts: BOSS_TYPE.pts * wave });
            logBugConsole(`>>> WAVE ${wave}: BOSS ENCOUNTER - KERNEL_PANIC <<<`, 'error');
            logBugConsole(`Critical exploit detected in kernel ring-0!`, 'sys');
        } else {
            const count = 3 + wave * 2;
            const types = BUG_TYPES.slice(0, Math.min(wave, BUG_TYPES.length));
            for (let i = 0; i < count; i++) {
                const bt = types[Math.floor(Math.random() * types.length)];
                bugEntitiesRef.current.push({
                    ...bt, x: Math.random() * (BUG_W - bt.w - 10) + 5, y: -15 - i * 25,
                    maxHp: bt.hp, pts: bt.pts + wave * 10
                });
            }
            logBugConsole(`>>> WAVE ${wave}: ${count} bugs detected in heap <<<`, 'error');
        }
    };

    const spawnBugDebris = (x, y, color) => {
        for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2, s = 0.5 + Math.random() * 2.5;
            bugParticlesRef.current.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, size: 1+Math.random()*2.5, color, life: 25+Math.random()*15, alpha: 1 });
        }
    };

    const handleMoveBugPlayer = (dx) => {
        if (!bugIsRunning || bugIsOver) return;
        const p = bugPlayerRef.current;
        p.x = clamp(p.x + dx, 0, BUG_W - p.w);
    };

    const fireBugLaser = () => {
        if (!bugIsRunning || bugIsOver || activeTab !== 'buginvaders') return;
        if (bugFireCooldownRef.current > 0) return;
        const p = bugPlayerRef.current;
        bugBulletsRef.current.push({ x: p.x + p.w/2, y: BUG_H - 22, vy: -6 });
        bugFireCooldownRef.current = 8;
    };

    const initBugGame = () => {
        bugScoreRef.current = 0; bugLivesRef.current = 3; bugWaveRef.current = 1; bugDefeatedRef.current = 0;
        setBugScore(0); setBugLives(3); setBugWave(1); setBugsDefeated(0);
        setBugIsOver(false); setBugIsRunning(false);
        bugPlayerRef.current = { x: BUG_W/2 - 11, w: 22, h: 12 };
        bugBulletsRef.current = []; bugParticlesRef.current = []; bugEntitiesRef.current = [];
        bugKeysRef.current = { left: false, right: false, fire: false };
        bugFireCooldownRef.current = 0; bugShakeRef.current = 0;
        bugLogsRef.current = [{ text:'> Starting debugger runtime v3.0...', type:'sys' },{ text:'> Memory allocator initialized. 0 leaks.', type:'sys' }];
        setBugLogsState([...bugLogsRef.current]);
        spawnBugWave(1);
        bugReadyRef.current = true;
    };

    const drawBugFrame = () => {
        const canvas = bugCanvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const shake = bugShakeRef.current > 0;
        const dx = shake ? (Math.random()-0.5)*4 : 0;
        const dy = shake ? (Math.random()-0.5)*4 : 0;
        if (shake) { ctx.save(); ctx.translate(dx, dy); }

        ctx.fillStyle = '#070b13'; ctx.fillRect(-5, -5, BUG_W+10, BUG_H+10);

        // Scanlines
        for (let y = 0; y < BUG_H; y += 4) {
            ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, y, BUG_W, 2);
        }

        // Danger line
        ctx.strokeStyle = 'rgba(239,68,68,0.25)'; ctx.lineWidth = 1;
        ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(0,BUG_H-32); ctx.lineTo(BUG_W,BUG_H-32); ctx.stroke();
        ctx.setLineDash([]);

        // Player ship — neon triangle with gradient
        const p = bugPlayerRef.current;
        const shipGrad = ctx.createLinearGradient(p.x, BUG_H-22, p.x+p.w, BUG_H-10);
        shipGrad.addColorStop(0, '#10b981'); shipGrad.addColorStop(1, '#06b6d4');
        ctx.save();
        ctx.shadowBlur = 12; ctx.shadowColor = '#10b981';
        ctx.fillStyle = shipGrad;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w/2, BUG_H - 22);
        ctx.lineTo(p.x + p.w, BUG_H - 10);
        ctx.lineTo(p.x + p.w*0.65, BUG_H - 14);
        ctx.lineTo(p.x + p.w/2, BUG_H - 10);
        ctx.lineTo(p.x + p.w*0.35, BUG_H - 14);
        ctx.lineTo(p.x, BUG_H - 10);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        // Bullets
        ctx.save();
        for (const b of bugBulletsRef.current) {
            const bGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 8);
            bGrad.addColorStop(0, '#fff'); bGrad.addColorStop(1, '#06b6d4');
            ctx.shadowBlur = 6; ctx.shadowColor = '#06b6d4';
            ctx.fillStyle = bGrad;
            ctx.fillRect(b.x - 1.5, b.y, 3, 9);
        }
        ctx.restore();

        // Bugs
        for (const b of bugEntitiesRef.current) {
            ctx.save();
            ctx.shadowBlur = 8; ctx.shadowColor = b.color;
            ctx.fillStyle = 'rgba(15,23,42,0.9)';
            ctx.strokeStyle = b.color; ctx.lineWidth = b.isBoss ? 2 : 1.2;
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, b.isBoss ? 5 : 3);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = b.color;
            ctx.font = `bold ${b.isBoss ? 8 : 7}px monospace`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(b.label, b.x + b.w/2, b.y + b.h/2);

            // HP bar
            if (b.maxHp > 1) {
                const barW = b.w - 4;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(b.x+2, b.y - 5, barW, 3);
                ctx.fillStyle = b.hp / b.maxHp > 0.5 ? '#10b981' : b.hp / b.maxHp > 0.25 ? '#eab308' : '#f43f5e';
                ctx.fillRect(b.x+2, b.y - 5, barW * (b.hp / b.maxHp), 3);
            }
            ctx.restore();
        }

        // Particles
        for (let i = bugParticlesRef.current.length-1; i>=0; i--) {
            const pt = bugParticlesRef.current[i];
            pt.x+=pt.vx; pt.y+=pt.vy; pt.life--; pt.alpha = pt.life/40;
            if (pt.life<=0){bugParticlesRef.current.splice(i,1);continue;}
            ctx.save(); ctx.globalAlpha=pt.alpha; ctx.fillStyle=pt.color;
            ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.size,0,Math.PI*2); ctx.fill(); ctx.restore();
        }

        // Lives dots
        for (let i = 0; i < bugLivesRef.current; i++) {
            ctx.save();
            ctx.fillStyle = '#10b981'; ctx.shadowBlur = 5; ctx.shadowColor = '#10b981';
            ctx.beginPath(); ctx.arc(6 + i * 10, 6, 3, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        if (bugShakeRef.current > 0) { ctx.restore(); bugShakeRef.current--; }
    };

    useEffect(() => {
        const keyDown = (e) => {
            if (!bugIsRunning || bugIsOver || activeTab !== 'buginvaders') return;
            if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){bugKeysRef.current.left = true;e.preventDefault();}
            if (e.key==='ArrowRight'||e.key==='d'||e.key==='D'){bugKeysRef.current.right = true;e.preventDefault();}
            if (e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){bugKeysRef.current.fire = true;e.preventDefault();}
        };
        const keyUp = (e) => {
            if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') bugKeysRef.current.left = false;
            if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') bugKeysRef.current.right = false;
            if (e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W') bugKeysRef.current.fire = false;
        };
        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
        return () => {
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
        };
    }, [bugIsRunning, bugIsOver, activeTab]);

    useEffect(() => {
        if (activeTab !== 'buginvaders') return;
        const canvas = bugCanvasRef.current;
        if (canvas) { canvas.width = BUG_W; canvas.height = BUG_H; drawBugFrame(); }

        const loop = () => {
            if (bugIsRunning && !bugIsOver) {
                const keys = bugKeysRef.current;
                const player = bugPlayerRef.current;
                if (keys.left) player.x = clamp(player.x - 3.8, 0, BUG_W - player.w);
                if (keys.right) player.x = clamp(player.x + 3.8, 0, BUG_W - player.w);
                if (keys.fire) fireBugLaser();

                if (bugFireCooldownRef.current > 0) bugFireCooldownRef.current--;

                // Bullets
                for (let i = bugBulletsRef.current.length-1; i>=0; i--) {
                    bugBulletsRef.current[i].y += bugBulletsRef.current[i].vy;
                    if (bugBulletsRef.current[i].y < 0) bugBulletsRef.current.splice(i,1);
                }

                // Bugs
                const bugs = bugEntitiesRef.current;
                let allGone = true;
                for (let i = bugs.length-1; i>=0; i--) {
                    const b = bugs[i];
                    b.y += b.speed;
                    allGone = false;

                    if (b.y + b.h >= BUG_H - 30) {
                        bugLivesRef.current--;
                        setBugLives(bugLivesRef.current);
                        spawnBugDebris(b.x + b.w/2, b.y, b.color);
                        bugs.splice(i, 1);
                        bugShakeRef.current = 10;
                        logBugConsole(`[BREACHED] ${b.label} has crashed the compiler! -1 life`, 'error');
                        if (bugLivesRef.current <= 0) {
                            bugKeysRef.current = { left: false, right: false, fire: false };
                            setBugIsOver(true); setBugIsRunning(false); return;
                        }
                        continue;
                    }

                    for (let j = bugBulletsRef.current.length-1; j>=0; j--) {
                        const bl = bugBulletsRef.current[j];
                        if (bl.x>=b.x && bl.x<=b.x+b.w && bl.y>=b.y && bl.y<=b.y+b.h) {
                            bugBulletsRef.current.splice(j,1);
                            b.hp--;
                            spawnBugDebris(bl.x, bl.y, b.color);
                            if (b.hp <= 0) {
                                bugs.splice(i,1);
                                bugScoreRef.current += b.pts;
                                bugDefeatedRef.current++;
                                setBugScore(bugScoreRef.current);
                                setBugsDefeated(bugDefeatedRef.current);
                                logBugConsole(`[PATCHED] ${b.label} resolved. +${b.pts}pts`, 'success');
                                if (b.isBoss) logBugConsole(`>>> BOSS DEFEATED! Wave clear! <<<`, 'success');
                            }
                            break;
                        }
                    }
                }

                if (allGone || bugs.length === 0) {
                    bugWaveRef.current++;
                    setBugWave(bugWaveRef.current);
                    spawnBugWave(bugWaveRef.current);
                }
            }
            drawBugFrame();
            bugLoopRef.current = requestAnimationFrame(loop);
        };
        bugLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(bugLoopRef.current);
    }, [bugIsRunning, bugIsOver, activeTab]);


    // ══════════════════════════════════════════════════════════════════════════
    //  BYTE-FORCE TYPER (Enhanced)
    //  • Per-character highlight (green matched, red wrong)
    //  • Dynamic difficulty (more commands per wave)
    //  • WPM history sparkline  • Combo bonus  • Sound-like canvas flash
    //  • Countdown 3-2-1 before start
    // ══════════════════════════════════════════════════════════════════════════
    const [typerScore, setTyperScore] = useState(0);
    const [typerWpm, setTyperWpm] = useState(0);
    const [typerAccuracy, setTyperAccuracy] = useState(100);
    const [typerIsRunning, setTyperIsRunning] = useState(false);
    const [typerIsOver, setTyperIsOver] = useState(false);
    const [typerStackHealth, setTyperStackHealth] = useState(100);
    const [typerInput, setTyperInput] = useState('');
    const [typerCombo, setTyperCombo] = useState(0);
    const [typerWpmHistory, setTyperWpmHistory] = useState([]);

    const typerCanvasRef      = useRef(null);
    const typerLoopRef        = useRef(null);
    const typerCommandsRef    = useRef([]);
    const typerParticlesRef   = useRef([]);
    const typerStartTimeRef   = useRef(0);
    const typerCorrectRef     = useRef(0);
    const typerTotalRef       = useRef(0);
    const typerComboRef       = useRef(0);
    const typerScoreRef       = useRef(0);
    const typerStackRef       = useRef(100);
    const typerFlashRef       = useRef(0);
    const typerWpmHistRef     = useRef([]);
    const typerInputRef       = useRef('');
    const typerInputElRef     = useRef(null);
    const typerReadyRef       = useRef(false);

    const TYPER_W = 260, TYPER_H = 260;
    const TYPER_SNIPPETS = [
        'git push','git commit','npm run dev','docker run','pip install',
        'git clone','cargo build','go test','kubectl apply','terraform plan',
        'make build','yarn dev','git rebase','cat README','ls -la',
        'sudo apt update','chmod +x','export PATH','source venv','curl -O',
    ];

    const spawnTyperCommand = () => {
        const text = TYPER_SNIPPETS[Math.floor(Math.random() * TYPER_SNIPPETS.length)];
        const charW = 6.2;
        const w = text.length * charW + 10;
        const x = Math.random() * Math.max(10, TYPER_W - w - 10);
        typerCommandsRef.current.push({ text, x, y: -14, w, speed: 0.32 + Math.random() * 0.28 });
    };

    const spawnTyperBurst = (x, y, color, count = 14) => {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2, s = 0.5 + Math.random() * 2;
            typerParticlesRef.current.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, size: 1+Math.random()*2, color, life: 25+Math.random()*10, alpha:1 });
        }
    };

    const handleTyperInputChange = (e) => {
        if (!typerIsRunning || typerIsOver) return;
        const val = e.target.value;
        setTyperInput(val);
        typerInputRef.current = val;

        const cmds = typerCommandsRef.current;
        const matchIdx = cmds.findIndex(c => c.text === val.trim());

        if (matchIdx !== -1) {
            const matched = cmds[matchIdx];
            spawnTyperBurst(matched.x + matched.w/2, matched.y + 7, '#06b6d4', 20);
            typerFlashRef.current = 6;
            cmds.splice(matchIdx, 1);
            setTyperInput('');
            typerInputRef.current = '';

            typerCorrectRef.current += matched.text.length;
            typerTotalRef.current += matched.text.length;
            typerComboRef.current++;
            setTyperCombo(typerComboRef.current);

            const bonus = typerComboRef.current >= 5 ? 3 : typerComboRef.current >= 3 ? 2 : 1;
            typerScoreRef.current += matched.text.length * 10 * bonus;
            setTyperScore(typerScoreRef.current);

            const seconds = Math.max(1, (Date.now() - typerStartTimeRef.current) / 1000);
            const wpm = Math.round((typerCorrectRef.current / 5) / (seconds / 60));
            setTyperWpm(wpm);

            typerWpmHistRef.current.push(wpm);
            if (typerWpmHistRef.current.length > 20) typerWpmHistRef.current.shift();
            setTyperWpmHistory([...typerWpmHistRef.current]);

            const acc = Math.round((typerCorrectRef.current / Math.max(1, typerTotalRef.current)) * 100);
            setTyperAccuracy(acc);
        }
    };

    const initTyperGame = () => {
        setTyperScore(0); setTyperWpm(0); setTyperAccuracy(100); setTyperStackHealth(100);
        setTyperIsOver(false); setTyperIsRunning(false);
        setTyperInput(''); setTyperCombo(0); setTyperWpmHistory([]);
        typerCommandsRef.current = []; typerParticlesRef.current = [];
        typerCorrectRef.current = 0; typerTotalRef.current = 0;
        typerComboRef.current = 0; typerScoreRef.current = 0; typerStackRef.current = 100;
        typerFlashRef.current = 0; typerWpmHistRef.current = [];
        typerStartTimeRef.current = 0;
        typerInputRef.current = '';
        typerReadyRef.current = true;
    };

    const drawTyperFrame = () => {
        const canvas = typerCanvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = TYPER_W, H = TYPER_H;
        const flash = typerFlashRef.current > 0;

        ctx.fillStyle = flash ? 'rgba(6,182,212,0.1)' : '#070b13';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(6,182,212,0.04)'; ctx.lineWidth = 1;
        for (let y = 0; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

        // Danger line
        ctx.strokeStyle = 'rgba(239,68,68,0.3)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(0,H-45); ctx.lineTo(W,H-45); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(239,68,68,0.4)';
        ctx.font = '7px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('STACK FLOOR', W-4, H-45);

        // Commands
        const input = typerInputRef.current.trim();
        const cmds = typerCommandsRef.current;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        for (const c of cmds) {
            const isTarget = c.text.startsWith(input) && input.length > 0;
            ctx.save();
            ctx.shadowBlur = isTarget ? 10 : 4;
            ctx.shadowColor = isTarget ? '#06b6d4' : '#334155';
            ctx.fillStyle = 'rgba(15,23,42,0.85)';
            ctx.strokeStyle = isTarget ? '#06b6d4' : '#334155';
            ctx.lineWidth = isTarget ? 1.5 : 0.8;
            ctx.beginPath(); ctx.roundRect(c.x-3, c.y-2, c.w+6, 14, 2);
            ctx.fill(); ctx.stroke();

            // Per-character coloring
            ctx.font = 'bold 7px monospace';
            let cx = c.x;
            for (let ci = 0; ci < c.text.length; ci++) {
                const ch = c.text[ci];
                if (ci < input.length) {
                    ctx.fillStyle = c.text[ci] === input[ci] ? '#10b981' : '#f43f5e';
                } else {
                    ctx.fillStyle = isTarget ? '#a5f3fc' : '#94a3b8';
                }
                ctx.fillText(ch, cx, c.y);
                cx += ctx.measureText(ch).width;
            }
            ctx.restore();
        }

        // Particles
        for (let i = typerParticlesRef.current.length-1; i>=0; i--) {
            const pt = typerParticlesRef.current[i];
            pt.x+=pt.vx; pt.y+=pt.vy; pt.life--; pt.alpha = pt.life/30;
            if (pt.life<=0){typerParticlesRef.current.splice(i,1);continue;}
            ctx.save(); ctx.globalAlpha=pt.alpha; ctx.fillStyle=pt.color;
            ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.size,0,Math.PI*2); ctx.fill(); ctx.restore();
        }

        // WPM sparkline
        const hist = typerWpmHistRef.current;
        if (hist.length > 1) {
            const maxWpm = Math.max(...hist, 1);
            const sparkH = 18, sparkW = Math.min(hist.length * 5, W * 0.4);
            const sx = 4, sy = H - 42;
            ctx.save();
            ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1.2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            hist.forEach((v, i) => {
                const hx = sx + (i / (hist.length-1)) * sparkW;
                const hy = sy + sparkH - (v / maxWpm) * sparkH;
                i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
            });
            ctx.stroke();
            ctx.restore();
        }

        // Combo badge
        const combo = typerComboRef.current;
        if (combo > 1) {
            ctx.save();
            ctx.font = `bold ${9 + Math.min(combo,5)}px monospace`;
            ctx.fillStyle = combo >= 5 ? '#facc15' : '#a5f3fc';
            ctx.shadowBlur = combo >= 5 ? 10 : 5; ctx.shadowColor = ctx.fillStyle;
            ctx.textAlign = 'right'; ctx.textBaseline = 'top';
            ctx.fillText(`x${combo} COMBO`, W-4, 4);
            ctx.restore();
        }

        if (typerFlashRef.current > 0) typerFlashRef.current--;
    };

    useEffect(() => {
        if (activeTab !== 'typer') return;
        const canvas = typerCanvasRef.current;
        if (canvas) { canvas.width = TYPER_W; canvas.height = TYPER_H; drawTyperFrame(); }
        if (typerIsRunning && typerInputElRef.current) typerInputElRef.current.focus();
        let lastSpawn = 0;
        const loop = (time) => {
            if (typerIsRunning && !typerIsOver) {
                const level = Math.floor(typerScoreRef.current / 800) + 1;
                const spawnMs = Math.max(1000, 3200 - level * 200);
                if (time - lastSpawn > spawnMs) { lastSpawn = time; spawnTyperCommand(); if (level >= 3) spawnTyperCommand(); }

                const cmds = typerCommandsRef.current;
                for (let i = cmds.length-1; i>=0; i--) {
                    const c = cmds[i];
                    c.y += c.speed + level * 0.04;
                    if (c.y >= TYPER_H - 52) {
                        spawnTyperBurst(c.x+c.w/2, TYPER_H-45, '#f43f5e', 18);
                        cmds.splice(i, 1);
                        typerTotalRef.current += c.text.length;
                        typerComboRef.current = 0;
                        setTyperCombo(0);
                        const next = typerStackRef.current - 22;
                        typerStackRef.current = next;
                        setTyperStackHealth(next);
                        const acc = Math.round((typerCorrectRef.current / Math.max(1, typerTotalRef.current)) * 100);
                        setTyperAccuracy(acc);
                        if (next <= 0) { setTyperIsOver(true); setTyperIsRunning(false); }
                    }
                }
            }
            drawTyperFrame();
            typerLoopRef.current = requestAnimationFrame(loop);
        };
        typerLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(typerLoopRef.current);
    }, [typerIsRunning, typerIsOver, activeTab]);

    // Auto-focus input when typer starts
    useEffect(() => {
        if (typerIsRunning && typerInputElRef.current) typerInputElRef.current.focus();
    }, [typerIsRunning]);


    // ══════════════════════════════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════════════════════════════
    const tabSwitchAll = () => {
        setSnakeIsRunning(false);
        setPongIsRunning(false);
        setGitIsRunning(false);
        setBugIsRunning(false);
        setTyperIsRunning(false);
        bugKeysRef.current = { left: false, right: false, fire: false };
    };

    const handleSnakeStartPause = () => {
        if (snakeIsRunning) {
            setSnakeIsRunning(false);
            return;
        }
        if (!snakeReadyRef.current || snakeIsOver) initSnakeGame();
        setSnakeIsRunning(true);
    };

    const handlePongStartPause = () => {
        if (pongIsRunning) {
            setPongIsRunning(false);
            return;
        }
        if (!pongReadyRef.current || pongIsOver) initPongGame();
        setPongIsRunning(true);
    };

    const handleGitStartPause = () => {
        if (gitIsRunning) {
            setGitIsRunning(false);
            return;
        }
        if (!gitReadyRef.current || gitIsOver) initGitGame();
        setGitIsRunning(true);
    };

    const handleBugStartPause = () => {
        if (bugIsRunning) {
            setBugIsRunning(false);
            bugKeysRef.current = { left: false, right: false, fire: false };
            return;
        }
        if (!bugReadyRef.current || bugIsOver) initBugGame();
        setBugIsRunning(true);
    };

    const handleTyperStartPause = () => {
        if (typerIsRunning) {
            setTyperIsRunning(false);
            return;
        }
        if (!typerReadyRef.current || typerIsOver) initTyperGame();
        if (!typerStartTimeRef.current) typerStartTimeRef.current = Date.now();
        setTyperIsRunning(true);
    };

    const TABS = [
        { id:'snake',       icon:'fa-gamepad',   label: t('devArcade.tabSnake') || 'Snake'           },
        { id:'ttt',         icon:'fa-microchip', label: t('devArcade.tabTtt')   || 'Tic-Tac-Toe'     },
        { id:'pong',        icon:'fa-brain',     label: t('devArcade.tabPong')  || 'Neural Pong'      },
        { id:'gitmerge',    icon:'fa-code-branch',label:t('devArcade.tabGitMerge')||'Git Merge'       },
        { id:'buginvaders', icon:'fa-bug',        label: t('devArcade.tabBugInvaders')||'Bug Invaders'},
        { id:'typer',       icon:'fa-keyboard',  label: t('devArcade.tabTyper') || 'Byte-Force'      },
    ];

    return (
        <section id="dev-arcade" className="section-dark relative overflow-hidden" aria-labelledby="arcade-heading">
            <Lazy3DBackground><RetroBackground /></Lazy3DBackground>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20 relative z-10">

                {/* Header */}
                <motion.div className="text-center mb-8 md:mb-12"
                    initial={{ opacity:0, y:-20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
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

                {/* Tab bar */}
                <div className="flex justify-center mb-8 px-2">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 border rounded-2xl p-2.5 bg-slate-900/60 w-full max-w-5xl" style={{ borderColor:'var(--border-color)' }}>
                        {TABS.map(tab => (
                            <button key={tab.id}
                                onClick={() => { tabSwitchAll(); setActiveTab(tab.id); }}
                                className={`px-3 py-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                                    activeTab === tab.id ? 'bg-accent text-black shadow-lg' : 'text-secondary hover:text-primary hover:bg-slate-950/30'
                                }`}>
                                <i className={`fa-solid ${tab.icon} text-[10px]`} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game viewport */}
                <AnimatePresence mode="wait">

                    {/* ── SNAKE ── */}
                    {activeTab === 'snake' && (
                        <motion.div key="snake" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}}
                            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start max-w-4xl mx-auto">
                            <div className="md:col-span-5 card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.snakeTitle')}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.snakeDesc')}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[{label:t('devArcade.score'),val:snakeScore,color:'text-cyan-400'},{label:t('devArcade.highScore'),val:snakeHigh,color:'text-accent'}].map(s=>(
                                        <div key={s.label} className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">{s.label}</span>
                                            <span className={`text-lg font-black ${s.color} tabular-nums`}>{s.val}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Speed</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[{v:1,l:'Normal'},{v:2,l:'Fast'},{v:3,l:'Insane'}].map(s=>(
                                            <button key={s.v} disabled={snakeIsRunning} onClick={()=>setSnakeSpeed(s.v)}
                                                className={`py-2 rounded-lg text-xs font-bold border transition ${snakeSpeed===s.v?'bg-accent border-accent text-black':'border-slate-800 text-secondary hover:border-slate-600 disabled:opacity-40'}`}>
                                                {s.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Wrap Walls</span>
                                    <button onClick={()=>setSnakeWrap(v=>!v)} disabled={snakeIsRunning}
                                        className={`relative w-10 h-5 rounded-full border transition ${snakeWrap?'bg-accent border-accent':'border-slate-700 bg-slate-900'} disabled:opacity-40`}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${snakeWrap?'left-5.5':'left-0.5'}`} style={{left:snakeWrap?'calc(100% - 18px)':2}} />
                                    </button>
                                </div>
                                <div className="pt-1">
                                    {!snakeIsOver ? (
                                        <button onClick={handleSnakeStartPause}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5 ${snakeIsRunning?'bg-amber-500 hover:bg-amber-400 text-black':'bg-accent text-black'}`}>
                                            <i className={`fa-solid ${snakeIsRunning?'fa-pause':'fa-play'}`}/>
                                            {snakeIsRunning?t('devArcade.btnPause'):t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button onClick={handleSnakeStartPause}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5">
                                            <i className="fa-solid fa-rotate-left"/> {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                                <div className="text-[10px] text-muted space-y-0.5 border-t border-slate-800 pt-3">
                                    <p><span className="text-cyan-400">Normal</span> food = +1pt</p>
                                    <p><span className="text-yellow-400">Bonus</span> food = +3pts + combo</p>
                                    <p><span className="text-rose-500">Bomb</span> = -2pts and shrink</p>
                                </div>
                            </div>
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[300px] aspect-square bg-slate-950">
                                    <canvas ref={snakeCanvasRef} className="block aspect-square w-full"/>
                                    {!snakeIsRunning && !snakeIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            <i className="fa-solid fa-gamepad text-4xl text-accent mb-3 animate-pulse"/>
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">Neo-Snake Vaporwave</span>
                                            <span className="text-[10px] text-muted block">W/A/S/D or arrow keys / D-pad below</span>
                                            {snakeWrap && <span className="text-[10px] text-accent mt-1">Wrap-walls ON</span>}
                                        </div>
                                    )}
                                    {snakeIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl pointer-events-none">
                                            <i className="fa-solid fa-skull-crossbones text-4xl text-rose-500 mb-3"/>
                                            <span className="text-base uppercase font-black text-rose-500 block mb-1">{t('devArcade.gameOver')}</span>
                                            <span className="text-sm font-bold text-primary block">{t('devArcade.score')}: {snakeScore}</span>
                                            {snakeScore >= snakeHigh && snakeScore > 0 && <span className="text-xs text-accent font-bold mt-1">New High Score!</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 w-36 select-none">
                                    <div/><button onClick={()=>changeSnakeDir(0,-1)} className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary bg-slate-950/50"><i className="fa-solid fa-chevron-up"/></button><div/>
                                    <button onClick={()=>changeSnakeDir(-1,0)} className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary bg-slate-950/50"><i className="fa-solid fa-chevron-left"/></button>
                                    <div className="h-10 w-10 flex items-center justify-center text-[9px] font-extrabold text-muted">DIR</div>
                                    <button onClick={()=>changeSnakeDir(1,0)} className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary bg-slate-950/50"><i className="fa-solid fa-chevron-right"/></button>
                                    <div/><button onClick={()=>changeSnakeDir(0,1)} className="h-10 w-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary bg-slate-950/50"><i className="fa-solid fa-chevron-down"/></button><div/>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── TIC-TAC-TOE ── */}
                    {activeTab === 'ttt' && (
                        <motion.div key="ttt" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                <div className="card-bg border rounded-2xl p-5 flex flex-col items-center gap-5">
                                    <div className="w-full max-w-[280px]">
                                        <div className="mb-4 text-center">
                                            <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.tttTitle')}</h3>
                                            <p className="text-xs text-muted leading-relaxed">{t('devArcade.tttDesc')}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 w-full">
                                            {board.map((cell, idx) => {
                                                const isWin = winLine?.includes(idx);
                                                return (
                                                    <button key={idx} disabled={cell!==null||isAiThinking||tttWinner} onClick={()=>makeTttMove(idx)}
                                                        className={`aspect-square border rounded-2xl flex items-center justify-center text-2xl font-black transition relative overflow-hidden bg-slate-950/60 disabled:cursor-not-allowed ${
                                                            isWin ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20' :
                                                            cell===null&&!tttWinner&&!isAiThinking ? 'border-slate-800 hover:border-accent hover:bg-slate-900/40' : 'border-slate-800'
                                                        }`}>
                                                        {cell==='X' && <motion.span initial={{scale:0,rotate:-45}} animate={{scale:1,rotate:0}} className="text-cyan-400 font-extrabold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">X</motion.span>}
                                                        {cell==='O' && <motion.span initial={{scale:0,rotate:45}} animate={{scale:1,rotate:0}} className="text-rose-400 font-extrabold drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">O</motion.span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="w-full flex flex-col items-center gap-3.5 pt-2">
                                        <div className="text-center font-bold text-xs uppercase tracking-widest min-h-[1.5rem]">
                                            {!tttWinner && !isAiThinking && <span className="text-cyan-400">{t('devArcade.playerTurn')}</span>}
                                            {isAiThinking && <span className="text-rose-400 animate-pulse">{t('devArcade.aiTurn')}</span>}
                                            {tttWinner==='X' && <span className="text-emerald-400">{t('devArcade.playerWon')}</span>}
                                            {tttWinner==='O' && <span className="text-rose-500">{t('devArcade.aiWon')}</span>}
                                            {tttWinner==='draw' && <span className="text-amber-400">{t('devArcade.draw')}</span>}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center w-full max-w-xs text-[10px] font-bold text-muted uppercase">
                                            {[{l:t('devArcade.statsWins'),v:tttStats.wins,c:'text-cyan-400'},{l:t('devArcade.statsLosses'),v:tttStats.losses,c:'text-rose-400'},{l:t('devArcade.statsDraws'),v:tttStats.draws,c:'text-amber-400'}].map(s=>(
                                                <div key={s.l} className="border border-slate-900 rounded-xl p-2 bg-slate-950/20">
                                                    <span>{s.l}</span>
                                                    <span className={`block text-sm font-black pt-1 ${s.c}`}>{s.v}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={resetTttGame} className="w-full max-w-[200px] font-bold text-xs border border-slate-800 hover:bg-slate-800 text-secondary py-2.5 rounded-full transition">
                                            <i className="fa-solid fa-rotate-left mr-1.5"/>Reset Grid
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-5 card-bg border rounded-2xl p-5 space-y-4">
                                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b pb-2" style={{borderColor:'var(--border-color)'}}>
                                    {t('devArcade.telemetryTitle')}
                                </h4>
                                <div className="space-y-3 pt-1">
                                    {[
                                        {l:t('devArcade.nodesEvaluated'),v:aiTelemetry.nodes.toLocaleString(),c:'text-primary'},
                                        {l:t('devArcade.depthReached'),v:`${aiTelemetry.depth} layers`,c:'text-cyan-400'},
                                        {l:t('devArcade.latency'),v:`${aiTelemetry.latency} ms`,c:'text-accent'},
                                        {l:t('devArcade.bestScore'),v:aiTelemetry.nodes>0?aiTelemetry.score:'-',c:aiTelemetry.score>0?'text-emerald-400':aiTelemetry.score<0?'text-rose-400':'text-slate-400'},
                                    ].map(s=>(
                                        <div key={s.l} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-900">
                                            <span className="font-semibold text-secondary">{s.l}</span>
                                            <span className={`font-extrabold tabular-nums ${s.c}`}>{s.v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-950/40 text-[10px] leading-relaxed text-muted space-y-1.5">
                                    <div className="font-bold text-secondary uppercase flex items-center gap-1.5"><i className="fa-solid fa-circle-info text-accent"/>Algorithm Specs</div>
                                    <p>Recursive Minimax with Alpha-Beta pruning. Explores up to 9! = 362,880 board states at move 1, cut by 80% through pruning.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── NEURAL PONG ── */}
                    {activeTab === 'pong' && (
                        <motion.div key="pong" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}}
                            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start max-w-4xl mx-auto">
                            <div className="md:col-span-5 card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.pongTitle')||'Neural Pong'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.pongDesc')||'Challenge the neural AI paddle.'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">You</span>
                                        <span className="text-2xl font-black text-cyan-400 tabular-nums">{pongScore.player}</span>
                                    </div>
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Neural AI</span>
                                        <span className="text-2xl font-black text-rose-400 tabular-nums">{pongScore.ai}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">AI Difficulty</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['easy','medium','hard'].map(d=>(
                                            <button key={d} disabled={pongIsRunning} onClick={()=>{ setPongDifficulty(d); pongDifficultyRef.current=d; }}
                                                className={`py-2 rounded-lg text-xs font-bold border transition capitalize ${pongDifficulty===d?'bg-accent border-accent text-black':'border-slate-800 text-secondary hover:border-slate-600 disabled:opacity-40'}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-[10px] text-muted border-t border-slate-800 pt-2">
                                    First to <span className="text-accent font-bold">7 points</span> wins. Use mouse, touch, or W/S keys to control your paddle.
                                </div>
                                <div className="pt-1">
                                    {!pongIsOver ? (
                                        <button onClick={handlePongStartPause}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition flex items-center justify-center gap-1.5 ${pongIsRunning?'bg-amber-500 hover:bg-amber-400 text-black':'bg-accent text-black'}`}>
                                            <i className={`fa-solid ${pongIsRunning?'fa-pause':'fa-play'}`}/>
                                            {pongIsRunning?t('devArcade.btnPause'):t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button onClick={handlePongStartPause}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition flex items-center justify-center gap-1.5">
                                            <i className="fa-solid fa-rotate-left"/> {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[320px] bg-slate-950" style={{aspectRatio:'320/240'}}>
                                    <canvas
                                        ref={pongCanvasRef}
                                        onPointerDown={handlePongPointerMove}
                                        onPointerMove={handlePongPointerMove}
                                        className="block w-full cursor-none touch-none"
                                        style={{aspectRatio:'320/240'}}
                                    />
                                    {!pongIsRunning && !pongIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            <i className="fa-solid fa-brain text-4xl text-accent mb-3 animate-pulse"/>
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">Neural Pong</span>
                                            <span className="text-[10px] text-muted block">Use mouse, touch, or W/S to steer your blue paddle</span>
                                        </div>
                                    )}
                                    {pongIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            <i className={`fa-solid ${pongWinner==='player'?'fa-trophy':'fa-robot'} text-4xl ${pongWinner==='player'?'text-accent':'text-rose-400'} mb-3`}/>
                                            <span className={`text-base uppercase font-black block mb-1 ${pongWinner==='player'?'text-accent':'text-rose-400'}`}>
                                                {pongWinner==='player'?'YOU BEAT THE AI!':'NEURAL AI WINS!'}
                                            </span>
                                            <span className="text-sm text-primary">{pongScore.player} - {pongScore.ai}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 w-full max-w-[320px] select-none justify-center">
                                    <button onClick={()=>movePongPaddle(-24)} className="h-10 flex-1 border border-slate-800 rounded-xl active:bg-slate-800 flex items-center justify-center gap-2 text-secondary bg-slate-950/50 text-xs font-bold uppercase">
                                        <i className="fa-solid fa-chevron-up"/> Up
                                    </button>
                                    <button onClick={()=>movePongPaddle(24)} className="h-10 flex-1 border border-slate-800 rounded-xl active:bg-slate-800 flex items-center justify-center gap-2 text-secondary bg-slate-950/50 text-xs font-bold uppercase">
                                        <i className="fa-solid fa-chevron-down"/> Down
                                    </button>
                                </div>
                                <div className="card-bg border border-slate-800 rounded-xl p-3 w-full">
                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <i className="fa-solid fa-network-wired text-accent text-xs"/> Live NN Feed
                                    </h4>
                                    <div className="flex items-center justify-between gap-2 bg-slate-950/50 rounded-lg p-2">
                                        <div className="flex flex-col gap-2">
                                            {pongNN.inputs.map((v,i)=>(
                                                <div key={i} className="flex items-center gap-1.5">
                                                    <span className={`w-3.5 h-3.5 rounded-full border transition-all ${Math.abs(v)>0.3?'bg-cyan-400 border-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]':'bg-slate-900 border-slate-700'}`}/>
                                                    <span className="text-[7px] text-muted font-mono">I{i}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <svg width="40" height="70" viewBox="0 0 40 70" className="opacity-30">
                                            {pongNN.inputs.map((_,i)=>pongNN.hidden.map((_,h)=>(
                                                <line key={`${i}-${h}`} x1="0" y1={8+i*14} x2="40" y2={6+h*11} stroke="#06b6d4" strokeWidth="0.5"/>
                                            )))}
                                        </svg>
                                        <div className="flex flex-col gap-1.5">
                                            {pongNN.hidden.map((v,i)=>(
                                                <span key={i} className={`w-3 h-3 rounded-full border transition-all ${Math.abs(v)>0.4?'bg-purple-400 border-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.6)]':'bg-slate-900 border-slate-700'}`}/>
                                            ))}
                                        </div>
                                        <svg width="40" height="70" viewBox="0 0 40 70" className="opacity-30">
                                            {pongNN.hidden.map((_,h)=>pongNN.outputs.map((_,o)=>(
                                                <line key={`${h}-${o}`} x1="0" y1={6+h*11} x2="40" y2={17+o*34} stroke="#f43f5e" strokeWidth="0.5"/>
                                            )))}
                                        </svg>
                                        <div className="flex flex-col gap-4">
                                            {['UP','DN'].map((label,o)=>(
                                                <div key={o} className="flex flex-col items-center gap-0.5">
                                                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] transition-all ${pongNN.outputs[o]>(o===0?pongNN.outputs[1]:pongNN.outputs[0])?'bg-rose-400 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)] text-white':'bg-slate-900 border-slate-700 text-muted'}`}>{label}</span>
                                                    <span className="text-[6px] text-muted font-mono">{(pongNN.outputs[o]*100).toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── GIT MERGE ── */}
                    {activeTab === 'gitmerge' && (
                        <motion.div key="gitmerge" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}}
                            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start max-w-4xl mx-auto">
                            <div className="md:col-span-5 card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.gitMergeTitle')||'Git Merge'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.gitMergeDesc')||'Rotate and stack falling git commit blocks.'}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{l:'Score',v:gitScore,c:'text-cyan-400'},{l:'Lines',v:gitMergedLines,c:'text-accent'},{l:'Level',v:gitLevel,c:'text-emerald-400'}].map(s=>(
                                        <div key={s.l} className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/40 text-center">
                                            <span className="text-[9px] font-bold text-muted uppercase block mb-1">{s.l}</span>
                                            <span className={`text-sm font-black ${s.c} tabular-nums`}>{s.v}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Next + Hold */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[{label:'NEXT',piece:gitNextPiece},{label:'HOLD',piece:gitHoldPiece}].map(panel=>(
                                        <div key={panel.label} className="border border-slate-800 rounded-xl p-2 bg-slate-950/40">
                                            <span className="text-[9px] font-bold text-muted uppercase block mb-2 text-center">{panel.label} {panel.label==='HOLD'&&<span className="text-[8px] text-slate-600">[C]</span>}</span>
                                            <div className="flex items-center justify-center h-10">
                                                {panel.piece ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        {panel.piece.shape.map((row,ri)=>(
                                                            <div key={ri} className="flex gap-0.5">
                                                                {row.map((cell,ci)=>(
                                                                    <div key={ci} className={`w-3 h-3 rounded-sm ${cell?'':'opacity-0'}`} style={{backgroundColor:cell?panel.piece.color:'transparent',boxShadow:cell?`0 0 4px ${panel.piece.color}`:undefined}}/>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-[9px] text-slate-600">-</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-[9px] text-muted space-y-0.5 border-t border-slate-800 pt-2">
                                    <p><span className="text-cyan-400">A/D</span> move / <span className="text-cyan-400">W</span> rotate / <span className="text-cyan-400">S</span> soft drop</p>
                                    <p><span className="text-cyan-400">Space</span> hard drop / <span className="text-cyan-400">C</span> hold piece</p>
                                </div>
                                <div className="pt-1">
                                    {!gitIsOver ? (
                                        <button onClick={handleGitStartPause}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition flex items-center justify-center gap-1.5 ${gitIsRunning?'bg-amber-500 hover:bg-amber-400 text-black':'bg-accent text-black'}`}>
                                            <i className={`fa-solid ${gitIsRunning?'fa-pause':'fa-play'}`}/> {gitIsRunning?t('devArcade.btnPause'):t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button onClick={handleGitStartPause}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition flex items-center justify-center gap-1.5">
                                            <i className="fa-solid fa-rotate-left"/> {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>

                                {/* Mobile controls */}
                                <div className="grid grid-cols-6 gap-2 pt-1">
                                    {[
                                        {icon:'fa-chevron-left',label:'Left',fn:()=>moveGitPiece(-1,0)},
                                        {icon:'fa-rotate-right',label:'Rotate',fn:rotateGitPiece},
                                        {icon:'fa-chevron-right',label:'Right',fn:()=>moveGitPiece(1,0)},
                                        {icon:'fa-chevron-down',label:'Soft drop',fn:()=>moveGitPiece(0,1)},
                                        {icon:'fa-angles-down',label:'Hard drop',fn:hardDropGitPiece},
                                        {icon:'fa-box-archive',label:'Hold',fn:gitHold},
                                    ].map((b,i)=>(
                                        <button key={i} title={b.label} onClick={b.fn} className="h-10 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary text-sm bg-slate-950/50">
                                            <i className={`fa-solid ${b.icon}`}/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner bg-slate-950" style={{width:GW*GCS,maxWidth:'100%',aspectRatio:`${GW}/${GH}`}}>
                                    <canvas ref={gitCanvasRef} className="block w-full" style={{aspectRatio:`${GW}/${GH}`}}/>
                                    {!gitIsRunning && !gitIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            <i className="fa-brands fa-git-alt text-4xl text-accent mb-3 animate-pulse"/>
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">Git Merge Tetris</span>
                                            <span className="text-[10px] text-muted block">Stack commits. Clear branches. Rebase to win!</span>
                                        </div>
                                    )}
                                    {gitIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl pointer-events-none">
                                            <i className="fa-solid fa-bug text-3xl text-rose-500 mb-2"/>
                                            <span className="text-xs uppercase font-black text-rose-500 block mb-1">MERGE CONFLICT DETECTED!</span>
                                            <span className="text-sm text-primary">Score: {gitScore} / Lines: {gitMergedLines}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="card-bg border border-slate-800 rounded-xl p-3 w-full">
                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-2 flex items-center gap-1.5">
                                        <i className="fa-solid fa-terminal text-cyan-400 text-xs"/> {t('devArcade.gitMergeCommitTerminal')||'Commit Logs'}
                                    </h4>
                                    <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[9px] leading-relaxed min-h-[80px] max-h-[80px] overflow-hidden space-y-0.5">
                                        {terminalLogsState.map((log,i)=>(
                                            <div key={i} className={log.type==='command'?'text-cyan-400':log.type==='success'?'text-emerald-400':log.type==='error'?'text-rose-500 font-bold':'text-slate-400'}>
                                                {log.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── BUG INVADERS ── */}
                    {activeTab === 'buginvaders' && (
                        <motion.div key="buginvaders" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}}
                            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start max-w-4xl mx-auto">
                            <div className="md:col-span-5 card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.bugInvadersTitle')||'Bug Invaders'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.bugInvadersDesc')||'Shoot falling bugs before they crash your compiler!'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[{l:'Score',v:bugScore,c:'text-cyan-400'},{l:t('devArcade.bugInvadersBugsDefeated')||'Bugs Patched',v:bugsDefeated,c:'text-accent'}].map(s=>(
                                        <div key={s.l} className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                            <span className="text-[10px] font-bold text-muted uppercase block mb-1">{s.l}</span>
                                            <span className={`text-lg font-black ${s.c} tabular-nums`}>{s.v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex-1 border border-slate-800 rounded-xl p-2.5 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase block mb-1">Wave</span>
                                        <span className="text-base font-black text-rose-400">{bugWave}</span>
                                    </div>
                                    <div className="flex-1 border border-slate-800 rounded-xl p-2.5 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase block mb-1">Lives</span>
                                        <div className="flex justify-center gap-1">
                                            {[0,1,2].map(i=><i key={i} className={`fa-solid fa-heart text-sm ${i<bugLives?'text-emerald-400':'text-slate-700'}`}/>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[9px] text-muted border-t border-slate-800 pt-2 space-y-0.5">
                                    <p><span className="text-cyan-400">A/D or arrows</span> move / <span className="text-cyan-400">Space or W</span> fire</p>
                                    <p>Every 5th wave is a <span className="text-rose-400 font-bold">KERNEL_PANIC boss</span>!</p>
                                </div>
                                <div className="pt-1">
                                    {!bugIsOver ? (
                                        <button onClick={handleBugStartPause}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition flex items-center justify-center gap-1.5 ${bugIsRunning?'bg-amber-500 hover:bg-amber-400 text-black':'bg-accent text-black'}`}>
                                            <i className={`fa-solid ${bugIsRunning?'fa-pause':'fa-play'}`}/> {bugIsRunning?t('devArcade.btnPause'):t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button onClick={handleBugStartPause}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition flex items-center justify-center gap-1.5">
                                            <i className="fa-solid fa-rotate-left"/> {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[260px] aspect-square bg-slate-950">
                                    <canvas ref={bugCanvasRef} className="block w-full aspect-square"/>
                                    {!bugIsRunning && !bugIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            <i className="fa-solid fa-bug text-4xl text-accent mb-3 animate-pulse"/>
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">Bug Invaders</span>
                                            <span className="text-[10px] text-muted block">Survive escalating bug waves. Boss every 5th!</span>
                                        </div>
                                    )}
                                    {bugIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl pointer-events-none">
                                            <i className="fa-solid fa-skull-crossbones text-4xl text-rose-500 mb-2"/>
                                            <span className="text-sm uppercase font-black text-rose-500 block mb-1">COMPILER CRASHED!</span>
                                            <span className="text-xs text-primary">Bugs patched: {bugsDefeated} / Wave: {bugWave}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 w-full max-w-[260px] select-none justify-center">
                                    <button onClick={()=>handleMoveBugPlayer(-18)} className="h-11 w-14 border border-slate-800 rounded-xl active:bg-slate-800 flex items-center justify-center text-secondary bg-slate-950/50 text-base">
                                        <i className="fa-solid fa-chevron-left"/>
                                    </button>
                                    <button onClick={fireBugLaser} className="h-11 flex-1 border border-cyan-700/40 bg-cyan-950/30 rounded-xl active:bg-cyan-900/50 flex items-center justify-center text-cyan-400 font-black text-xs tracking-widest uppercase">
                                        <i className="fa-solid fa-bolt mr-1.5"/> FIRE
                                    </button>
                                    <button onClick={()=>handleMoveBugPlayer(18)} className="h-11 w-14 border border-slate-800 rounded-xl active:bg-slate-800 flex items-center justify-center text-secondary bg-slate-950/50 text-base">
                                        <i className="fa-solid fa-chevron-right"/>
                                    </button>
                                </div>
                                <div className="card-bg border border-slate-800 rounded-xl p-3 w-full">
                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-2 flex items-center gap-1.5">
                                        <i className="fa-solid fa-bug-slash text-rose-400 text-xs"/> {t('devArcade.bugInvadersConsole')||'Debug Stream'}
                                    </h4>
                                    <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[9px] min-h-[80px] max-h-[80px] overflow-hidden space-y-0.5">
                                        {bugLogsState.map((log,i)=>(
                                            <div key={i} className={log.type==='success'?'text-emerald-400':log.type==='error'?'text-rose-500 font-bold animate-pulse':'text-slate-400'}>
                                                {log.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── BYTE-FORCE TYPER ── */}
                    {activeTab === 'typer' && (
                        <motion.div key="typer" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}}
                            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start max-w-4xl mx-auto">
                            <div className="md:col-span-5 card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.typerTitle')||'Byte-Force'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.typerDesc')||'Type the falling terminal commands before they crash the stack!'}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{l:'Score',v:typerScore,c:'text-cyan-400'},{l:t('devArcade.typerWpm')||'WPM',v:typerWpm,c:'text-emerald-400'},{l:t('devArcade.typerAccuracy')||'Acc%',v:`${typerAccuracy}%`,c:'text-amber-400'}].map(s=>(
                                        <div key={s.l} className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/40 text-center">
                                            <span className="text-[9px] font-bold text-muted uppercase block mb-1">{s.l}</span>
                                            <span className={`text-sm font-black ${s.c} tabular-nums`}>{s.v}</span>
                                        </div>
                                    ))}
                                </div>
                                {typerCombo > 1 && (
                                    <div className={`text-center text-xs font-black py-1.5 rounded-lg border transition ${typerCombo>=5?'border-yellow-400 text-yellow-400 bg-yellow-400/10':'border-cyan-600 text-cyan-400 bg-cyan-400/10'}`}>
                                        <i className="fa-solid fa-fire mr-1"/> x{typerCombo} Combo Bonus
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold text-secondary uppercase">
                                        <span>Stack Buffer Health</span>
                                        <span className={typerStackHealth>40?'text-emerald-400':'text-rose-500 animate-pulse'}>{typerStackHealth}%</span>
                                    </div>
                                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                        <motion.div className={`h-full ${typerStackHealth>50?'bg-emerald-500':typerStackHealth>25?'bg-amber-500':'bg-rose-500'}`}
                                            animate={{width:`${typerStackHealth}%`}} transition={{duration:0.3}}/>
                                    </div>
                                </div>
                                <div className="pt-1">
                                    {!typerIsOver ? (
                                        <button onClick={handleTyperStartPause}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition flex items-center justify-center gap-1.5 ${typerIsRunning?'bg-amber-500 hover:bg-amber-400 text-black':'bg-accent text-black'}`}>
                                            <i className={`fa-solid ${typerIsRunning?'fa-pause':'fa-play'}`}/> {typerIsRunning?t('devArcade.btnPause'):t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button onClick={handleTyperStartPause}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition flex items-center justify-center gap-1.5">
                                            <i className="fa-solid fa-rotate-left"/> {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
            {/* WPM History sparkline */}
                                {typerWpmHistory.length > 1 && (
                                    <div className="border-t border-slate-800 pt-3">
                                        <span className="text-[9px] font-bold text-muted uppercase block mb-1">WPM History</span>
                                        <svg width="100%" height="32" viewBox={`0 0 ${Math.max(typerWpmHistory.length, 2)} 32`} preserveAspectRatio="none">
                                            <polyline fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7"
                                                points={typerWpmHistory.map((v,i)=>{
                                                    const mx = Math.max(...typerWpmHistory, 1);
                                                    return `${i},${32 - (v/mx)*30}`;
                                                }).join(' ')}/>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[260px] aspect-square bg-slate-950">
                                    <canvas ref={typerCanvasRef} className="block w-full aspect-square"/>
                                    {!typerIsRunning && !typerIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            <i className="fa-solid fa-keyboard text-4xl text-accent mb-3 animate-pulse"/>
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">Byte-Force Typer</span>
                                            <span className="text-[10px] text-muted block">Type falling commands below. Combos multiply your score!</span>
                                        </div>
                                    )}
                                    {typerIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl pointer-events-none">
                                            <i className="fa-solid fa-fire text-3xl text-rose-500 mb-2"/>
                                            <span className="text-xs uppercase font-black text-rose-500 block mb-1">STACK OVERFLOW!</span>
                                            <span className="text-[10px] text-primary">WPM: {typerWpm} / Accuracy: {typerAccuracy}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="w-full max-w-[260px] space-y-2">
                                    <label className="text-[9px] font-bold text-secondary uppercase tracking-widest block">
                                        {t('devArcade.typerActiveCommand')||'Type commands here'}
                                    </label>
                                    <input
                                        ref={typerInputElRef}
                                        type="text"
                                        disabled={!typerIsRunning || typerIsOver}
                                        value={typerInput}
                                        onChange={handleTyperInputChange}
                                        placeholder={typerIsRunning ? "Type the falling command..." : "Start game to play"}
                                        autoComplete="off"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        className="w-full text-xs font-mono font-bold rounded-xl input-bg border border-slate-700 px-3.5 py-3 focus:border-cyan-400 outline-none placeholder:text-muted transition"
                                    />
                                    {typerIsRunning && typerInput && (
                                        <div className="text-[9px] font-mono text-slate-500 px-1">
                                            {typerCommandsRef.current.filter(c=>c.text.startsWith(typerInput.trim())).length > 0 ?
                                                <span className="text-cyan-400">Matching a command...</span> :
                                                <span className="text-rose-400">No match yet - keep typing</span>
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </section>
    );
}
