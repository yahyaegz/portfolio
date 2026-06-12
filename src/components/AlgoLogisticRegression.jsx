import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, SkipForward, RefreshCw, LineChart, MousePointer2 } from 'lucide-react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 360;
const CLASS_COLORS = ['#eab308', '#06b6d4']; // Amber, Cyan

function randomGaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export default function AlgoLogisticRegression() {
  const canvasRef = useRef(null);
  
  const [lr, setLr] = useState(0.1);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [loss, setLoss] = useState(0);
  const [activeClass, setActiveClass] = useState(0);

  const pointsRef = useRef([]);
  // weights: w0, w1, b
  const weightsRef = useRef({ w0: 0, w1: 0, b: 0 });
  const reqRef = useRef();

  const generatePoints = useCallback(() => {
    setIsAutoRunning(false);
    pointsRef.current = [];
    
    // Generate two separable blobs
    const centers = [
      { x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.7, c: 0 },
      { x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.3, c: 1 },
    ];
    
    centers.forEach(center => {
      for (let i = 0; i < 40; i++) {
        pointsRef.current.push({
          x: Math.max(10, Math.min(CANVAS_WIDTH - 10, center.x + randomGaussian() * 50)),
          y: Math.max(10, Math.min(CANVAS_HEIGHT - 10, center.y + randomGaussian() * 50)),
          cls: center.c
        });
      }
    });
    
    weightsRef.current = { w0: 0, w1: 0, b: 0 };
    setIteration(0);
    setLoss(0);
  }, []);

  useEffect(() => {
    generatePoints();
  }, [generatePoints]);

  const sigmoid = (z) => 1 / (1 + Math.exp(-z));

  const doStep = useCallback(() => {
    const pts = pointsRef.current;
    if (pts.length === 0) return;

    let { w0, w1, b } = weightsRef.current;
    let dw0 = 0, dw1 = 0, db = 0;
    let totalLoss = 0;

    // Scale down coordinates to prevent overflow in exp
    const scale = 100;

    pts.forEach(p => {
      const x0 = p.x / scale;
      const x1 = p.y / scale;
      const y = p.cls;

      const z = w0 * x0 + w1 * x1 + b;
      const y_hat = sigmoid(z);

      const dz = y_hat - y;
      dw0 += dz * x0;
      dw1 += dz * x1;
      db += dz;

      // Log loss (cross-entropy)
      const eps = 1e-15;
      totalLoss -= y * Math.log(y_hat + eps) + (1 - y) * Math.log(1 - y_hat + eps);
    });

    const m = pts.length;
    w0 -= (lr / m) * dw0;
    w1 -= (lr / m) * dw1;
    b -= (lr / m) * db;

    weightsRef.current = { w0, w1, b };
    setLoss(totalLoss / m);
    setIteration(i => i + 1);
  }, [lr]);

  useEffect(() => {
    let interval;
    if (isAutoRunning) {
      interval = setInterval(() => {
        // Run multiple steps per tick for visual speed
        for (let i = 0; i < 5; i++) doStep();
      }, 30);
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

      const { w0, w1, b } = weightsRef.current;
      const scale = 100;

      // Draw probability gradient background
      if (w0 !== 0 || w1 !== 0) {
        const res = 10;
        for (let x = 0; x <= CANVAS_WIDTH; x += res) {
          for (let y = 0; y <= CANVAS_HEIGHT; y += res) {
            const z = w0 * (x / scale) + w1 * (y / scale) + b;
            const prob = sigmoid(z);
            
            // Map prob to color (0 -> amber, 1 -> cyan)
            // amber: 234, 179, 8
            // cyan: 6, 182, 212
            const r = Math.round(234 * (1 - prob) + 6 * prob);
            const g = Math.round(179 * (1 - prob) + 182 * prob);
            const bl = Math.round(8 * (1 - prob) + 212 * prob);
            
            // Adjust opacity based on confidence (higher near 0 and 1, lower near 0.5)
            const alpha = Math.abs(prob - 0.5) * 0.4;
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${alpha})`;
            ctx.fillRect(x * scaleX, y * scaleY, res * scaleX, res * scaleY);
          }
        }

        // Draw decision boundary (where z = 0 -> prob = 0.5)
        // w0 * x + w1 * y + b = 0 => y = (-w0 * x - b) / w1
        if (Math.abs(w1) > 1e-5) {
          ctx.beginPath();
          const xStart = 0;
          const yStart = (-w0 * (xStart / scale) - b) / w1 * scale;
          ctx.moveTo(xStart * scaleX, yStart * scaleY);
          
          const xEnd = CANVAS_WIDTH;
          const yEnd = (-w0 * (xEnd / scale) - b) / w1 * scale;
          ctx.lineTo(xEnd * scaleX, yEnd * scaleY);
          
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
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

      reqRef.current = requestAnimationFrame(draw);
    };

    reqRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    pointsRef.current.push({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      cls: activeClass
    });
    // Trigger re-render to update point count (implicit via next frame)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 flex flex-col gap-4">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <LineChart className="text-accent" /> Logistic Regression
          </h3>
          <p className="text-sm text-muted">
            Gradient Descent optimizes a linear decision boundary by minimizing Log Loss, predicting the probability of Class B.
          </p>
          
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold text-secondary flex justify-between">
              <span>Learning Rate: {lr}</span>
            </label>
            <input 
              type="range" min="0.01" max="1" step="0.01" value={lr} 
              onChange={(e) => setLr(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button 
              onClick={generatePoints}
              className="flex items-center justify-center gap-1 p-2 text-sm bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors w-full"
            >
              <RefreshCw size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={doStep}
              disabled={isAutoRunning}
              className="flex items-center justify-center gap-1 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward size={16} /> Step
            </button>
            <button
              onClick={() => setIsAutoRunning(!isAutoRunning)}
              className={`flex items-center justify-center gap-1 p-2 rounded-lg transition-colors ${isAutoRunning ? 'bg-amber-500/20 text-amber-500' : 'bg-accent text-white hover:bg-emerald-600'}`}
            >
              {isAutoRunning ? <Square size={16} /> : <Play size={16} />}
              {isAutoRunning ? 'Pause' : 'Train'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted uppercase font-bold">Epoch</span>
              <span className="text-2xl font-mono text-primary">{iteration * 5}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted uppercase font-bold">Log Loss</span>
              <span className="text-xl font-mono text-secondary">
                {loss.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4 overflow-hidden relative group">
          <div className="absolute top-6 right-6 flex gap-2 z-10 bg-black/40 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
            <button 
              onClick={() => setActiveClass(0)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeClass === 0 ? 'bg-amber-500 text-black' : 'text-muted hover:bg-white/5'}`}
            >
              Add Class A
            </button>
            <button 
              onClick={() => setActiveClass(1)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeClass === 1 ? 'bg-cyan-500 text-black' : 'text-muted hover:bg-white/5'}`}
            >
              Add Class B
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-xl cursor-crosshair touch-none border border-white/5"
            style={{ maxWidth: '100%', aspectRatio: '600/360' }}
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  );
}
