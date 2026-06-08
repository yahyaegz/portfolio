import React, { useState, useRef, useEffect, useCallback } from 'react';

const COLS = 60;
const ROWS = 36;
const CELL_SIZE = 10;
const ALIVE_COLOR = '#10b981';
const DEAD_COLOR = '#060b18';
const GRID_COLOR = '#1e293b';

export default function AlgoGameOfLife() {
    const canvasRef = useRef(null);
    const gridRef = useRef(new Uint8Array(COLS * ROWS));
    const nextGridRef = useRef(new Uint8Array(COLS * ROWS));
    
    const runningRef = useRef(false);
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(80);
    const speedRef = useRef(80);

    const genSpanRef = useRef(null);
    const liveSpanRef = useRef(null);
    const generationRef = useRef(0);
    const liveCountRef = useRef(0);
    
    const isDrawingRef = useRef(false);
    const drawModeRef = useRef(1); // 1 = alive, 0 = dead
    
    const lastTickRef = useRef(0);
    const requestRef = useRef();

    const updateStatsDOM = useCallback(() => {
        if (genSpanRef.current) genSpanRef.current.textContent = generationRef.current;
        if (liveSpanRef.current) liveSpanRef.current.textContent = liveCountRef.current;
    }, []);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = DEAD_COLOR;
        ctx.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);
        
        // Draw grid lines
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let r = 0; r <= ROWS; r++) {
            ctx.moveTo(0, r * CELL_SIZE);
            ctx.lineTo(COLS * CELL_SIZE, r * CELL_SIZE);
        }
        for (let c = 0; c <= COLS; c++) {
            ctx.moveTo(c * CELL_SIZE, 0);
            ctx.lineTo(c * CELL_SIZE, ROWS * CELL_SIZE);
        }
        ctx.stroke();
        
        // Draw alive cells
        ctx.fillStyle = ALIVE_COLOR;
        const grid = gridRef.current;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r * COLS + c] === 1) {
                    ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                }
            }
        }
    }, []);

    const computeNextGen = useCallback(() => {
        let newLiveCount = 0;
        const grid = gridRef.current;
        const nextGrid = nextGridRef.current;

        for (let r = 0; r < ROWS; r++) {
            const rAbove = r === 0 ? ROWS - 1 : r - 1;
            const rBelow = r === ROWS - 1 ? 0 : r + 1;
            
            const pAbove = rAbove * COLS;
            const pCurrent = r * COLS;
            const pBelow = rBelow * COLS;

            for (let c = 0; c < COLS; c++) {
                const cLeft = c === 0 ? COLS - 1 : c - 1;
                const cRight = c === COLS - 1 ? 0 : c + 1;

                const neighbors = 
                    grid[pAbove + cLeft] + grid[pAbove + c] + grid[pAbove + cRight] +
                    grid[pCurrent + cLeft]                  + grid[pCurrent + cRight] +
                    grid[pBelow + cLeft] + grid[pBelow + c] + grid[pBelow + cRight];
                
                const idx = pCurrent + c;
                const cell = grid[idx];

                if (cell === 1) {
                    if (neighbors === 2 || neighbors === 3) {
                        nextGrid[idx] = 1;
                        newLiveCount++;
                    } else {
                        nextGrid[idx] = 0;
                    }
                } else {
                    if (neighbors === 3) {
                        nextGrid[idx] = 1;
                        newLiveCount++;
                    } else {
                        nextGrid[idx] = 0;
                    }
                }
            }
        }
        
        gridRef.current = nextGrid;
        nextGridRef.current = grid;

        return newLiveCount;
    }, []);

    const loop = useCallback((time) => {
        if (!runningRef.current) return;
        
        // Map Speed 1-100 to interval range 500ms -> 16ms
        const interval = 500 - (speedRef.current - 1) * (484 / 99);
        
        if (time - lastTickRef.current >= interval) {
            const count = computeNextGen();
            liveCountRef.current = count;
            generationRef.current += 1;
            drawCanvas();
            updateStatsDOM();
            lastTickRef.current = time;
        }
        
        requestRef.current = requestAnimationFrame(loop);
    }, [computeNextGen, drawCanvas, updateStatsDOM]);

    const toggleRunning = useCallback(() => {
        runningRef.current = !runningRef.current;
        setIsRunning(runningRef.current);
        if (runningRef.current) {
            lastTickRef.current = performance.now();
            requestRef.current = requestAnimationFrame(loop);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
    }, [loop]);

    const stepForward = useCallback(() => {
        if (runningRef.current) return;
        const count = computeNextGen();
        liveCountRef.current = count;
        generationRef.current += 1;
        drawCanvas();
        updateStatsDOM();
    }, [computeNextGen, drawCanvas, updateStatsDOM]);

    const randomize = useCallback(() => {
        let count = 0;
        const grid = gridRef.current;
        for (let i = 0; i < grid.length; i++) {
            const val = Math.random() > 0.8 ? 1 : 0;
            grid[i] = val;
            if (val) count++;
        }
        liveCountRef.current = count;
        generationRef.current = 0;
        drawCanvas();
        updateStatsDOM();
    }, [drawCanvas, updateStatsDOM]);

    const clearGrid = useCallback(() => {
        gridRef.current.fill(0);
        liveCountRef.current = 0;
        generationRef.current = 0;
        drawCanvas();
        updateStatsDOM();
        if (runningRef.current) {
            toggleRunning();
        }
    }, [drawCanvas, updateStatsDOM, toggleRunning]);

    const spawnPattern = useCallback((patternType) => {
        let patternCells = [];
        if (patternType === 'glider') {
            patternCells = [[1,0], [2,1], [0,2], [1,2], [2,2]];
        } else if (patternType === 'pulsar') {
            patternCells = [
                [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
                [0, 2], [5, 2], [7, 2], [12, 2],
                [0, 3], [5, 3], [7, 3], [12, 3],
                [0, 4], [5, 4], [7, 4], [12, 4],
                [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
                [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
                [0, 8], [5, 8], [7, 8], [12, 8],
                [0, 9], [5, 9], [7, 9], [12, 9],
                [0, 10], [5, 10], [7, 10], [12, 10],
                [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12]
            ];
        } else if (patternType === 'gun') {
            patternCells = [
              [24, 1], [22, 2], [24, 2], [12, 3], [13, 3], [20, 3], [21, 3], [34, 3], [35, 3],
              [11, 4], [15, 4], [20, 4], [21, 4], [34, 4], [35, 4],
              [0, 5], [1, 5], [10, 5], [16, 5], [20, 5], [21, 5],
              [0, 6], [1, 6], [10, 6], [14, 6], [16, 6], [17, 6], [22, 6], [24, 6],
              [10, 7], [16, 7], [24, 7], [11, 8], [15, 8], [12, 9], [13, 9]
            ];
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        patternCells.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const offsetX = Math.floor((COLS - width) / 2) - minX;
        const offsetY = Math.floor((ROWS - height) / 2) - minY;

        gridRef.current.fill(0);
        let count = 0;
        const grid = gridRef.current;
        patternCells.forEach(([x, y]) => {
            const rx = x + offsetX;
            const ry = y + offsetY;
            if (rx >= 0 && rx < COLS && ry >= 0 && ry < ROWS) {
                grid[ry * COLS + rx] = 1;
                count++;
            }
        });
        
        liveCountRef.current = count;
        generationRef.current = 0;
        drawCanvas();
        updateStatsDOM();
        if (runningRef.current) {
            toggleRunning(); // Pause when spawning to let user see it
        }
    }, [drawCanvas, updateStatsDOM, toggleRunning]);

    // Mouse Handlers
    const getCanvasMousePos = useCallback((e) => {
        if (!canvasRef.current) return { r: -1, c: -1 };
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 360 / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const c = Math.floor(x / CELL_SIZE);
        const r = Math.floor(y / CELL_SIZE);
        return { r, c };
    }, []);

    const handleCellInteraction = useCallback((r, c, isErase) => {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            const idx = r * COLS + c;
            gridRef.current[idx] = isErase ? 0 : 1;
            drawCanvas();
        }
    }, [drawCanvas]);

    const handlePointerDown = useCallback((e) => {
        isDrawingRef.current = true;
        drawModeRef.current = e.button === 2 ? 0 : 1;
        const { r, c } = getCanvasMousePos(e);
        handleCellInteraction(r, c, drawModeRef.current === 0);
        e.target.setPointerCapture(e.pointerId);
    }, [getCanvasMousePos, handleCellInteraction]);

    const handlePointerMove = useCallback((e) => {
        if (!isDrawingRef.current) return;
        const { r, c } = getCanvasMousePos(e);
        handleCellInteraction(r, c, drawModeRef.current === 0);
    }, [getCanvasMousePos, handleCellInteraction]);

    const handlePointerUp = useCallback((e) => {
        isDrawingRef.current = false;
        e.target.releasePointerCapture(e.pointerId);
        
        let count = 0;
        const grid = gridRef.current;
        for (let i = 0; i < grid.length; i++) {
            if (grid[i]) count++;
        }
        liveCountRef.current = count;
        updateStatsDOM();
    }, [updateStatsDOM]);

    useEffect(() => {
        randomize();
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [randomize]);

    // Icons
    const PlayIcon = () => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

    const PauseIcon = () => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

    const StepIcon = () => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    );

    const ClearIcon = () => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    );

    const RandomIcon = () => (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 flex flex-col gap-4">
                {/* Controls Card */}
                <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-primary">Controls</h3>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={toggleRunning} 
                            className="flex-1 bg-[#10b981] text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity font-semibold"
                        >
                            {isRunning ? <PauseIcon /> : <PlayIcon />}
                            {isRunning ? "Pause" : "Play"}
                        </button>
                        <button 
                            onClick={stepForward} 
                            disabled={isRunning} 
                            className="px-4 bg-[#06b6d4]/10 text-secondary hover:bg-[#06b6d4]/20 py-2 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Step Forward"
                        >
                            <StepIcon />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={clearGrid} 
                            className="flex-1 bg-[#f43f5e]/10 text-[#f43f5e] hover:bg-[#f43f5e]/20 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <ClearIcon /> Clear
                        </button>
                        <button 
                            onClick={randomize} 
                            className="flex-1 bg-[#eab308]/10 text-[#eab308] hover:bg-[#eab308]/20 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <RandomIcon /> Random
                        </button>
                    </div>

                    <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm text-muted">
                            <span>Slow</span>
                            <span className="font-medium text-primary">Speed</span>
                            <span>Fast</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={speed}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setSpeed(v);
                                speedRef.current = v;
                            }}
                            className="w-full accent-[#10b981]"
                        />
                    </div>
                </div>

                {/* Stats Card */}
                <div className="card-bg border rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-muted">Generation</span>
                        <span className="text-xl font-mono text-primary" ref={genSpanRef}>0</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted">Live Cells</span>
                        <span className="text-xl font-mono text-accent" ref={liveSpanRef}>0</span>
                    </div>
                </div>

                {/* Patterns Card */}
                <div className="card-bg border rounded-2xl p-4 flex flex-col gap-3">
                    <h3 className="text-md font-bold text-primary mb-1">Spawn Patterns</h3>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => spawnPattern('glider')} 
                            className="text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-secondary text-sm"
                        >
                            Glider
                        </button>
                        <button 
                            onClick={() => spawnPattern('pulsar')} 
                            className="text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-secondary text-sm"
                        >
                            Pulsar
                        </button>
                        <button 
                            onClick={() => spawnPattern('gun')} 
                            className="text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-secondary text-sm"
                        >
                            Gosper Glider Gun
                        </button>
                    </div>
                </div>
            </div>

            <div className="md:col-span-8 flex flex-col gap-3">
                <div className="card-bg border rounded-2xl p-4 overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={360}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onContextMenu={(e) => e.preventDefault()}
                        className="bg-[#060b18] rounded-md shadow-lg max-w-full w-[600px] h-auto touch-none cursor-crosshair"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <p className="mt-4 text-xs text-muted text-center max-w-md">
                        Draw by dragging the mouse. Right-click and drag to erase. Use the controls to run the simulation.
                    </p>
                </div>
            </div>
        </div>
    );
}
