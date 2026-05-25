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

    const runAiMinimax = (currentBoard) => {
        const start = performance.now();
        let nodesEvaluated = 0;

        const minimax = (tempBoard, depth, isMax, alpha, beta) => {
            nodesEvaluated++;
            const score = evaluateBoard(tempBoard);

            if (score === 10) return score - depth;
            if (score === -10) return score + depth;
            if (!tempBoard.includes(null)) return 0;

            if (isMax) {
                let best = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (tempBoard[i] === null) {
                        tempBoard[i] = 'O';
                        const val = minimax(tempBoard, depth + 1, false, alpha, beta);
                        tempBoard[i] = null;
                        best = Math.max(best, val);
                        alpha = Math.max(alpha, val);
                        if (beta <= alpha) break;
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
                        if (beta <= alpha) break;
                    }
                }
                return best;
            }
        };

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

        if (bestMove !== -1) {
            const nextBoard = [...currentBoard];
            nextBoard[bestMove] = 'O';
            setBoard(nextBoard);

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


    // ==========================================
    // NEURAL PONG STATES & ENGINE
    // ==========================================
    const [pongScore, setPongScore] = useState({ player: 0, ai: 0 });
    const [pongIsRunning, setPongIsRunning] = useState(false);
    const [pongIsOver, setPongIsOver] = useState(false);
    const [pongWinner, setPongWinner] = useState(null); // 'player' or 'ai'
    
    const pongCanvasRef = useRef(null);
    const pongLoopRef = useRef(null);
    
    // Physics values
    const pongBallRef = useRef({ x: 200, y: 130, vx: 3, vy: 1.5, r: 6 });
    const pongPlayerPaddleRef = useRef({ y: 100, h: 50 });
    const pongAiPaddleRef = useRef({ y: 100, h: 50 });
    const pongParticlesRef = useRef([]);
    const pongWidth = 300;
    const pongHeight = 250;
    const pongPaddleWidth = 8;
    
    // Simulated neural network activations for live visualization
    const [pongNN, setPongNN] = useState({
        inputs: [0, 0, 0, 0], // [BallY, PaddleY, BallVX, BallVY]
        hidden: [0, 0, 0, 0, 0],
        outputs: [0, 0] // [Up, Down]
    });
    
    // Control bindings
    const handlePongMouseMove = (e) => {
        if (!pongIsRunning || pongIsOver || activeTab !== 'pong') return;
        const canvas = pongCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientY = e.clientY - rect.top;
        const relativeY = (clientY / rect.height) * pongHeight;
        
        pongPlayerPaddleRef.current.y = Math.max(0, Math.min(pongHeight - pongPlayerPaddleRef.current.h, relativeY - pongPlayerPaddleRef.current.h / 2));
    };

    // Spawn neon particle burst
    const spawnPongParticles = (x, y, color) => {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 2.5;
            pongParticlesRef.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 2.5,
                color,
                alpha: 1.0,
                life: 25 + Math.floor(Math.random() * 15)
            });
        }
    };

    // Heuristic neural network simulation AI tracking
    const updatePongAi = (ball, paddleY, paddleH) => {
        const nBallY = (ball.y / pongHeight) * 2 - 1;
        const nPaddleY = ((paddleY + paddleH/2) / pongHeight) * 2 - 1;
        const nBallVX = ball.vx / 5;
        const nBallVY = ball.vy / 5;
        
        const hiddenWeights = [
            [0.8, -0.5, 0.2, 0.1],
            [-0.3, 0.9, -0.4, 0.5],
            [0.5, -0.6, 0.8, -0.2],
            [-0.7, 0.4, 0.3, 0.9],
            [0.1, -0.2, -0.5, 0.6]
        ];
        
        const hidden = hiddenWeights.map(weights => {
            const sum = weights[0] * nBallY + weights[1] * nPaddleY + weights[2] * nBallVX + weights[3] * nBallVY;
            return Math.tanh(sum);
        });
        
        const outWeightsUp = [0.9, -0.8, 0.5, -0.6, 0.3];
        const outWeightsDown = [-0.9, 0.8, -0.5, 0.6, -0.3];
        
        const sumUp = hidden.reduce((sum, h, idx) => sum + h * outWeightsUp[idx], 0);
        const sumDown = hidden.reduce((sum, h, idx) => sum + h * outWeightsDown[idx], 0);
        
        const actUp = Math.exp(sumUp) / (Math.exp(sumUp) + Math.exp(sumDown));
        const actDown = 1 - actUp;
        
        setPongNN({
            inputs: [nBallY, nPaddleY, nBallVX, nBallVY],
            hidden,
            outputs: [actUp, actDown]
        });
        
        const speed = 3.2;
        if (actUp > actDown + 0.05) {
            return -speed;
        } else if (actDown > actUp + 0.05) {
            return speed;
        }
        return 0;
    };

    const initPongGame = () => {
        setPongScore({ player: 0, ai: 0 });
        setPongIsOver(false);
        setPongWinner(null);
        setPongIsRunning(false);
        pongBallRef.current = { x: 150, y: 125, vx: 2.5, vy: 1.2, r: 5 };
        pongPlayerPaddleRef.current = { y: 100, h: 50 };
        pongAiPaddleRef.current = { y: 100, h: 50 };
        pongParticlesRef.current = [];
    };

    const drawPongFrame = () => {
        const canvas = pongCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, pongWidth, pongHeight);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pongWidth / 2, 0);
        ctx.lineTo(pongWidth / 2, pongHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw paddles
        // Player
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#06b6d4';
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(8, pongPlayerPaddleRef.current.y, pongPaddleWidth, pongPlayerPaddleRef.current.h);
        ctx.restore();
        
        // AI
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f43f5e';
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(pongWidth - 8 - pongPaddleWidth, pongAiPaddleRef.current.y, pongPaddleWidth, pongAiPaddleRef.current.h);
        ctx.restore();
        
        // Draw Ball
        const ball = pongBallRef.current;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#eab308';
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw particles
        const particles = pongParticlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = p.life / 40;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    };

    // Pong Loop
    useEffect(() => {
        if (activeTab !== 'pong') return;
        const canvas = pongCanvasRef.current;
        if (canvas) {
            canvas.width = pongWidth;
            canvas.height = pongHeight;
            drawPongFrame();
        }
        
        const loop = () => {
            if (pongIsRunning && !pongIsOver) {
                const ball = pongBallRef.current;
                const pPaddle = pongPlayerPaddleRef.current;
                const aPaddle = pongAiPaddleRef.current;
                
                ball.x += ball.vx;
                ball.y += ball.vy;
                
                if (ball.y - ball.r <= 0) {
                    ball.y = ball.r;
                    ball.vy = -ball.vy;
                    spawnPongParticles(ball.x, ball.y, '#eab308');
                } else if (ball.y + ball.r >= pongHeight) {
                    ball.y = pongHeight - ball.r;
                    ball.vy = -ball.vy;
                    spawnPongParticles(ball.x, ball.y, '#eab308');
                }
                
                const aiDir = updatePongAi(ball, aPaddle.y, aPaddle.h);
                aPaddle.y = Math.max(0, Math.min(pongHeight - aPaddle.h, aPaddle.y + aiDir));
                
                // Paddle player collide
                if (ball.vx < 0 && ball.x - ball.r <= 16 && ball.x - ball.r >= 8) {
                    if (ball.y >= pPaddle.y && ball.y <= pPaddle.y + pPaddle.h) {
                        ball.x = 16 + ball.r;
                        const relativeHit = (ball.y - (pPaddle.y + pPaddle.h/2)) / (pPaddle.h/2);
                        ball.vx = -ball.vx * 1.05;
                        ball.vy = relativeHit * 3.0;
                        spawnPongParticles(ball.x - ball.r, ball.y, '#06b6d4');
                    }
                }
                
                // Paddle AI collide
                if (ball.vx > 0 && ball.x + ball.r >= pongWidth - 16 && ball.x + ball.r <= pongWidth - 8) {
                    if (ball.y >= aPaddle.y && ball.y <= aPaddle.y + aPaddle.h) {
                        ball.x = pongWidth - 16 - ball.r;
                        const relativeHit = (ball.y - (aPaddle.y + aPaddle.h/2)) / (aPaddle.h/2);
                        ball.vx = -ball.vx * 1.05;
                        ball.vy = relativeHit * 3.0;
                        spawnPongParticles(ball.x + ball.r, ball.y, '#f43f5e');
                    }
                }
                
                if (ball.x < 0) {
                    setPongScore(prev => {
                        const next = { ...prev, ai: prev.ai + 1 };
                        if (next.ai >= 5) {
                            setPongIsOver(true);
                            setPongIsRunning(false);
                            setPongWinner('ai');
                        } else {
                            pongBallRef.current = { x: 150, y: 125, vx: 2.5, vy: (Math.random() * 2 - 1) * 1.2, r: 5 };
                        }
                        return next;
                    });
                } else if (ball.x > pongWidth) {
                    setPongScore(prev => {
                        const next = { ...prev, player: prev.player + 1 };
                        if (next.player >= 5) {
                            setPongIsOver(true);
                            setPongIsRunning(false);
                            setPongWinner('player');
                        } else {
                            pongBallRef.current = { x: 150, y: 125, vx: -2.5, vy: (Math.random() * 2 - 1) * 1.2, r: 5 };
                        }
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


    // ==========================================
    // GIT MERGE (TETRIS) STATES & ENGINE
    // ==========================================
    const [gitScore, setGitScore] = useState(0);
    const [gitMergedLines, setGitMergedLines] = useState(0);
    const [gitIsRunning, setGitIsRunning] = useState(false);
    const [gitIsOver, setGitIsOver] = useState(false);
    
    const gitCanvasRef = useRef(null);
    const gitLoopRef = useRef(null);
    
    const gitGridRef = useRef(Array(20).fill(null).map(() => Array(10).fill(null)));
    
    const gitBlocks = [
        { shape: [[1, 1, 1, 1]], color: '#06b6d4', label: 'feat' }, 
        { shape: [[1, 1, 1], [0, 1, 0]], color: '#f43f5e', label: 'fix' }, 
        { shape: [[1, 1], [1, 1]], color: '#10b981', label: 'hotfix' }, 
        { shape: [[1, 1, 0], [0, 1, 1]], color: '#eab308', label: 'docs' }, 
        { shape: [[0, 1, 1], [1, 1, 0]], color: '#8b5cf6', label: 'refactor' } 
    ];
    
    const currentGitPieceRef = useRef(null);
    const gitTerminalLogsRef = useRef([
        { text: '$ git init', type: 'command' },
        { text: 'Initialized empty Git repository in /arcade/', type: 'system' }
    ]);
    
    const [terminalLogsState, setTerminalLogsState] = useState([]);
    
    const spawnGitPiece = () => {
        const idx = Math.floor(Math.random() * gitBlocks.length);
        const template = gitBlocks[idx];
        currentGitPieceRef.current = {
            shape: template.shape,
            color: template.color,
            label: template.label,
            x: 3,
            y: 0
        };
    };
    
    const checkGitCollision = (px, py, shape) => {
        const grid = gitGridRef.current;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const nextX = px + c;
                    const nextY = py + r;
                    
                    if (nextX < 0 || nextX >= 10 || nextY >= 20) return true;
                    if (nextY >= 0 && grid[nextY][nextX]) return true;
                }
            }
        }
        return false;
    };
    
    const rotateGitPiece = () => {
        if (!gitIsRunning || gitIsOver || !currentGitPieceRef.current) return;
        const p = currentGitPieceRef.current;
        
        const rotated = Array(p.shape[0].length).fill(null).map(() => Array(p.shape.length).fill(0));
        for (let r = 0; r < p.shape.length; r++) {
            for (let c = 0; c < p.shape[r].length; c++) {
                rotated[c][p.shape.length - 1 - r] = p.shape[r][c];
            }
        }
        
        if (!checkGitCollision(p.x, p.y, rotated)) {
            p.shape = rotated;
        }
    };
    
    const moveGitPiece = (dx, dy) => {
        if (!gitIsRunning || gitIsOver || !currentGitPieceRef.current) return;
        const p = currentGitPieceRef.current;
        if (!checkGitCollision(p.x + dx, p.y + dy, p.shape)) {
            p.x += dx;
            p.y += dy;
            return true;
        }
        return false;
    };
    
    const logGitTerminal = (text, type = 'log') => {
        gitTerminalLogsRef.current.push({ text, type });
        if (gitTerminalLogsRef.current.length > 7) {
            gitTerminalLogsRef.current.shift();
        }
        setTerminalLogsState([...gitTerminalLogsRef.current]);
    };
    
    const lockGitPiece = () => {
        const p = currentGitPieceRef.current;
        const grid = gitGridRef.current;
        
        for (let r = 0; r < p.shape.length; r++) {
            for (let c = 0; c < p.shape[r].length; c++) {
                if (p.shape[r][c]) {
                    const gy = p.y + r;
                    const gx = p.x + c;
                    if (gy >= 0) {
                        grid[gy][gx] = { color: p.color, label: p.label };
                    }
                }
            }
        }
        
        const commitMessages = [
            `feat: implement modern web framework`,
            `fix: solve memory leaking event listeners`,
            `hotfix: patch critical zero-day stack vulnerability`,
            `docs: write beautiful code comments`,
            `refactor: optimize rendering loop to 60fps`,
            `chore: remove duplicate bundle imports`
        ];
        const randomMsg = commitMessages[Math.floor(Math.random() * commitMessages.length)];
        logGitTerminal(`$ git commit -m "${randomMsg}"`, 'command');
        logGitTerminal(`[${p.label} ${Math.floor(Math.random() * 9000 + 1000).toString(16)}] committed successfully.`, 'success');
        
        let linesCleared = 0;
        for (let r = 20 - 1; r >= 0; r--) {
            const isFull = grid[r].every(cell => cell !== null);
            if (isFull) {
                linesCleared++;
                grid.splice(r, 1);
                grid.unshift(Array(10).fill(null));
                r++;
            }
        }
        
        if (linesCleared > 0) {
            setGitMergedLines(prev => prev + linesCleared);
            setGitScore(prev => prev + linesCleared * 100);
            logGitTerminal(`$ git merge & rebase -s clear`, 'command');
            logGitTerminal(`[SUCCESS] Merged and resolved ${linesCleared} branch conflict(s)!`, 'success');
        }
        
        spawnGitPiece();
        if (checkGitCollision(currentGitPieceRef.current.x, currentGitPieceRef.current.y, currentGitPieceRef.current.shape)) {
            setGitIsOver(true);
            setGitIsRunning(false);
            logGitTerminal(`[CRITICAL] STACK COLLISION ENCOUNTERED!`, 'error');
            logGitTerminal(`Run git reset --hard to try again.`, 'system');
        }
    };
    
    const initGitGame = () => {
        gitGridRef.current = Array(20).fill(null).map(() => Array(10).fill(null));
        setGitScore(0);
        setGitMergedLines(0);
        setGitIsOver(false);
        setGitIsRunning(false);
        gitTerminalLogsRef.current = [
            { text: '$ git init', type: 'command' },
            { text: 'Initialized empty Git repository in /arcade/', type: 'system' }
        ];
        setTerminalLogsState([...gitTerminalLogsRef.current]);
        spawnGitPiece();
    };
    
    const gitCellSize = 13; 
    const drawGitFrame = () => {
        const canvas = gitCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const W = canvas.width;
        const H = canvas.height;
        
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, W, H);
        
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += gitCellSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y <= H; y += gitCellSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        
        const grid = gitGridRef.current;
        for (let r = 0; r < 20; r++) {
            for (let c = 0; c < 10; c++) {
                const cell = grid[r][c];
                if (cell) {
                    ctx.save();
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = cell.color;
                    ctx.fillStyle = cell.color;
                    ctx.beginPath();
                    ctx.roundRect(c * gitCellSize + 1, r * gitCellSize + 1, gitCellSize - 2, gitCellSize - 2, 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 4.5px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(cell.label.slice(0, 2), c * gitCellSize + gitCellSize/2, r * gitCellSize + gitCellSize/2 + 1.5);
                    ctx.restore();
                }
            }
        }
        
        const p = currentGitPieceRef.current;
        if (p) {
            for (let r = 0; r < p.shape.length; r++) {
                for (let c = 0; c < p.shape[r].length; c++) {
                    if (p.shape[r][c]) {
                        const px = (p.x + c) * gitCellSize;
                        const py = (p.y + r) * gitCellSize;
                        if (py >= 0) {
                            ctx.save();
                            ctx.shadowBlur = 8;
                            ctx.shadowColor = p.color;
                            ctx.fillStyle = p.color;
                            ctx.beginPath();
                            ctx.roundRect(px + 1, py + 1, gitCellSize - 2, gitCellSize - 2, 2);
                            ctx.fill();
                            
                            ctx.fillStyle = '#000000';
                            ctx.font = 'bold 4.5px monospace';
                            ctx.textAlign = 'center';
                            ctx.fillText(p.label.slice(0, 2), px + gitCellSize/2, py + gitCellSize/2 + 1.5);
                            ctx.restore();
                        }
                    }
                }
            }
        }
    };
    
    useEffect(() => {
        const handleGitKeyDown = (e) => {
            if (!gitIsRunning || gitIsOver || activeTab !== 'gitmerge') return;
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    moveGitPiece(-1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    moveGitPiece(1, 0);
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    moveGitPiece(0, 1);
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    rotateGitPiece();
                    e.preventDefault();
                    break;
                case ' ':
                    while (moveGitPiece(0, 1)) {}
                    lockGitPiece();
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        };
        
        window.addEventListener('keydown', handleGitKeyDown);
        return () => window.removeEventListener('keydown', handleGitKeyDown);
    }, [gitIsRunning, gitIsOver, activeTab]);
    
    useEffect(() => {
        if (activeTab !== 'gitmerge') return;
        const canvas = gitCanvasRef.current;
        if (canvas) {
            canvas.width = 10 * gitCellSize;
            canvas.height = 20 * gitCellSize;
            drawGitFrame();
        }
        
        let lastTime = 0;
        const loop = (time) => {
            if (!lastTime) lastTime = time;
            const elapsed = time - lastTime;
            
            if (gitIsRunning && !gitIsOver) {
                const speedLimit = Math.max(150, 750 - gitScore * 0.4);
                if (elapsed > speedLimit) {
                    lastTime = time;
                    const moved = moveGitPiece(0, 1);
                    if (!moved) {
                        lockGitPiece();
                    }
                }
            }
            
            drawGitFrame();
            gitLoopRef.current = requestAnimationFrame(loop);
        };
        
        gitLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(gitLoopRef.current);
    }, [gitIsRunning, gitIsOver, gitScore, activeTab]);


    // ==========================================
    // BUG INVADERS (SPACE DEBUGGER) ENGINE
    // ==========================================
    const [bugScore, setBugScore] = useState(0);
    const [bugsDefeated, setBugsDefeated] = useState(0);
    const [bugIsRunning, setBugIsRunning] = useState(false);
    const [bugIsOver, setBugIsOver] = useState(false);
    
    const bugCanvasRef = useRef(null);
    const bugLoopRef = useRef(null);
    
    const bugPlayerRef = useRef({ x: 115, w: 20, h: 10 });
    const bugBulletsRef = useRef([]);
    const bugEntitiesRef = useRef([]);
    const bugParticlesRef = useRef([]);
    const bugLogsRef = useRef([
        { text: 'Starting debugger...', type: 'sys' },
        { text: 'Memory status: nominal. Compile successful.', type: 'sys' }
    ]);
    const [bugLogsState, setBugLogsState] = useState([]);
    
    const bugWidth = 250;
    const bugHeight = 250;
    
    const handleMoveBugPlayer = (dx) => {
        if (!bugIsRunning || bugIsOver) return;
        const p = bugPlayerRef.current;
        p.x = Math.max(0, Math.min(bugWidth - p.w, p.x + dx));
    };
    
    const fireBugLaser = () => {
        if (!bugIsRunning || bugIsOver || activeTab !== 'buginvaders') return;
        const p = bugPlayerRef.current;
        bugBulletsRef.current.push({
            x: p.x + p.w / 2,
            y: bugHeight - 20,
            vy: -4.5
        });
    };
    
    const logBugConsole = (text, type = 'info') => {
        bugLogsRef.current.push({ text, type });
        if (bugLogsRef.current.length > 7) {
            bugLogsRef.current.shift();
        }
        setBugLogsState([...bugLogsRef.current]);
    };
    
    const spawnBugEntity = () => {
        const bugLabels = [
            { text: 'TypeError', color: '#f43f5e', hp: 1 },
            { text: 'SyntaxError', color: '#8b5cf6', hp: 1 },
            { text: 'MemoryLeak', color: '#eab308', hp: 2 },
            { text: 'MergeConflict', color: '#06b6d4', hp: 2 }
        ];
        const template = bugLabels[Math.floor(Math.random() * bugLabels.length)];
        
        bugEntitiesRef.current.push({
            x: Math.random() * (bugWidth - 60) + 10,
            y: -15,
            w: 48,
            h: 12,
            vy: 0.35 + Math.random() * 0.45,
            label: template.text,
            color: template.color,
            hp: template.hp
        });
    };
    
    const spawnBugDebris = (x, y, color) => {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2.0;
            bugParticlesRef.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                color,
                life: 20 + Math.random() * 15,
                alpha: 1
            });
        }
    };
    
    const initBugGame = () => {
        setBugScore(0);
        setBugsDefeated(0);
        setBugIsOver(false);
        setBugIsRunning(false);
        bugPlayerRef.current = { x: 115, w: 20, h: 10 };
        bugBulletsRef.current = [];
        bugEntitiesRef.current = [];
        bugParticlesRef.current = [];
        bugLogsRef.current = [
            { text: 'Starting debugger...', type: 'sys' },
            { text: 'Memory status: nominal. Compile successful.', type: 'sys' }
        ];
        setBugLogsState([...bugLogsRef.current]);
    };
    
    const drawBugFrame = () => {
        const canvas = bugCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, bugWidth, bugHeight);
        
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)';
        ctx.lineWidth = 1;
        for (let y = 0; y < bugHeight; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(bugWidth, y); ctx.stroke();
        }
        
        const p = bugPlayerRef.current;
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(p.x, bugHeight - 10);
        ctx.lineTo(p.x + p.w / 2, bugHeight - 20);
        ctx.lineTo(p.x + p.w, bugHeight - 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        const bullets = bugBulletsRef.current;
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.0;
        for (const b of bullets) {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x, b.y + 6);
            ctx.stroke();
        }
        ctx.restore();
        
        const bugs = bugEntitiesRef.current;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (const b of bugs) {
            ctx.save();
            ctx.shadowBlur = 6;
            ctx.shadowColor = b.color;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 1.0;
            
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 3);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = b.color;
            ctx.font = 'bold 7px monospace';
            ctx.fillText(b.label, b.x + b.w/2, b.y + b.h/2);
            ctx.restore();
        }
        
        const particles = bugParticlesRef.current;
        for (const pt of particles) {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    };
    
    useEffect(() => {
        const handleBugKeyDown = (e) => {
            if (!bugIsRunning || bugIsOver || activeTab !== 'buginvaders') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                handleMoveBugPlayer(-12);
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                handleMoveBugPlayer(12);
                e.preventDefault();
            } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                fireBugLaser();
                e.preventDefault();
            }
        };
        
        window.addEventListener('keydown', handleBugKeyDown);
        return () => window.removeEventListener('keydown', handleBugKeyDown);
    }, [bugIsRunning, bugIsOver, activeTab]);
    
    useEffect(() => {
        if (activeTab !== 'buginvaders') return;
        const canvas = bugCanvasRef.current;
        if (canvas) {
            canvas.width = bugWidth;
            canvas.height = bugHeight;
            drawBugFrame();
        }
        
        let lastSpawn = 0;
        const loop = (time) => {
            if (bugIsRunning && !bugIsOver) {
                const bullets = bugBulletsRef.current;
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const b = bullets[i];
                    b.y += b.vy;
                    if (b.y < 0) {
                        bullets.splice(i, 1);
                    }
                }
                
                if (time - lastSpawn > Math.max(1200, 3000 - bugScore * 2.5)) {
                    lastSpawn = time;
                    spawnBugEntity();
                }
                
                const bugs = bugEntitiesRef.current;
                for (let i = bugs.length - 1; i >= 0; i--) {
                    const b = bugs[i];
                    b.y += b.vy;
                    
                    if (b.y + b.h >= bugHeight - 20) {
                        setBugIsOver(true);
                        setBugIsRunning(false);
                        logBugConsole(`[ERROR] COMPILER OVERLOADED BY ${b.label.toUpperCase()}!`, 'error');
                        logBugConsole(`Compile failed: stack overflow.`, 'sys');
                        break;
                    }
                    
                    for (let j = bullets.length - 1; j >= 0; j--) {
                        const bl = bullets[j];
                        if (bl.x >= b.x && bl.x <= b.x + b.w && bl.y >= b.y && bl.y <= b.y + b.h) {
                            bullets.splice(j, 1);
                            b.hp--;
                            spawnBugDebris(bl.x, bl.y, b.color);
                            
                            if (b.hp <= 0) {
                                bugs.splice(i, 1);
                                setBugScore(prev => prev + 50);
                                setBugsDefeated(prev => prev + 1);
                                logBugConsole(`[RESOLVED] ${b.label} successfully patched.`, 'success');
                                break;
                            }
                        }
                    }
                }
                
                const particles = bugParticlesRef.current;
                for (let i = particles.length - 1; i >= 0; i--) {
                    const pt = particles[i];
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.life--;
                    pt.alpha = pt.life / 30;
                    if (pt.life <= 0) {
                        particles.splice(i, 1);
                    }
                }
            }
            
            drawBugFrame();
            bugLoopRef.current = requestAnimationFrame(loop);
        };
        
        bugLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(bugLoopRef.current);
    }, [bugIsRunning, bugIsOver, bugScore, activeTab]);


    // ==========================================
    // BYTE-FORCE TYPER ENGINE
    // ==========================================
    const [typerScore, setTyperScore] = useState(0);
    const [typerWpm, setTyperWpm] = useState(0);
    const [typerAccuracy, setTyperAccuracy] = useState(100);
    const [typerIsRunning, setTyperIsRunning] = useState(false);
    const [typerIsOver, setTyperIsOver] = useState(false);
    const [typerStackHealth, setTyperStackHealth] = useState(100);
    const [typerInput, setTyperInput] = useState('');
    
    const typerCanvasRef = useRef(null);
    const typerLoopRef = useRef(null);
    
    const typerCommandsRef = useRef([]);
    const typerTotalTypedRef = useRef(0);
    const typerCorrectTypedRef = useRef(0);
    const typerParticlesRef = useRef([]);
    const typerStartTimeRef = useRef(0);
    
    const typerWidth = 250;
    const typerHeight = 250;
    
    const spawnTyperCommand = () => {
        const snippets = [
            'git push', 'npm run dev', 'docker run', 'pip install',
            'git commit', 'npm install', 'python main.py', 'rustc build',
            'cargo run', 'git clone', 'cd workspace', 'mkdir src',
            'touch index.js', 'cat config.json', 'ls -la'
        ];
        const text = snippets[Math.floor(Math.random() * snippets.length)];
        typerCommandsRef.current.push({
            text,
            x: Math.random() * (typerWidth - 100) + 15,
            y: -10,
            speed: 0.35 + Math.random() * 0.35,
            width: text.length * 5.8
        });
    };
    
    const spawnTyperBurst = (x, y, color) => {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2.0;
            typerParticlesRef.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                color,
                life: 20 + Math.random() * 10,
                alpha: 1
            });
        }
    };
    
    const handleTyperInputChange = (e) => {
        if (!typerIsRunning || typerIsOver) return;
        const val = e.target.value;
        setTyperInput(val);
        
        const words = typerCommandsRef.current;
        let matchIdx = -1;
        
        for (let i = 0; i < words.length; i++) {
            if (words[i].text === val.trim()) {
                matchIdx = i;
                break;
            }
        }
        
        if (matchIdx !== -1) {
            const matched = words[matchIdx];
            spawnTyperBurst(matched.x + matched.width/2, matched.y + 6, '#06b6d4');
            words.splice(matchIdx, 1);
            setTyperInput('');
            
            typerCorrectTypedRef.current += matched.text.length;
            typerTotalTypedRef.current += matched.text.length;
            
            setTyperScore(prev => prev + matched.text.length * 10);
            
            const seconds = (Date.now() - typerStartTimeRef.current) / 1000;
            const wpmVal = Math.round((typerCorrectTypedRef.current / 5) / (seconds / 60) || 0);
            setTyperWpm(wpmVal);
            setTyperAccuracy(Math.round((typerCorrectTypedRef.current / typerTotalTypedRef.current) * 100 || 100));
        }
    };
    
    const initTyperGame = () => {
        setTyperScore(0);
        setTyperWpm(0);
        setTyperAccuracy(100);
        setTyperStackHealth(100);
        setTyperIsOver(false);
        setTyperIsRunning(false);
        setTyperInput('');
        
        typerCommandsRef.current = [];
        typerParticlesRef.current = [];
        typerTotalTypedRef.current = 0;
        typerCorrectTypedRef.current = 0;
        typerStartTimeRef.current = Date.now();
    };
    
    const drawTyperFrame = () => {
        const canvas = typerCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, typerWidth, typerHeight);
        
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
        ctx.lineWidth = 1;
        for (let y = 0; y < typerHeight; y += 15) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(typerWidth, y); ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, typerHeight - 40);
        ctx.lineTo(typerWidth, typerHeight - 40);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const cmds = typerCommandsRef.current;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        for (const c of cmds) {
            ctx.save();
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#06b6d4';
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.roundRect(c.x - 3, c.y - 2, c.width + 6, 12, 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px monospace';
            ctx.fillText(c.text, c.x, c.y);
            ctx.restore();
        }
        
        const particles = typerParticlesRef.current;
        for (const pt of particles) {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    };
    
    useEffect(() => {
        if (activeTab !== 'typer') return;
        const canvas = typerCanvasRef.current;
        if (canvas) {
            canvas.width = typerWidth;
            canvas.height = typerHeight;
            drawTyperFrame();
        }
        
        let lastSpawn = 0;
        const loop = (time) => {
            if (typerIsRunning && !typerIsOver) {
                if (time - lastSpawn > Math.max(1200, 3500 - typerScore * 2.5)) {
                    lastSpawn = time;
                    spawnTyperCommand();
                }
                
                const cmds = typerCommandsRef.current;
                for (let i = cmds.length - 1; i >= 0; i--) {
                    const c = cmds[i];
                    c.y += c.speed;
                    
                    if (c.y >= typerHeight - 48) {
                        cmds.splice(i, 1);
                        spawnTyperBurst(c.x + c.width/2, typerHeight - 40, '#f43f5e');
                        
                        setTyperStackHealth(prev => {
                            const next = prev - 20;
                            if (next <= 0) {
                                setTyperIsOver(true);
                                setTyperIsRunning(false);
                            }
                            return next;
                        });
                        
                        typerTotalTypedRef.current += c.text.length;
                        setTyperAccuracy(Math.round((typerCorrectTypedRef.current / typerTotalTypedRef.current) * 100 || 100));
                    }
                }
                
                const particles = typerParticlesRef.current;
                for (let i = particles.length - 1; i >= 0; i--) {
                    const pt = particles[i];
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.life--;
                    pt.alpha = pt.life / 25;
                    if (pt.life <= 0) {
                        particles.splice(i, 1);
                    }
                }
            }
            
            drawTyperFrame();
            typerLoopRef.current = requestAnimationFrame(loop);
        };
        
        typerLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(typerLoopRef.current);
    }, [typerIsRunning, typerIsOver, typerScore, activeTab]);

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

                {/* Tabs selection Grid */}
                <div className="flex justify-center mb-8 px-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 border rounded-2xl p-2.5 bg-slate-900/60 w-full max-w-5xl" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            onClick={() => { setActiveTab('snake'); resetTttGame(); initPongGame(); initGitGame(); initBugGame(); initTyperGame(); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'snake'
                                    ? 'bg-accent text-black shadow-lg'
                                    : 'text-secondary hover:text-primary hover:bg-slate-950/20'
                            }`}
                        >
                            <i className="fa-solid fa-gamepad text-[10px]" />
                            {t('devArcade.tabSnake')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('ttt'); setSnakeIsRunning(false); initPongGame(); initGitGame(); initBugGame(); initTyperGame(); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'ttt'
                                    ? 'bg-accent text-black shadow-lg'
                                    : 'text-secondary hover:text-primary hover:bg-slate-950/20'
                            }`}
                        >
                            <i className="fa-solid fa-microchip text-[10px]" />
                            {t('devArcade.tabTtt')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('pong'); setSnakeIsRunning(false); resetTttGame(); initPongGame(); initGitGame(); initBugGame(); initTyperGame(); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'pong'
                                    ? 'bg-accent text-black shadow-lg'
                                    : 'text-secondary hover:text-primary hover:bg-slate-950/20'
                            }`}
                        >
                            <i className="fa-solid fa-brain text-[10px]" />
                            {t('devArcade.tabPong') || 'Neural Pong'}
                        </button>
                        <button
                            onClick={() => { setActiveTab('gitmerge'); setSnakeIsRunning(false); resetTttGame(); initPongGame(); initGitGame(); initBugGame(); initTyperGame(); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'gitmerge'
                                    ? 'bg-accent text-black shadow-lg'
                                    : 'text-secondary hover:text-primary hover:bg-slate-950/20'
                            }`}
                        >
                            <i className="fa-brands fa-git-alt text-[10px]" />
                            {t('devArcade.tabGitMerge') || 'Git Merge'}
                        </button>
                        <button
                            onClick={() => { setActiveTab('buginvaders'); setSnakeIsRunning(false); resetTttGame(); initPongGame(); initGitGame(); initBugGame(); initTyperGame(); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'buginvaders'
                                    ? 'bg-accent text-black shadow-lg'
                                    : 'text-secondary hover:text-primary hover:bg-slate-950/20'
                            }`}
                        >
                            <i className="fa-solid fa-bug text-[10px]" />
                            {t('devArcade.tabBugInvaders') || 'Bug Invaders'}
                        </button>
                        <button
                            onClick={() => { setActiveTab('typer'); setSnakeIsRunning(false); resetTttGame(); initPongGame(); initGitGame(); initBugGame(); initTyperGame(); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                activeTab === 'typer'
                                    ? 'bg-accent text-black shadow-lg'
                                    : 'text-secondary hover:text-primary hover:bg-slate-950/20'
                            }`}
                        >
                            <i className="fa-solid fa-keyboard text-[10px]" />
                            {t('devArcade.tabTyper') || 'Byte-Force Typer'}
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

                    {activeTab === 'pong' && (
                        <motion.div
                            key="pong"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-center max-w-4xl mx-auto"
                        >
                            {/* Controls card panel */}
                            <div className="md:col-span-5 flex flex-col card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.pongTitle') || 'Neural Pong'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.pongDesc') || 'Challenge a heuristic neural network simulator paddle.'}</p>
                                </div>

                                {/* Score matrix grid */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.pongPlayerScore') || 'Player'}
                                        </span>
                                        <span className="text-lg font-black text-cyan-400 tabular-nums block">
                                            {pongScore.player}
                                        </span>
                                    </div>
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.pongAiScore') || 'Neural AI'}
                                        </span>
                                        <span className="text-lg font-black text-rose-400 tabular-nums block">
                                            {pongScore.ai}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions list button */}
                                <div className="pt-2">
                                    {!pongIsOver ? (
                                        <button
                                            onClick={() => setPongIsRunning(!pongIsRunning)}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5 ${
                                                pongIsRunning
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                                    : 'bg-accent hover:bg-opacity-90 text-black'
                                            }`}
                                        >
                                            <i className={`fa-solid ${pongIsRunning ? 'fa-pause' : 'fa-play'}`} />
                                            {pongIsRunning ? t('devArcade.btnPause') : t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={initPongGame}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                            {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Canvas Viewport */}
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[300px] aspect-[1.2] bg-slate-950">
                                    <canvas
                                        ref={pongCanvasRef}
                                        onMouseMove={handlePongMouseMove}
                                        className="block w-full aspect-[1.2] cursor-none"
                                    />
                                    
                                    {/* Game states overlay banners */}
                                    {!pongIsRunning && !pongIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none flex flex-col items-center justify-center text-center p-4">
                                            <i className="fa-solid fa-brain text-4xl text-accent mb-3 animate-pulse" />
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">
                                                Neural Pong AI
                                            </span>
                                            <span className="text-[10px] text-muted max-w-[200px] leading-relaxed block">
                                                Move your mouse cursor vertically on the canvas to steer your paddle!
                                            </span>
                                        </div>
                                    )}

                                    {pongIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 pointer-events-none flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl">
                                            <i className="fa-solid fa-trophy text-4xl text-accent mb-3" />
                                            <span className="text-base uppercase font-black tracking-wider text-accent block mb-1">
                                                {pongWinner === 'player' ? 'YOU WON THE SET!' : 'NEURAL AI WINS!'}
                                            </span>
                                            <span className="text-sm font-bold text-primary block">
                                                Final Match Score: {pongScore.player} - {pongScore.ai}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Live Neural Network Feed */}
                                <div className="card-bg border border-slate-800 rounded-xl p-4 w-full text-left space-y-3">
                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest border-b border-slate-800 pb-1.5">
                                        Live Feedforward Network Grid
                                    </h4>
                                    <div className="flex items-center justify-between text-[8px] font-bold text-muted uppercase">
                                        <span>{t('devArcade.pongInputLayer') || 'Inputs'}</span>
                                        <span>{t('devArcade.pongHiddenLayer') || 'Hidden Synapses'}</span>
                                        <span>{t('devArcade.pongOutputLayer') || 'Decision'}</span>
                                    </div>
                                    {/* Simulated Neural Net nodes */}
                                    <div className="grid grid-cols-3 gap-4 items-center justify-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                                        {/* Inputs */}
                                        <div className="flex flex-col gap-2 items-center">
                                            {pongNN.inputs.map((val, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition ${
                                                        Math.abs(val) > 0.3 ? 'bg-cyan-500/80 border-cyan-400 scale-105' : 'bg-slate-900 border-slate-800'
                                                    }`} />
                                                    <span className="text-[7px] text-muted font-mono pt-0.5">IN_{idx}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Hidden Nodes */}
                                        <div className="flex flex-col gap-1.5 items-center">
                                            {pongNN.hidden.map((val, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className={`w-3 h-3 rounded-full border flex items-center justify-center transition ${
                                                        Math.abs(val) > 0.4 ? 'bg-purple-500/80 border-purple-400 scale-105 shadow-[0_0_5px_rgba(168,85,247,0.4)]' : 'bg-slate-900 border-slate-800'
                                                    }`} />
                                                    <span className="text-[7px] text-muted font-mono pt-0.5">H_{idx}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Outputs */}
                                        <div className="flex flex-col gap-4 items-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                                                    pongNN.outputs[0] > pongNN.outputs[1] ? 'bg-rose-500 border-rose-400 scale-110 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-slate-900 border-slate-800'
                                                }`} />
                                                <span className="text-[7px] text-muted font-mono pt-0.5">MOVE_UP</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                                                    pongNN.outputs[1] > pongNN.outputs[0] ? 'bg-rose-500 border-rose-400 scale-110 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-slate-900 border-slate-800'
                                                }`} />
                                                <span className="text-[7px] text-muted font-mono pt-0.5">MOVE_DOWN</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'gitmerge' && (
                        <motion.div
                            key="gitmerge"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-center max-w-4xl mx-auto"
                        >
                            {/* Controls card panel */}
                            <div className="md:col-span-5 flex flex-col card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.gitMergeTitle') || 'Git Merge'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.gitMergeDesc') || 'Rotate and fit the falling Git Commits blocks.'}</p>
                                </div>

                                {/* Score matrix grid */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.score')}
                                        </span>
                                        <span className="text-lg font-black text-cyan-400 tabular-nums block">
                                            {gitScore}
                                        </span>
                                    </div>
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.gitMergeMergedLines') || 'Merged Lines'}
                                        </span>
                                        <span className="text-lg font-black text-accent block">
                                            {gitMergedLines}
                                        </span>
                                    </div>
                                </div>

                                {/* Simulator Action Buttons */}
                                <div className="space-y-2 pt-2">
                                    {!gitIsOver ? (
                                        <button
                                            onClick={() => setGitIsRunning(!gitIsRunning)}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5 ${
                                                gitIsRunning
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                                    : 'bg-accent hover:bg-opacity-90 text-black'
                                            }`}
                                        >
                                            <i className={`fa-solid ${gitIsRunning ? 'fa-pause' : 'fa-play'}`} />
                                            {gitIsRunning ? t('devArcade.btnPause') : t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={initGitGame}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                            {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Canvas Visualizer */}
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[200px] aspect-[0.5] bg-slate-950">
                                    <canvas
                                        ref={gitCanvasRef}
                                        className="block w-full aspect-[0.5]"
                                    />
                                    
                                    {/* Game states overlay banners */}
                                    {!gitIsRunning && !gitIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none flex flex-col items-center justify-center text-center p-4">
                                            <i className="fa-brands fa-git-alt text-4xl text-accent mb-3 animate-pulse" />
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">
                                                Git Merge Block Puzzle
                                            </span>
                                            <span className="text-[8px] text-muted max-w-[150px] leading-relaxed block">
                                                Use A/D or Arrow keys to move, W to rotate, Space to Hard Drop, S to Soft Drop!
                                            </span>
                                        </div>
                                    )}

                                    {gitIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 pointer-events-none flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl">
                                            <i className="fa-solid fa-bug text-3xl text-rose-500 mb-2" />
                                            <span className="text-xs uppercase font-black tracking-wider text-rose-500 block mb-1">
                                                MERGE CONFLICT ENCOUNTERED!
                                            </span>
                                            <span className="text-[10px] font-bold text-primary block">
                                                Total Score: {gitScore}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Live Git Commit Terminal Output */}
                                <div className="card-bg border border-slate-800 rounded-xl p-4 w-full text-left space-y-2">
                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                                        <i className="fa-solid fa-terminal text-cyan-400 text-xs" />
                                        {t('devArcade.gitMergeCommitTerminal') || 'Commit Terminal Logs'}
                                    </h4>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900/60 font-mono text-[9px] leading-relaxed min-h-[90px] max-h-[90px] overflow-hidden space-y-1">
                                        {terminalLogsState.map((log, idx) => (
                                            <div key={idx} className={
                                                log.type === 'command' ? 'text-cyan-400' :
                                                log.type === 'success' ? 'text-emerald-400' :
                                                log.type === 'error' ? 'text-rose-500 font-extrabold animate-pulse' :
                                                log.type === 'system' ? 'text-slate-400' : 'text-slate-200'
                                            }>
                                                {log.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'buginvaders' && (
                        <motion.div
                            key="buginvaders"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-center max-w-4xl mx-auto"
                        >
                            {/* Controls card panel */}
                            <div className="md:col-span-5 flex flex-col card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.bugInvadersTitle') || 'Bug Invaders'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.bugInvadersDesc') || 'Control a command prompt spaceship to shoot falling bugs.'}</p>
                                </div>

                                {/* Score matrix grid */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.score')}
                                        </span>
                                        <span className="text-lg font-black text-cyan-400 tabular-nums block">
                                            {bugScore}
                                        </span>
                                    </div>
                                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('devArcade.bugInvadersBugsDefeated') || 'Bugs Patched'}
                                        </span>
                                        <span className="text-lg font-black text-accent block">
                                            {bugsDefeated}
                                        </span>
                                    </div>
                                </div>

                                {/* Action button */}
                                <div className="space-y-2 pt-2">
                                    {!bugIsOver ? (
                                        <button
                                            onClick={() => setBugIsRunning(!bugIsRunning)}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5 ${
                                                bugIsRunning
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                                    : 'bg-accent hover:bg-opacity-90 text-black'
                                            }`}
                                        >
                                            <i className={`fa-solid ${bugIsRunning ? 'fa-pause' : 'fa-play'}`} />
                                            {bugIsRunning ? t('devArcade.btnPause') : t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={initBugGame}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                            {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Canvas Visualizer */}
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[250px] aspect-square bg-slate-950">
                                    <canvas
                                        ref={bugCanvasRef}
                                        className="block w-full aspect-square"
                                    />
                                    
                                    {/* Game states overlay banners */}
                                    {!bugIsRunning && !bugIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none flex flex-col items-center justify-center text-center p-4">
                                            <i className="fa-solid fa-bug text-4xl text-accent mb-3 animate-pulse" />
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">
                                                Bug Invaders Debugger
                                            </span>
                                            <span className="text-[10px] text-muted max-w-[200px] leading-relaxed block">
                                                Use A/D or Arrow keys to slide left/right, and Spacebar or W to fire code lasers!
                                            </span>
                                        </div>
                                    )}

                                    {bugIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 pointer-events-none flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl">
                                            <i className="fa-solid fa-skull-crossbones text-4xl text-rose-500 mb-3" />
                                            <span className="text-base uppercase font-black tracking-wider text-rose-500 block mb-1">
                                                COMPILER CRASHED!
                                            </span>
                                            <span className="text-sm font-bold text-primary block">
                                                Total Bugs Cleared: {bugsDefeated}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Virtual D-Pad for Mobile firing and steering */}
                                <div className="flex gap-4 w-full max-w-[250px] select-none justify-center">
                                    <button
                                        onClick={() => handleMoveBugPlayer(-16)}
                                        className="h-10 w-12 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary transition bg-slate-950/50"
                                    >
                                        <i className="fa-solid fa-chevron-left" />
                                    </button>
                                    <button
                                        onClick={fireBugLaser}
                                        className="h-10 w-20 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-cyan-400 font-black text-xs transition bg-slate-950/50 uppercase tracking-widest"
                                    >
                                        <i className="fa-solid fa-bolt mr-1.5" /> Shoot
                                    </button>
                                    <button
                                        onClick={() => handleMoveBugPlayer(16)}
                                        className="h-10 w-12 border border-slate-800 rounded-lg active:bg-slate-800 flex items-center justify-center text-secondary transition bg-slate-950/50"
                                    >
                                        <i className="fa-solid fa-chevron-right" />
                                    </button>
                                </div>

                                {/* Console Live debugging print */}
                                <div className="card-bg border border-slate-800 rounded-xl p-4 w-full text-left space-y-2">
                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                                        <i className="fa-solid fa-bug-slash text-rose-400 text-xs" />
                                        {t('devArcade.bugInvadersConsole') || 'Live Debugging Stream'}
                                    </h4>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900/60 font-mono text-[9px] leading-relaxed min-h-[90px] max-h-[90px] overflow-hidden space-y-1">
                                        {bugLogsState.map((log, idx) => (
                                            <div key={idx} className={
                                                log.type === 'success' ? 'text-emerald-400' :
                                                log.type === 'error' ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-400'
                                            }>
                                                {log.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'typer' && (
                        <motion.div
                            key="typer"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-center max-w-4xl mx-auto"
                        >
                            {/* Controls card panel */}
                            <div className="md:col-span-5 flex flex-col card-bg border rounded-2xl p-5 space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-1">{t('devArcade.typerTitle') || 'Byte-Force Typer'}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('devArcade.typerDesc') || 'Type the falling shell commands and code syntax.'}</p>
                                </div>

                                {/* Score matrix grid */}
                                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-bold">
                                    <div className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/40">
                                        <span className="text-[9px] text-muted uppercase block mb-1">
                                            {t('devArcade.score')}
                                        </span>
                                        <span className="text-sm font-black text-cyan-400 block">{typerScore}</span>
                                    </div>
                                    <div className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/40">
                                        <span className="text-[9px] text-muted uppercase block mb-1">
                                            {t('devArcade.typerWpm') || 'WPM'}
                                        </span>
                                        <span className="text-sm font-black text-emerald-400 block">{typerWpm}</span>
                                    </div>
                                    <div className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/40">
                                        <span className="text-[9px] text-muted uppercase block mb-1">
                                            {t('devArcade.typerAccuracy') || 'Accuracy'}
                                        </span>
                                        <span className="text-sm font-black text-amber-400 block">{typerAccuracy}%</span>
                                    </div>
                                </div>

                                {/* Stack Health Status integrity indicator */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold text-secondary uppercase tracking-widest">
                                        <span>Compiler Stack Buffer Integrity</span>
                                        <span className={typerStackHealth > 40 ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}>
                                            {typerStackHealth}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                        <div 
                                            className={`h-full transition-all duration-300 ${
                                                typerStackHealth > 50 ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`} 
                                            style={{ width: `${typerStackHealth}%` }} 
                                        />
                                    </div>
                                </div>

                                {/* Action controls */}
                                <div className="space-y-2 pt-1">
                                    {!typerIsOver ? (
                                        <button
                                            onClick={() => setTyperIsRunning(!typerIsRunning)}
                                            className={`w-full font-bold text-xs py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5 ${
                                                typerIsRunning
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                                    : 'bg-accent hover:bg-opacity-90 text-black'
                                            }`}
                                        >
                                            <i className={`fa-solid ${typerIsRunning ? 'fa-pause' : 'fa-play'}`} />
                                            {typerIsRunning ? t('devArcade.btnPause') : t('devArcade.btnStart')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={initTyperGame}
                                            className="w-full font-bold text-xs bg-rose-500 hover:bg-rose-400 text-black py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                            {t('devArcade.btnRestart')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Canvas visualizer viewport */}
                            <div className="md:col-span-7 flex flex-col items-center gap-4">
                                <div className="border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner w-full max-w-[250px] aspect-square bg-slate-950">
                                    <canvas
                                        ref={typerCanvasRef}
                                        className="block w-full aspect-square"
                                    />
                                    
                                    {/* Game states overlay banners */}
                                    {!typerIsRunning && !typerIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none flex flex-col items-center justify-center text-center p-4">
                                            <i className="fa-solid fa-keyboard text-4xl text-accent mb-3 animate-pulse" />
                                            <span className="text-xs uppercase font-extrabold tracking-widest text-secondary block mb-1">
                                                Byte-Force Typer
                                            </span>
                                            <span className="text-[10px] text-muted max-w-[200px] leading-relaxed block">
                                                Type the falling programming command lines inside the input block below!
                                            </span>
                                        </div>
                                    )}

                                    {typerIsOver && (
                                        <div className="absolute inset-0 bg-slate-950/90 pointer-events-none flex flex-col items-center justify-center text-center p-4 border border-rose-500/30 rounded-2xl">
                                            <i className="fa-solid fa-fire text-3xl text-rose-500 mb-2" />
                                            <span className="text-xs uppercase font-black tracking-wider text-rose-500 block mb-1">
                                                STACK OVERFLOW DETECTED!
                                            </span>
                                            <span className="text-[10px] font-bold text-primary block">
                                                Compile speed WPM: {typerWpm} | Accuracy: {typerAccuracy}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Active Keyboard Typing Input Box */}
                                <div className="w-full max-w-[250px] space-y-1 text-left">
                                    <label className="text-[9px] font-bold text-secondary uppercase tracking-widest block">
                                        {t('devArcade.typerActiveCommand') || 'Active command terminal input'}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!typerIsRunning || typerIsOver}
                                        value={typerInput}
                                        onChange={handleTyperInputChange}
                                        placeholder={typerIsRunning ? "Type commands here..." : "Click Start to play"}
                                        className="w-full text-xs font-mono font-bold rounded-lg input-bg border border-slate-800 px-3.5 py-2.5 focus:border-cyan-400 outline-none placeholder:text-muted transition duration-200"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
