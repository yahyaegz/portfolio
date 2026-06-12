import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, SkipForward, RefreshCw, Plus, Trash2, Network, MousePointer2 } from 'lucide-react';

const clusterColors = [
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#f43f5e', // rose-500
  '#eab308', // amber-500
  '#8b5cf6', // violet-500
  '#3b82f6', // blue-500
  '#f97316', // orange-500
];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 360;

function randomGaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export default function AlgoKMeans() {
  const canvasRef = useRef(null);
  
  const [k, setK] = useState(3);
  const [iteration, setIteration] = useState(0);
  const [error, setError] = useState(0);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [hasCentroids, setHasCentroids] = useState(false);
  const [converged, setConverged] = useState(false);
  const [pointsCount, setPointsCount] = useState(0);

  const pointsRef = useRef([]);
  const centroidsRef = useRef([]);
  const animStateRef = useRef({ phase: 'assign', iteration: 0, error: 0 });
  const reqRef = useRef();

  const syncState = useCallback(() => {
    setIteration(animStateRef.current.iteration);
    setError(animStateRef.current.error);
    setPointsCount(pointsRef.current.length);
  }, []);

  const addRandomPoints = () => {
    for (let i = 0; i < 50; i++) {
      pointsRef.current.push({
        x: Math.random() * (CANVAS_WIDTH - 40) + 20,
        y: Math.random() * (CANVAS_HEIGHT - 40) + 20,
        clusterIndex: null
      });
    }
    syncState();
  };

  const addClusteredPoints = () => {
    const numClusters = Math.floor(Math.random() * 3) + 3; // 3 to 5 clusters
    for (let c = 0; c < numClusters; c++) {
      const cx = Math.random() * (CANVAS_WIDTH - 100) + 50;
      const cy = Math.random() * (CANVAS_HEIGHT - 100) + 50;
      for (let i = 0; i < 30; i++) {
        pointsRef.current.push({
          x: Math.max(10, Math.min(CANVAS_WIDTH - 10, cx + randomGaussian() * 30)),
          y: Math.max(10, Math.min(CANVAS_HEIGHT - 10, cy + randomGaussian() * 30)),
          clusterIndex: null
        });
      }
    }
    syncState();
  };

  const clearCanvas = () => {
    pointsRef.current = [];
    centroidsRef.current = [];
    animStateRef.current = { phase: 'assign', iteration: 0, error: 0 };
    setHasCentroids(false);
    setConverged(false);
    setIsAutoRunning(false);
    syncState();
  };

  const initCentroids = () => {
    setIsAutoRunning(false);
    setConverged(false);
    
    if (pointsRef.current.length === 0) return;
    
    const kVal = Math.min(k, pointsRef.current.length);
    const shuffled = [...pointsRef.current].sort(() => 0.5 - Math.random());
    
    centroidsRef.current = shuffled.slice(0, kVal).map((p, i) => ({
      x: p.x,
      y: p.y,
      targetX: p.x,
      targetY: p.y,
      colorIndex: i
    }));
    
    pointsRef.current.forEach(p => p.clusterIndex = null);
    animStateRef.current = { phase: 'assign', iteration: 0, error: 0 };
    setHasCentroids(true);
    syncState();
  };

  const assignStep = useCallback(() => {
    let changed = false;
    let totalError = 0;
    
    pointsRef.current.forEach(p => {
      let minD = Infinity;
      let minC = -1;
      
      centroidsRef.current.forEach((c, idx) => {
        const dx = p.x - c.targetX;
        const dy = p.y - c.targetY;
        const d2 = dx * dx + dy * dy;
        if (d2 < minD) {
          minD = d2;
          minC = idx;
        }
      });
      
      if (p.clusterIndex !== minC) changed = true;
      p.clusterIndex = minC;
      totalError += minD;
    });
    
    animStateRef.current.error = totalError;
    return changed;
  }, []);

  const updateStep = useCallback(() => {
    const sums = centroidsRef.current.map(() => ({ x: 0, y: 0, count: 0 }));
    
    pointsRef.current.forEach(p => {
      if (p.clusterIndex !== null && p.clusterIndex !== undefined) {
        sums[p.clusterIndex].x += p.x;
        sums[p.clusterIndex].y += p.y;
        sums[p.clusterIndex].count++;
      }
    });
    
    centroidsRef.current.forEach((c, idx) => {
      if (sums[idx].count > 0) {
        c.targetX = sums[idx].x / sums[idx].count;
        c.targetY = sums[idx].y / sums[idx].count;
      }
    });
    
    animStateRef.current.iteration++;
  }, []);

  const doStep = useCallback(() => {
    if (!hasCentroids || converged) return;
    
    if (animStateRef.current.phase === 'assign') {
      const changed = assignStep();
      if (!changed) {
        setConverged(true);
        setIsAutoRunning(false);
      } else {
        animStateRef.current.phase = 'update';
      }
    } else {
      updateStep();
      animStateRef.current.phase = 'assign';
    }
    syncState();
  }, [hasCentroids, converged, assignStep, updateStep, syncState]);

  // Auto Run Effect
  useEffect(() => {
    let interval;
    if (isAutoRunning) {
      interval = setInterval(() => {
        doStep();
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isAutoRunning, doStep]);

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Interpolate centroids
      centroidsRef.current.forEach(c => {
        c.x += (c.targetX - c.x) * 0.15;
        c.y += (c.targetY - c.y) * 0.15;
      });

      // Draw lines
      pointsRef.current.forEach(p => {
        if (p.clusterIndex !== null && p.clusterIndex !== undefined) {
          const c = centroidsRef.current[p.clusterIndex];
          if (c) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(c.x, c.y);
            ctx.strokeStyle = `${clusterColors[c.colorIndex]}33`; // 20% opacity
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      // Draw points
      pointsRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        if (p.clusterIndex !== null && centroidsRef.current[p.clusterIndex]) {
          ctx.fillStyle = clusterColors[centroidsRef.current[p.clusterIndex].colorIndex];
        } else {
          ctx.fillStyle = '#64748b'; // slate-500
        }
        ctx.fill();
      });

      // Draw centroids
      centroidsRef.current.forEach(c => {
        ctx.beginPath();
        
        // Draw star/diamond shape
        const spikes = 4;
        const outerRadius = 10;
        const innerRadius = 4;
        let rot = Math.PI / 2 * 3;
        let x = c.x;
        let y = c.y;
        let step = Math.PI / spikes;

        ctx.moveTo(c.x, c.y - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = c.x + Math.cos(rot) * outerRadius;
          y = c.y + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = c.x + Math.cos(rot) * innerRadius;
          y = c.y + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(c.x, c.y - outerRadius);
        ctx.closePath();
        
        const color = clusterColors[c.colorIndex];
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      reqRef.current = requestAnimationFrame(draw);
    };

    reqRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    pointsRef.current.push({ x, y, clusterIndex: null });
    syncState();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 flex flex-col gap-4">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Network className="text-accent" /> K-Means Clustering
          </h3>
          <p className="text-sm text-muted">
            Visualize how K-Means partitions points into clusters.
          </p>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-secondary flex justify-between">
              <span>Clusters (K): {k}</span>
            </label>
            <input 
              type="range" 
              min="2" 
              max="7" 
              value={k} 
              onChange={(e) => setK(Number(e.target.value))}
              disabled={hasCentroids}
              className="w-full accent-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button 
              onClick={addRandomPoints}
              className="flex items-center justify-center gap-1 p-2 text-sm bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors"
            >
              <Plus size={16} /> Random
            </button>
            <button 
              onClick={addClusteredPoints}
              className="flex items-center justify-center gap-1 p-2 text-sm bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors"
            >
              <Plus size={16} /> Blobs
            </button>
          </div>
          
          <button 
            onClick={clearCanvas}
            className="flex items-center justify-center gap-2 p-2 text-sm bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors"
          >
            <Trash2 size={16} /> Clear Canvas
          </button>
        </div>

        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <button
              onClick={initCentroids}
              disabled={pointsCount === 0}
              className={`flex items-center justify-center gap-2 p-3 font-semibold rounded-lg transition-colors ${pointsCount === 0 ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' : 'bg-accent text-white hover:bg-emerald-600'}`}
            >
              <RefreshCw size={18} /> {hasCentroids ? 'Re-Initialize' : 'Initialize Centroids'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={doStep}
                disabled={!hasCentroids || converged || isAutoRunning}
                className="flex items-center justify-center gap-1 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward size={16} /> Step
              </button>
              <button
                onClick={() => setIsAutoRunning(!isAutoRunning)}
                disabled={!hasCentroids || converged}
                className={`flex items-center justify-center gap-1 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isAutoRunning ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
              >
                {isAutoRunning ? <Square size={16} /> : <Play size={16} />}
                {isAutoRunning ? 'Stop' : 'Auto Run'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted uppercase font-bold">Iteration</span>
              <span className="text-2xl font-mono text-primary">{iteration}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted uppercase font-bold">Inertia</span>
              <span className="text-xl font-mono text-secondary">
                {error === 0 ? '0' : (error / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
          
          {converged && (
            <div className="text-center p-2 bg-accent/20 text-accent rounded-lg text-sm font-semibold animate-pulse">
              Converged!
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4 overflow-hidden relative group">
          <div className="absolute top-6 left-6 text-sm text-muted bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2">
            <MousePointer2 size={14} /> Click to add points
          </div>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            className="w-full h-auto bg-slate-900/50 rounded-xl cursor-crosshair touch-none border border-white/5"
            style={{ maxWidth: '100%', aspectRatio: '600/360' }}
          />
          <div className="flex items-center justify-between px-2 text-xs text-muted">
            <span>Points: {pointsCount}</span>
            <div className="flex gap-2">
              {Array.from({ length: k }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: hasCentroids ? clusterColors[i] : '#334155' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
