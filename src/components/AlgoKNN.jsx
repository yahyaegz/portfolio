import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Target, RefreshCw, Layers, MousePointer2 } from 'lucide-react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 360;
const CLASS_COLORS = ['#eab308', '#06b6d4']; // Amber, Cyan

function randomGaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export default function AlgoKNN() {
  const canvasRef = useRef(null);
  
  const [k, setK] = useState(5);
  const [showBoundary, setShowBoundary] = useState(false);
  const [testPoint, setTestPoint] = useState(null);
  const [testClass, setTestClass] = useState(null);

  const pointsRef = useRef([]);
  const reqRef = useRef();

  const generatePoints = useCallback(() => {
    pointsRef.current = [];
    // Generate two blobs
    const centers = [
      { x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.7, c: 0 },
      { x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.3, c: 1 },
    ];
    
    centers.forEach(center => {
      for (let i = 0; i < 40; i++) {
        pointsRef.current.push({
          x: Math.max(10, Math.min(CANVAS_WIDTH - 10, center.x + randomGaussian() * 60)),
          y: Math.max(10, Math.min(CANVAS_HEIGHT - 10, center.y + randomGaussian() * 60)),
          cls: center.c
        });
      }
    });
    
    // Add some random noise
    for (let i = 0; i < 15; i++) {
      pointsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        cls: Math.random() > 0.5 ? 1 : 0
      });
    }
    setTestPoint(null);
    setTestClass(null);
  }, []);

  useEffect(() => {
    generatePoints();
  }, [generatePoints]);

  const classify = useCallback((x, y, kVal) => {
    if (pointsRef.current.length === 0) return 0;
    const dists = pointsRef.current.map(p => ({
      d2: (p.x - x)**2 + (p.y - y)**2,
      cls: p.cls,
      p: p
    }));
    dists.sort((a, b) => a.d2 - b.d2);
    const neighbors = dists.slice(0, kVal);
    let counts = [0, 0];
    neighbors.forEach(n => counts[n.cls]++);
    return { cls: counts[1] > counts[0] ? 1 : 0, neighbors };
  }, []);

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

      ctx.fillStyle = '#06080f'; // section-dark background
      ctx.fillRect(0, 0, W, H);

      // Draw boundary
      if (showBoundary && pointsRef.current.length > 0) {
        const res = 15;
        for (let x = 0; x < CANVAS_WIDTH; x += res) {
          for (let y = 0; y < CANVAS_HEIGHT; y += res) {
            const { cls } = classify(x + res/2, y + res/2, k);
            ctx.fillStyle = cls === 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(6, 182, 212, 0.15)';
            ctx.fillRect(x * scaleX, y * scaleY, res * scaleX, res * scaleY);
          }
        }
      }

      // Draw points
      pointsRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * scaleX, p.y * scaleY, 5, 0, Math.PI * 2);
        ctx.fillStyle = CLASS_COLORS[p.cls];
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#000';
        ctx.stroke();
      });

      // Draw test point & connections
      if (testPoint) {
        const { cls, neighbors } = classify(testPoint.x, testPoint.y, k);
        
        // Draw lines to neighbors
        neighbors.forEach(n => {
          ctx.beginPath();
          ctx.moveTo(testPoint.x * scaleX, testPoint.y * scaleY);
          ctx.lineTo(n.p.x * scaleX, n.p.y * scaleY);
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // Draw test point
        ctx.beginPath();
        ctx.arc(testPoint.x * scaleX, testPoint.y * scaleY, 8, 0, Math.PI * 2);
        ctx.fillStyle = CLASS_COLORS[cls];
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        // Glow
        ctx.shadowColor = CLASS_COLORS[cls];
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (testClass !== cls) setTestClass(cls);
      } else {
        if (testClass !== null) setTestClass(null);
      }

      reqRef.current = requestAnimationFrame(draw);
    };

    reqRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(reqRef.current);
  }, [k, showBoundary, testPoint, classify, testClass]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    setTestPoint({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 flex flex-col gap-4">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Target className="text-accent" /> K-Nearest Neighbors
          </h3>
          <p className="text-sm text-muted">
            Click on the canvas to place a test point. KNN classifies it based on the majority vote of its <span className="text-accent font-semibold">{k}</span> closest neighbors.
          </p>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-secondary flex justify-between">
              <span>Neighbors (K): {k}</span>
            </label>
            <input 
              type="range" min="1" max="15" step="2" value={k} 
              onChange={(e) => setK(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button 
              onClick={generatePoints}
              className="flex-1 flex items-center justify-center gap-2 p-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
            >
              <RefreshCw size={16} /> New Data
            </button>
            <button 
              onClick={() => setShowBoundary(b => !b)}
              className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm rounded-lg transition-colors ${showBoundary ? 'bg-accent/20 text-accent' : 'bg-secondary/10 hover:bg-secondary/20 text-secondary'}`}
            >
              <Layers size={16} /> Boundary
            </button>
          </div>
        </div>

        {testPoint && testClass !== null && (
          <div className="card-bg border rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 animate-fade-in">
            <span className="text-sm text-muted uppercase font-bold tracking-wider">Classification Result</span>
            <div className={`text-3xl font-extrabold ${testClass === 0 ? 'text-amber-500' : 'text-cyan-500'}`}>
              Class {testClass === 0 ? 'A' : 'B'}
            </div>
            <span className="text-xs text-muted">Based on {k} nearest neighbors</span>
          </div>
        )}
      </div>

      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4 overflow-hidden relative group">
          <div className="absolute top-6 left-6 text-sm text-muted bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2">
            <MousePointer2 size={14} /> Click to test point
          </div>
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-xl cursor-crosshair touch-none border border-white/5"
            style={{ maxWidth: '100%', aspectRatio: '600/360' }}
            onClick={handleCanvasClick}
          />
          <div className="flex items-center justify-center gap-6 px-2 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
              <span className="text-amber-500">Class A</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
              <span className="text-cyan-500">Class B</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
