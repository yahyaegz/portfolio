import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, SkipForward, RefreshCw, Scissors, MousePointer2 } from 'lucide-react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 360;
const CLASS_COLORS = ['#eab308', '#06b6d4']; // Amber (class -1), Cyan (class 1)

function randomGaussian() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export default function AlgoSVM() {
  const canvasRef = useRef(null);
  
  const [cParam, setCParam] = useState(1.0);
  const [lr, setLr] = useState(0.01);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [activeClass, setActiveClass] = useState(-1);

  const pointsRef = useRef([]);
  // weights: w0, w1, b
  const weightsRef = useRef({ w0: 0, w1: 0, b: 0 });
  const reqRef = useRef();

  const generatePoints = useCallback(() => {
    setIsAutoRunning(false);
    pointsRef.current = [];
    
    // Generate two separable blobs
    const centers = [
      { x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.7, c: -1 },
      { x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.3, c: 1 },
    ];
    
    centers.forEach(center => {
      for (let i = 0; i < 30; i++) {
        pointsRef.current.push({
          x: Math.max(10, Math.min(CANVAS_WIDTH - 10, center.x + randomGaussian() * 40)),
          y: Math.max(10, Math.min(CANVAS_HEIGHT - 10, center.y + randomGaussian() * 40)),
          cls: center.c
        });
      }
    });
    
    // Start with small random weights
    weightsRef.current = { 
      w0: (Math.random() - 0.5) * 0.1, 
      w1: (Math.random() - 0.5) * 0.1, 
      b: 0 
    };
    setIteration(0);
  }, []);

  useEffect(() => {
    generatePoints();
  }, [generatePoints]);

  const doStep = useCallback(() => {
    const pts = pointsRef.current;
    if (pts.length === 0) return;

    let { w0, w1, b } = weightsRef.current;
    const scale = 100;

    // Pegasos algorithm step (Stochastic Gradient Descent for SVM)
    // We will do a mini-batch of all points for smoother animation, though true Pegasos is stochastic.
    
    let dw0 = 0, dw1 = 0, db = 0;

    pts.forEach(p => {
      const x0 = p.x / scale;
      const x1 = p.y / scale;
      const y = p.cls;

      const margin = y * (w0 * x0 + w1 * x1 + b);
      
      if (margin < 1) {
        // Hinge loss gradient
        dw0 += -y * x0;
        dw1 += -y * x1;
        db += -y;
      }
    });

    const m = pts.length;
    // Update rule: w = w - lr * (w + C * dw)
    // b = b - lr * (C * db)
    
    w0 -= lr * (w0 + cParam * dw0 / m);
    w1 -= lr * (w1 + cParam * dw1 / m);
    b -= lr * (cParam * db / m);

    weightsRef.current = { w0, w1, b };
    setIteration(i => i + 1);
  }, [lr, cParam]);

  useEffect(() => {
    let interval;
    if (isAutoRunning) {
      interval = setInterval(() => {
        for (let i = 0; i < 10; i++) doStep();
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
      const norm = Math.sqrt(w0 * w0 + w1 * w1);

      if (norm > 1e-5) {
        // Draw regions (optional, but a faint tint helps)
        // Draw decision boundary w0*x + w1*y + b = 0 => y = (-w0*x - b)/w1
        
        const drawLine = (offset, color, dash) => {
          ctx.beginPath();
          const xStart = 0;
          const yStart = (-w0 * (xStart / scale) - b + offset) / w1 * scale;
          ctx.moveTo(xStart * scaleX, yStart * scaleY);
          
          const xEnd = CANVAS_WIDTH;
          const yEnd = (-w0 * (xEnd / scale) - b + offset) / w1 * scale;
          ctx.lineTo(xEnd * scaleX, yEnd * scaleY);
          
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash(dash);
          ctx.stroke();
          ctx.setLineDash([]);
        };

        if (Math.abs(w1) > 1e-5) {
          // Negative margin (Class -1)
          drawLine(-1, 'rgba(234, 179, 8, 0.4)', [5, 5]);
          // Positive margin (Class +1)
          drawLine(1, 'rgba(6, 182, 212, 0.4)', [5, 5]);
          // Decision boundary
          drawLine(0, 'rgba(255, 255, 255, 0.9)', []);
        }
      }

      // Draw points
      pointsRef.current.forEach(p => {
        const x0 = p.x / scale;
        const x1 = p.y / scale;
        const margin = p.cls * (w0 * x0 + w1 * x1 + b);
        
        ctx.beginPath();
        ctx.arc(p.x * scaleX, p.y * scaleY, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.cls === -1 ? CLASS_COLORS[0] : CLASS_COLORS[1];
        ctx.fill();
        ctx.lineWidth = 1.5;
        
        // Highlight support vectors (margin <= 1)
        if (norm > 1e-5 && margin <= 1.05) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          // Glow
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = '#000';
          ctx.stroke();
        }
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
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 flex flex-col gap-4">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Scissors className="text-accent" /> Support Vector Machine
          </h3>
          <p className="text-sm text-muted">
            Finds the maximum margin hyperplane. Points on or inside the dashed margins are <span className="text-white font-semibold">Support Vectors</span>.
          </p>
          
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold text-secondary flex justify-between">
              <span>Regularization (C): {cParam.toFixed(1)}</span>
            </label>
            <input 
              type="range" min="0.1" max="50" step="0.1" value={cParam} 
              onChange={(e) => setCParam(Number(e.target.value))}
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
          
          <div className="grid grid-cols-1 gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted uppercase font-bold">Epoch</span>
              <span className="text-2xl font-mono text-primary">{iteration * 10}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-4 overflow-hidden relative group">
          <div className="absolute top-6 right-6 flex gap-2 z-10 bg-black/40 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
            <button 
              onClick={() => setActiveClass(-1)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeClass === -1 ? 'bg-amber-500 text-black' : 'text-muted hover:bg-white/5'}`}
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
