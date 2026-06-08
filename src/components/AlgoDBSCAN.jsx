import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, SkipForward, RefreshCw, Layers, MousePointer2 } from 'lucide-react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 360;
const CLUSTER_COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#eab308', '#f43f5e', '#3b82f6', '#f97316'
];
const NOISE_COLOR = '#64748b';

function randomGaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export default function AlgoDBSCAN() {
  const canvasRef = useRef(null);
  
  const [eps, setEps] = useState(40);
  const [minPts, setMinPts] = useState(4);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [converged, setConverged] = useState(false);
  const [pointsCount, setPointsCount] = useState(0);

  const pointsRef = useRef([]);
  // phase: 'find_core', 'expand_cluster', 'done'
  const animStateRef = useRef({ phase: 'find_core', pIdx: 0, currentCluster: 0, neighborsToVisit: [] });
  const reqRef = useRef();

  const syncState = useCallback(() => {
    setPointsCount(pointsRef.current.length);
  }, []);

  const generatePoints = useCallback(() => {
    setIsAutoRunning(false);
    setConverged(false);
    pointsRef.current = [];
    animStateRef.current = { phase: 'find_core', pIdx: 0, currentCluster: 0, neighborsToVisit: [] };
    
    // Generate blobs
    const centers = [
      { x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.3 },
      { x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.7 },
      { x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.5 },
    ];
    
    centers.forEach(center => {
      for (let i = 0; i < 30; i++) {
        pointsRef.current.push({
          x: Math.max(10, Math.min(CANVAS_WIDTH - 10, center.x + randomGaussian() * 35)),
          y: Math.max(10, Math.min(CANVAS_HEIGHT - 10, center.y + randomGaussian() * 35)),
          visited: false,
          cluster: null, // -1 means noise
          isCore: false
        });
      }
    });
    
    // Add uniform noise
    for (let i = 0; i < 20; i++) {
      pointsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        visited: false,
        cluster: null,
        isCore: false
      });
    }
    syncState();
  }, [syncState]);

  useEffect(() => {
    generatePoints();
  }, [generatePoints]);

  const getNeighbors = (pIdx) => {
    const p1 = pointsRef.current[pIdx];
    const neighbors = [];
    for (let i = 0; i < pointsRef.current.length; i++) {
      const p2 = pointsRef.current[i];
      const d2 = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
      if (d2 <= eps * eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  const doStep = useCallback(() => {
    if (converged) return;
    const pts = pointsRef.current;
    const state = animStateRef.current;

    if (state.phase === 'find_core') {
      if (state.pIdx >= pts.length) {
        setConverged(true);
        setIsAutoRunning(false);
        return;
      }
      
      const p = pts[state.pIdx];
      if (p.visited) {
        state.pIdx++;
        return;
      }

      p.visited = true;
      const neighbors = getNeighbors(state.pIdx);

      if (neighbors.length < minPts) {
        p.cluster = -1; // Noise
        state.pIdx++;
      } else {
        p.cluster = state.currentCluster;
        p.isCore = true;
        state.neighborsToVisit = neighbors.filter(idx => idx !== state.pIdx);
        state.phase = 'expand_cluster';
      }
    } else if (state.phase === 'expand_cluster') {
      if (state.neighborsToVisit.length === 0) {
        state.currentCluster++;
        state.pIdx++;
        state.phase = 'find_core';
        return;
      }

      const nIdx = state.neighborsToVisit.shift();
      const p = pts[nIdx];

      if (!p.visited) {
        p.visited = true;
        const neighbors = getNeighbors(nIdx);
        if (neighbors.length >= minPts) {
          p.isCore = true;
          // Add unvisited neighbors
          neighbors.forEach(nnIdx => {
            if (!state.neighborsToVisit.includes(nnIdx) && !pts[nnIdx].visited) {
              state.neighborsToVisit.push(nnIdx);
            }
          });
        }
      }

      if (p.cluster === null || p.cluster === -1) {
        p.cluster = state.currentCluster;
      }
    }
  }, [converged, eps, minPts]);

  useEffect(() => {
    let interval;
    if (isAutoRunning) {
      interval = setInterval(() => {
        // Run a few steps per tick for better speed
        for (let i = 0; i < 3; i++) doStep();
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoRunning, doStep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    const draw = () => {
      if (canvas.offsetWidth > 0 && canvas.width !== canvas.offsetWidth) canvas.width = canvas.offsetWidth;
      if (canvas.offsetHeight > 0 && canvas.height !== canvas.offsetHeight) canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;
      const scaleX = W / CANVAS_WIDTH;
      const scaleY = H / CANVAS_HEIGHT;

      ctx.fillStyle = '#06080f';
      ctx.fillRect(0, 0, W, H);

      const state = animStateRef.current;
      const pts = pointsRef.current;

      // Draw epsilon circle for active point
      if (!converged && pts.length > 0) {
        let activeIdx = -1;
        if (state.phase === 'find_core' && state.pIdx < pts.length) activeIdx = state.pIdx;
        else if (state.phase === 'expand_cluster' && state.neighborsToVisit.length > 0) activeIdx = state.neighborsToVisit[0];
        
        if (activeIdx !== -1 && pts[activeIdx]) {
          const p = pts[activeIdx];
          ctx.beginPath();
          ctx.arc(p.x * scaleX, p.y * scaleY, eps * scaleX, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw lines for current cluster expansion
      if (state.phase === 'expand_cluster') {
        const coreP = pts[state.pIdx];
        if (coreP) {
          state.neighborsToVisit.forEach(nIdx => {
            const np = pts[nIdx];
            ctx.beginPath();
            ctx.moveTo(coreP.x * scaleX, coreP.y * scaleY);
            ctx.lineTo(np.x * scaleX, np.y * scaleY);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }
      }

      // Draw points
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * scaleX, p.y * scaleY, p.isCore ? 6 : 4, 0, Math.PI * 2);
        
        if (p.cluster === null) {
          ctx.fillStyle = '#1e293b'; // unvisited
        } else if (p.cluster === -1) {
          ctx.fillStyle = NOISE_COLOR; // noise
        } else {
          ctx.fillStyle = CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length];
        }
        
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = p.visited ? '#000' : 'rgba(255,255,255,0.2)';
        ctx.stroke();
      });

      reqRef.current = requestAnimationFrame(draw);
    };

    reqRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(reqRef.current);
  }, [converged, eps]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    pointsRef.current.push({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      visited: false,
      cluster: null,
      isCore: false
    });
    // If it was converged, we need to restart clustering from scratch
    if (converged) {
      pointsRef.current.forEach(p => {
        p.visited = false;
        p.cluster = null;
        p.isCore = false;
      });
      animStateRef.current = { phase: 'find_core', pIdx: 0, currentCluster: 0, neighborsToVisit: [] };
      setConverged(false);
    }
    syncState();
  };

  const restart = () => {
    pointsRef.current.forEach(p => {
      p.visited = false;
      p.cluster = null;
      p.isCore = false;
    });
    animStateRef.current = { phase: 'find_core', pIdx: 0, currentCluster: 0, neighborsToVisit: [] };
    setConverged(false);
    setIsAutoRunning(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 flex flex-col gap-4">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Layers className="text-accent" /> DBSCAN Clustering
          </h3>
          <p className="text-sm text-muted">
            Density-Based Spatial Clustering of Applications with Noise. Groups dense points and marks outliers as noise.
          </p>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-secondary flex justify-between">
              <span>Epsilon (radius): {eps}</span>
            </label>
            <input 
              type="range" min="10" max="100" step="1" value={eps} 
              onChange={(e) => { setEps(Number(e.target.value)); restart(); }}
              disabled={isAutoRunning}
              className="w-full accent-accent"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold text-secondary flex justify-between">
              <span>Min Points: {minPts}</span>
            </label>
            <input 
              type="range" min="2" max="10" step="1" value={minPts} 
              onChange={(e) => { setMinPts(Number(e.target.value)); restart(); }}
              disabled={isAutoRunning}
              className="w-full accent-accent"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button 
              onClick={generatePoints}
              className="flex items-center justify-center gap-1 p-2 text-sm bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors w-full"
            >
              <RefreshCw size={16} /> New Data
            </button>
            <button 
              onClick={restart}
              className="flex items-center justify-center gap-1 p-2 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors w-full"
            >
              <Square size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={doStep}
              disabled={converged || isAutoRunning}
              className="flex items-center justify-center gap-1 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward size={16} /> Step
            </button>
            <button
              onClick={() => setIsAutoRunning(!isAutoRunning)}
              disabled={converged}
              className={`flex items-center justify-center gap-1 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isAutoRunning ? 'bg-amber-500/20 text-amber-500' : 'bg-accent text-white hover:bg-emerald-600'}`}
            >
              {isAutoRunning ? <Square size={16} /> : <Play size={16} />}
              {isAutoRunning ? 'Pause' : 'Auto Run'}
            </button>
          </div>
          
          {converged && (
            <div className="text-center p-2 bg-accent/20 text-accent rounded-lg text-sm font-semibold animate-pulse">
              Clustering Complete
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4 overflow-hidden relative group">
          <div className="absolute top-6 left-6 text-sm text-muted bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2 z-10">
            <MousePointer2 size={14} /> Click to add points
          </div>
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-xl cursor-crosshair touch-none border border-white/5"
            style={{ maxWidth: '100%', aspectRatio: '600/360' }}
            onClick={handleCanvasClick}
          />
          <div className="flex items-center justify-center gap-6 px-2 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-muted">Clusters</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500"></span>
              <span className="text-muted">Noise (Outliers)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1e293b]"></span>
              <span className="text-muted">Unvisited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
