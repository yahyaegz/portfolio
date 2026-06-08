import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';
import AlgoKMeans from './AlgoKMeans';
import AlgoHuffman from './AlgoHuffman';
import AlgoGameOfLife from './AlgoGameOfLife';

// ─── Sorting Step Generators ──────────────────────────────────────────────────

function getBubbleSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ type: 'compare', indices: [j, j + 1], arr: [...a] });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ type: 'swap', indices: [j, j + 1], arr: [...a] });
      }
    }
    steps.push({ type: 'sorted', indices: [n - 1 - i], arr: [...a] });
  }
  steps.push({ type: 'sorted', indices: [0], arr: [...a] });
  return steps;
}

function getQuickSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const sortedSet = new Set();

  function partition(low, high) {
    const pivot = a[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({ type: 'compare', indices: [j, high], pivot: high, arr: [...a] });
      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({ type: 'swap', indices: [i, j], pivot: high, arr: [...a] });
        }
      }
    }
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    if (i + 1 !== high) {
      steps.push({ type: 'swap', indices: [i + 1, high], pivot: i + 1, arr: [...a] });
    }
    return i + 1;
  }

  function quickSort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      sortedSet.add(pi);
      steps.push({ type: 'sorted', indices: [pi], arr: [...a] });
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
      sortedSet.add(low);
      steps.push({ type: 'sorted', indices: [low], arr: [...a] });
    }
  }

  quickSort(0, a.length - 1);
  return steps;
}

function getMergeSortSteps(arr) {
  const a = [...arr];
  const steps = [];

  function merge(left, mid, right) {
    const leftArr = a.slice(left, mid + 1);
    const rightArr = a.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;
    while (i < leftArr.length && j < rightArr.length) {
      steps.push({ type: 'compare', indices: [left + i, mid + 1 + j], arr: [...a] });
      if (leftArr[i] <= rightArr[j]) {
        a[k] = leftArr[i];
        i++;
      } else {
        a[k] = rightArr[j];
        j++;
      }
      steps.push({ type: 'swap', indices: [k], arr: [...a] });
      k++;
    }
    while (i < leftArr.length) {
      a[k] = leftArr[i];
      steps.push({ type: 'swap', indices: [k], arr: [...a] });
      i++; k++;
    }
    while (j < rightArr.length) {
      a[k] = rightArr[j];
      steps.push({ type: 'swap', indices: [k], arr: [...a] });
      j++; k++;
    }
    for (let x = left; x <= right; x++) {
      steps.push({ type: 'sorted', indices: [x], arr: [...a] });
    }
  }

  function mergeSort(left, right) {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      mergeSort(left, mid);
      mergeSort(mid + 1, right);
      merge(left, mid, right);
    }
  }

  mergeSort(0, a.length - 1);
  return steps;
}

function getHeapSortSteps(arr) {
  const a = [...arr];
  const steps = [];
  const n = a.length;

  function heapify(size, root) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;
    if (left < size) {
      steps.push({ type: 'compare', indices: [left, largest], arr: [...a] });
      if (a[left] > a[largest]) largest = left;
    }
    if (right < size) {
      steps.push({ type: 'compare', indices: [right, largest], arr: [...a] });
      if (a[right] > a[largest]) largest = right;
    }
    if (largest !== root) {
      [a[root], a[largest]] = [a[largest], a[root]];
      steps.push({ type: 'swap', indices: [root, largest], arr: [...a] });
      heapify(size, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);

  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    steps.push({ type: 'swap', indices: [0, i], arr: [...a] });
    steps.push({ type: 'sorted', indices: [i], arr: [...a] });
    heapify(i, 0);
  }
  steps.push({ type: 'sorted', indices: [0], arr: [...a] });
  return steps;
}

// ─── Pathfinding Algorithms ───────────────────────────────────────────────────

function manhattanDist(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function getNeighbors(x, y, cols, rows, grid) {
  const neighbors = [];
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx].type !== 'wall') {
      neighbors.push([nx, ny]);
    }
  }
  return neighbors;
}

function runAStar(grid, start, end, cols, rows) {
  const visited = [];
  const path = [];
  const open = new Map();
  const closed = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const key = (x, y) => `${x},${y}`;
  gScore.set(key(...start), 0);
  fScore.set(key(...start), manhattanDist(start, end));
  open.set(key(...start), start);

  while (open.size > 0) {
    let current = null;
    let minF = Infinity;
    for (const [k, node] of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < minF) { minF = f; current = node; }
    }
    if (!current) break;
    const ck = key(...current);
    if (current[0] === end[0] && current[1] === end[1]) {
      let node = ck;
      while (cameFrom.has(node)) {
        const [px, py] = cameFrom.get(node).split(',').map(Number);
        path.unshift([px, py]);
        node = cameFrom.get(node);
      }
      return { visited, path };
    }
    open.delete(ck);
    closed.add(ck);
    visited.push([...current]);

    for (const nb of getNeighbors(current[0], current[1], cols, rows, grid)) {
      const nk = key(...nb);
      if (closed.has(nk)) continue;
      const tentG = (gScore.get(ck) ?? Infinity) + 1;
      if (tentG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, ck);
        gScore.set(nk, tentG);
        fScore.set(nk, tentG + manhattanDist(nb, end));
        open.set(nk, nb);
      }
    }
  }
  return { visited, path };
}

function runDijkstra(grid, start, end, cols, rows) {
  const visited = [];
  const path = [];
  const dist = new Map();
  const prev = new Map();
  const queue = new Set();
  const key = (x, y) => `${x},${y}`;

  dist.set(key(...start), 0);
  queue.add(key(...start));

  const allNodes = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (grid[y][x].type !== 'wall') allNodes.push([x, y]);

  for (const [x, y] of allNodes) {
    const k = key(x, y);
    if (k !== key(...start)) dist.set(k, Infinity);
    queue.add(k);
  }

  while (queue.size > 0) {
    let u = null, minDist = Infinity;
    for (const k of queue) {
      const d = dist.get(k) ?? Infinity;
      if (d < minDist) { minDist = d; u = k; }
    }
    if (!u || minDist === Infinity) break;
    queue.delete(u);
    const [ux, uy] = u.split(',').map(Number);
    visited.push([ux, uy]);
    if (ux === end[0] && uy === end[1]) {
      let node = u;
      while (prev.has(node)) {
        const [px, py] = prev.get(node).split(',').map(Number);
        path.unshift([px, py]);
        node = prev.get(node);
      }
      return { visited, path };
    }
    for (const nb of getNeighbors(ux, uy, cols, rows, grid)) {
      const nk = key(...nb);
      if (!queue.has(nk)) continue;
      const alt = (dist.get(u) ?? Infinity) + 1;
      if (alt < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, alt);
        prev.set(nk, u);
      }
    }
  }
  return { visited, path };
}

function runBFS(grid, start, end, cols, rows) {
  const visited = [];
  const path = [];
  const key = (x, y) => `${x},${y}`;
  const seen = new Set([key(...start)]);
  const queue = [[...start]];
  const prev = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    visited.push([...current]);
    if (current[0] === end[0] && current[1] === end[1]) {
      let node = key(...current);
      while (prev.has(node)) {
        const [px, py] = prev.get(node).split(',').map(Number);
        path.unshift([px, py]);
        node = prev.get(node);
      }
      return { visited, path };
    }
    for (const nb of getNeighbors(current[0], current[1], cols, rows, grid)) {
      const nk = key(...nb);
      if (!seen.has(nk)) {
        seen.add(nk);
        prev.set(nk, key(...current));
        queue.push(nb);
      }
    }
  }
  return { visited, path };
}

function runDFS(grid, start, end, cols, rows) {
  const visited = [];
  const path = [];
  const key = (x, y) => `${x},${y}`;
  const seen = new Set([key(...start)]);
  const stack = [[...start]];
  const prev = new Map();

  while (stack.length > 0) {
    const current = stack.pop();
    visited.push([...current]);
    if (current[0] === end[0] && current[1] === end[1]) {
      let node = key(...current);
      while (prev.has(node)) {
        const [px, py] = prev.get(node).split(',').map(Number);
        path.unshift([px, py]);
        node = prev.get(node);
      }
      return { visited, path };
    }
    for (const nb of getNeighbors(current[0], current[1], cols, rows, grid)) {
      const nk = key(...nb);
      if (!seen.has(nk)) {
        seen.add(nk);
        prev.set(nk, key(...current));
        stack.push(nb);
      }
    }
  }
  return { visited, path };
}

// ─── Maze Generator (DFS) ────────────────────────────────────────────────────

function generateMaze(cols, rows) {
  const grid = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({ type: 'wall', x, y }))
  );

  function carve(x, y) {
    grid[y][x].type = 'empty';
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx].type === 'wall') {
        grid[y + dy / 2][x + dx / 2].type = 'empty';
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  return grid;
}

// ─── Algorithm Info ───────────────────────────────────────────────────────────

const SORT_INFO = {
  bubble: { name: 'Bubble Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  quick: { name: 'Quick Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  merge: { name: 'Merge Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  heap: { name: 'Heap Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
};

const PATH_INFO = {
  astar: {
    name: 'A* Search',
    desc: 'Uses Manhattan heuristic to guide search toward the goal. Optimal and complete.',
    color: '#10b981',
  },
  dijkstra: {
    name: "Dijkstra's",
    desc: 'Explores all nodes by distance. Guarantees shortest path on uniform-cost graphs.',
    color: '#06b6d4',
  },
  bfs: {
    name: 'BFS',
    desc: 'Breadth-First Search explores layer by layer. Guaranteed shortest path on unweighted grids.',
    color: '#8b5cf6',
  },
  dfs: {
    name: 'DFS',
    desc: 'Depth-First Search dives deep first. Fast but does NOT guarantee the shortest path.',
    color: '#eab308',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeArray(type, count = 60) {
  if (type === 'reversed') return Array.from({ length: count }, (_, i) => 280 - Math.floor((i / count) * 270));
  if (type === 'nearly') {
    const base = Array.from({ length: count }, (_, i) => 10 + Math.floor((i / count) * 270));
    for (let i = 0; i < Math.floor(count * 0.1); i++) {
      const a = Math.floor(Math.random() * count);
      const b = Math.floor(Math.random() * count);
      [base[a], base[b]] = [base[b], base[a]];
    }
    return base;
  }
  return Array.from({ length: count }, () => Math.floor(Math.random() * 271) + 10);
}

function makeGrid(cols, rows, startNode, endNode) {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => {
      if (x === startNode[0] && y === startNode[1]) return { type: 'start', x, y };
      if (x === endNode[0] && y === endNode[1]) return { type: 'end', x, y };
      return { type: 'empty', x, y };
    })
  );
}

// ─── Sorting Visualizer Tab ───────────────────────────────────────────────────

function SortingVisualizer() {
  const canvasRef = useRef(null);
  const stepsRef = useRef([]);
  const stepIndexRef = useRef(0);
  const sortedSetRef = useRef(new Set());
  const highlightRef = useRef({ type: null, indices: [], pivot: -1 });
  const arrRef = useRef(makeArray('random'));
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const statsRef = useRef({ comparisons: 0, swaps: 0, time: 0 });

  const [algorithm, setAlgorithm] = useState('bubble');
  const [speed, setSpeed] = useState(5);
  const [arrayType, setArrayType] = useState('random');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0, time: 0 });
  const [done, setDone] = useState(false);

  const algoRef = useRef('bubble');
  const speedRef = useRef(5);
  algoRef.current = algorithm;
  speedRef.current = speed;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const arr = arrRef.current;
    const n = arr.length;
    const barW = W / n;
    const { type, indices, pivot } = highlightRef.current;
    const sorted = sortedSetRef.current;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060b18';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < n; i++) {
      const barH = (arr[i] / 300) * (H - 10);
      const x = i * barW;
      const y = H - barH;

      if (sorted.has(i)) {
        ctx.fillStyle = '#10b981';
      } else if (i === pivot) {
        ctx.fillStyle = '#8b5cf6';
      } else if (indices.includes(i)) {
        ctx.fillStyle = type === 'compare' ? '#eab308' : '#f43f5e';
      } else {
        ctx.fillStyle = '#1e3a5f';
      }
      ctx.fillRect(x + 0.5, y, Math.max(barW - 1, 1), barH);
    }
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const runStep = useCallback(() => {
    const steps = stepsRef.current;
    const idx = stepIndexRef.current;
    if (idx >= steps.length) {
      stopInterval();
      setIsRunning(false);
      setDone(true);
      sortedSetRef.current = new Set(Array.from({ length: arrRef.current.length }, (_, i) => i));
      highlightRef.current = { type: null, indices: [], pivot: -1 };
      statsRef.current.time = Date.now() - startTimeRef.current;
      setStats({ ...statsRef.current });
      drawCanvas();
      return;
    }
    const step = steps[idx];
    stepIndexRef.current = idx + 1;
    arrRef.current = [...step.arr];
    highlightRef.current = {
      type: step.type,
      indices: step.indices || [],
      pivot: step.pivot ?? -1,
    };
    if (step.type === 'compare') statsRef.current.comparisons++;
    if (step.type === 'swap') statsRef.current.swaps++;
    if (step.type === 'sorted') {
      for (const si of step.indices) sortedSetRef.current.add(si);
    }
    statsRef.current.time = Date.now() - startTimeRef.current;
    setStats({ ...statsRef.current });
    drawCanvas();
  }, [drawCanvas, stopInterval]);

  const startSort = useCallback(() => {
    stopInterval();
    const arr = arrRef.current;
    let steps = [];
    if (algorithm === 'bubble') steps = getBubbleSortSteps(arr);
    else if (algorithm === 'quick') steps = getQuickSortSteps(arr);
    else if (algorithm === 'merge') steps = getMergeSortSteps(arr);
    else steps = getHeapSortSteps(arr);

    stepsRef.current = steps;
    stepIndexRef.current = 0;
    sortedSetRef.current = new Set();
    statsRef.current = { comparisons: 0, swaps: 0, time: 0 };
    startTimeRef.current = Date.now();
    setStats({ comparisons: 0, swaps: 0, time: 0 });
    setDone(false);
    setIsRunning(true);
    setIsPaused(false);

    const delay = Math.max(20, 250 - speed * 22);
    intervalRef.current = setInterval(runStep, delay);
  }, [algorithm, speed, stopInterval, runStep]);

  const pauseResume = useCallback(() => {
    if (isPaused) {
      const delay = Math.max(20, 250 - speedRef.current * 22);
      intervalRef.current = setInterval(runStep, delay);
      setIsPaused(false);
    } else {
      stopInterval();
      setIsPaused(true);
    }
  }, [isPaused, runStep, stopInterval]);

  const reset = useCallback(() => {
    stopInterval();
    stepsRef.current = [];
    stepIndexRef.current = 0;
    sortedSetRef.current = new Set();
    highlightRef.current = { type: null, indices: [], pivot: -1 };
    statsRef.current = { comparisons: 0, swaps: 0, time: 0 };
    setStats({ comparisons: 0, swaps: 0, time: 0 });
    setIsRunning(false);
    setIsPaused(false);
    setDone(false);
    drawCanvas();
  }, [stopInterval, drawCanvas]);

  const newArray = useCallback(() => {
    reset();
    arrRef.current = makeArray(arrayType);
    drawCanvas();
  }, [reset, drawCanvas, arrayType]);

  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      stopInterval();
      const delay = Math.max(20, 250 - speed * 22);
      intervalRef.current = setInterval(runStep, delay);
    }
  }, [speed, isRunning, isPaused, runStep, stopInterval]);

  const info = SORT_INFO[algorithm];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="md:col-span-4 flex flex-col gap-4">
        {/* Algorithm Selector */}
        <div className="card-bg border rounded-2xl p-4">
          <p className="text-xs text-muted uppercase tracking-widest mb-3 font-mono">Algorithm</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'bubble', label: 'Bubble Sort' },
              { key: 'quick', label: 'Quick Sort' },
              { key: 'merge', label: 'Merge Sort' },
              { key: 'heap', label: 'Heap Sort' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { if (!isRunning) setAlgorithm(key); }}
                className={`py-2 px-3 rounded-full text-xs font-mono font-semibold transition-all ${
                  algorithm === key
                    ? 'bg-emerald-500 text-black'
                    : 'bg-slate-800/60 text-secondary hover:bg-slate-700/60'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Array Type */}
        <div className="card-bg border rounded-2xl p-4">
          <p className="text-xs text-muted uppercase tracking-widest mb-3 font-mono">Array Type</p>
          <div className="flex gap-2 flex-wrap">
            {['random', 'nearly', 'reversed'].map(t => (
              <button
                key={t}
                onClick={() => { if (!isRunning) { setArrayType(t); arrRef.current = makeArray(t); drawCanvas(); } }}
                className={`py-1.5 px-3 rounded-full text-xs font-mono transition-all ${
                  arrayType === t
                    ? 'bg-cyan-500 text-black'
                    : 'bg-slate-800/60 text-secondary hover:bg-slate-700/60'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t === 'nearly' ? 'Nearly Sorted' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="card-bg border rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted uppercase tracking-widest font-mono">Speed</p>
            <span className="text-xs font-mono text-accent">{speed}x</span>
          </div>
          <input
            type="range" min={1} max={10} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Controls */}
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={startSort}
              disabled={isRunning && !isPaused}
              className="flex-1 py-2 rounded-full text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {done ? '▶ Re-Sort' : '▶ Start'}
            </button>
            {isRunning && (
              <button
                onClick={pauseResume}
                className="flex-1 py-2 rounded-full text-xs font-mono font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-all"
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
            <button
              onClick={newArray}
              className="flex-1 py-2 rounded-full text-xs font-mono font-semibold bg-slate-700 text-primary hover:bg-slate-600 transition-all"
            >
              ↺ New
            </button>
          </div>
          {isRunning && !isPaused && (
            <button
              onClick={reset}
              className="w-full py-2 rounded-full text-xs font-mono font-semibold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
            >
              ■ Reset
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="card-bg border rounded-2xl p-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Comparisons', value: stats.comparisons, color: 'text-amber-400' },
            { label: 'Swaps', value: stats.swaps, color: 'text-rose-400' },
            { label: 'Time (ms)', value: stats.time, color: 'text-cyan-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center">
              <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
              <span className="text-xs text-muted font-mono">{label}</span>
            </div>
          ))}
        </div>

        {/* Big-O Info */}
        <div className="card-bg border rounded-2xl p-4">
          <p className="text-xs text-muted uppercase tracking-widest mb-3 font-mono">{info.name} — Complexity</p>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-muted">Best</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{info.best}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Average</span>
              <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{info.avg}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Worst</span>
              <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">{info.worst}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Space</span>
              <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">{info.space}</span>
            </div>
          </div>
        </div>

        {/* Color Legend */}
        <div className="card-bg border rounded-2xl p-4">
          <p className="text-xs text-muted uppercase tracking-widest mb-2 font-mono">Legend</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {[
              { color: '#1e3a5f', label: 'Default' },
              { color: '#eab308', label: 'Comparing' },
              { color: '#f43f5e', label: 'Swapping' },
              { color: '#10b981', label: 'Sorted' },
              { color: '#8b5cf6', label: 'Pivot' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-3 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={280}
            className="w-full rounded-xl"
            style={{ imageRendering: 'pixelated', maxWidth: '100%', display: 'block' }}
          />
        </div>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-bg border border-emerald-500/30 rounded-2xl p-3 text-center"
          >
            <span className="text-emerald-400 font-mono text-sm font-semibold">
              ✓ Sorted in {stats.time}ms — {stats.comparisons} comparisons, {stats.swaps} swaps
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Pathfinding Visualizer Tab ───────────────────────────────────────────────

const GRID_COLS = 30;
const GRID_ROWS = 18;
const START_NODE = [2, 9];
const END_NODE = [27, 9];

function PathfindingVisualizer() {
  const canvasRef = useRef(null);
  const gridRef = useRef(makeGrid(GRID_COLS, GRID_ROWS, START_NODE, END_NODE));
  const visualGridRef = useRef(makeGrid(GRID_COLS, GRID_ROWS, START_NODE, END_NODE));
  const intervalRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragTypeRef = useRef('wall'); // 'wall' | 'erase' | 'start' | 'end'
  const startNodeRef = useRef([...START_NODE]);
  const endNodeRef = useRef([...END_NODE]);
  const startTimeRef = useRef(null);
  const statsRef = useRef({ nodesVisited: 0, pathLength: 0, time: 0 });

  const [algorithm, setAlgorithm] = useState('astar');
  const [speed, setSpeed] = useState(5);
  const [stats, setStats] = useState({ nodesVisited: 0, pathLength: 0, time: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);

  const algoRef = useRef('astar');
  algoRef.current = algorithm;

  const getCellSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { cw: 20, ch: 20 };
    const cw = canvas.width / GRID_COLS;
    const ch = canvas.height / GRID_ROWS;
    return { cw, ch };
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const { cw, ch } = getCellSize();
    const vGrid = visualGridRef.current;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060b18';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = vGrid[y][x];
        const px = x * cw;
        const py = y * ch;

        if (cell.type === 'wall') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px, py, cw, ch);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 1, py + 1, cw - 2, ch - 2);
        } else if (cell.type === 'start') {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(px + 1, py + 1, cw - 2, ch - 2);
        } else if (cell.type === 'end') {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(px + 1, py + 1, cw - 2, ch - 2);
        } else if (cell.type === 'path') {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#10b981';
          ctx.fillStyle = '#10b981';
          ctx.fillRect(px + 1, py + 1, cw - 2, ch - 2);
          ctx.shadowBlur = 0;
        } else if (cell.type === 'visited') {
          ctx.fillStyle = 'rgba(6,182,212,0.3)';
          ctx.fillRect(px, py, cw, ch);
        } else if (cell.type === 'frontier') {
          ctx.fillStyle = 'rgba(16,185,129,0.5)';
          ctx.fillRect(px, py, cw, ch);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cw, 0);
      ctx.lineTo(x * cw, H);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * ch);
      ctx.lineTo(W, y * ch);
      ctx.stroke();
    }
  }, [getCellSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const syncVisualFromBase = useCallback(() => {
    visualGridRef.current = gridRef.current.map(row => row.map(cell => ({ ...cell })));
  }, []);

  const getCanvasCell = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const { cw, ch } = getCellSize();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const cx = Math.floor(((clientX - rect.left) * scaleX) / cw);
    const cy = Math.floor(((clientY - rect.top) * scaleY) / ch);
    if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) return null;
    return [cx, cy];
  }, [getCellSize]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const cell = getCanvasCell(e);
    if (!cell) return;
    const [cx, cy] = cell;
    const cellType = gridRef.current[cy][cx].type;
    isDraggingRef.current = true;
    if (cellType === 'start') dragTypeRef.current = 'start';
    else if (cellType === 'end') dragTypeRef.current = 'end';
    else if (e.button === 2 || (e.touches && cellType === 'wall')) dragTypeRef.current = 'erase';
    else dragTypeRef.current = 'wall';

    if (dragTypeRef.current === 'wall') {
      gridRef.current[cy][cx] = { type: 'wall', x: cx, y: cy };
    } else if (dragTypeRef.current === 'erase') {
      gridRef.current[cy][cx] = { type: 'empty', x: cx, y: cy };
    }
    syncVisualFromBase();
    drawCanvas();
  }, [getCanvasCell, syncVisualFromBase, drawCanvas]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const cell = getCanvasCell(e);
    if (!cell) return;
    const [cx, cy] = cell;
    const grid = gridRef.current;

    if (dragTypeRef.current === 'start') {
      const [ox, oy] = startNodeRef.current;
      grid[oy][ox] = { type: 'empty', x: ox, y: oy };
      grid[cy][cx] = { type: 'start', x: cx, y: cy };
      startNodeRef.current = [cx, cy];
    } else if (dragTypeRef.current === 'end') {
      const [ox, oy] = endNodeRef.current;
      grid[oy][ox] = { type: 'empty', x: ox, y: oy };
      grid[cy][cx] = { type: 'end', x: cx, y: cy };
      endNodeRef.current = [cx, cy];
    } else if (dragTypeRef.current === 'wall') {
      if (grid[cy][cx].type === 'empty') grid[cy][cx] = { type: 'wall', x: cx, y: cy };
    } else if (dragTypeRef.current === 'erase') {
      if (grid[cy][cx].type === 'wall') grid[cy][cx] = { type: 'empty', x: cx, y: cy };
    }
    syncVisualFromBase();
    drawCanvas();
  }, [getCanvasCell, syncVisualFromBase, drawCanvas]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const runPathfinding = useCallback(() => {
    stopInterval();
    syncVisualFromBase();
    const start = startNodeRef.current;
    const end = endNodeRef.current;
    const grid = gridRef.current;
    const algo = algoRef.current;

    startTimeRef.current = Date.now();
    let result;
    if (algo === 'astar') result = runAStar(grid, start, end, GRID_COLS, GRID_ROWS);
    else if (algo === 'dijkstra') result = runDijkstra(grid, start, end, GRID_COLS, GRID_ROWS);
    else if (algo === 'bfs') result = runBFS(grid, start, end, GRID_COLS, GRID_ROWS);
    else result = runDFS(grid, start, end, GRID_COLS, GRID_ROWS);

    const { visited, path } = result;
    let vi = 0;
    let pathPhase = false;
    let pi = 0;

    statsRef.current = { nodesVisited: visited.length, pathLength: path.length, time: 0 };
    setStats({ nodesVisited: visited.length, pathLength: path.length, time: 0 });
    setIsRunning(true);
    setDone(false);

    const delay = Math.max(8, 120 - speed * 11);
    intervalRef.current = setInterval(() => {
      if (!pathPhase) {
        if (vi < visited.length) {
          const [vx, vy] = visited[vi];
          if (visualGridRef.current[vy][vx].type === 'empty') {
            visualGridRef.current[vy][vx] = { type: 'visited', x: vx, y: vy };
          }
          vi++;
        } else {
          pathPhase = true;
        }
      } else {
        if (pi < path.length) {
          const [px, py] = path[pi];
          if (visualGridRef.current[py][px].type !== 'start' && visualGridRef.current[py][px].type !== 'end') {
            visualGridRef.current[py][px] = { type: 'path', x: px, y: py };
          }
          pi++;
        } else {
          stopInterval();
          setIsRunning(false);
          setDone(true);
          statsRef.current.time = Date.now() - startTimeRef.current;
          setStats({ ...statsRef.current });
        }
      }
      drawCanvas();
    }, delay);
  }, [stopInterval, syncVisualFromBase, drawCanvas, speed]);

  const clearWalls = useCallback(() => {
    stopInterval();
    const [sx, sy] = startNodeRef.current;
    const [ex, ey] = endNodeRef.current;
    gridRef.current = makeGrid(GRID_COLS, GRID_ROWS, startNodeRef.current, endNodeRef.current);
    gridRef.current[sy][sx] = { type: 'start', x: sx, y: sy };
    gridRef.current[ey][ex] = { type: 'end', x: ex, y: ey };
    syncVisualFromBase();
    setIsRunning(false);
    setDone(false);
    setStats({ nodesVisited: 0, pathLength: 0, time: 0 });
    drawCanvas();
  }, [stopInterval, syncVisualFromBase, drawCanvas]);

  const resetVisualization = useCallback(() => {
    stopInterval();
    syncVisualFromBase();
    setIsRunning(false);
    setDone(false);
    setStats({ nodesVisited: 0, pathLength: 0, time: 0 });
    drawCanvas();
  }, [stopInterval, syncVisualFromBase, drawCanvas]);

  const genMaze = useCallback(() => {
    stopInterval();
    const maze = generateMaze(GRID_COLS, GRID_ROWS);
    const [sx, sy] = startNodeRef.current;
    const [ex, ey] = endNodeRef.current;
    maze[sy][sx] = { type: 'start', x: sx, y: sy };
    maze[ey][ex] = { type: 'end', x: ex, y: ey };
    // Ensure neighbors of start/end are open
    [[sx+1,sy],[sx,sy+1],[sx,sy-1]].forEach(([nx,ny]) => {
      if (nx > 0 && nx < GRID_COLS-1 && ny > 0 && ny < GRID_ROWS-1) {
        maze[ny][nx] = { type: 'empty', x: nx, y: ny };
      }
    });
    [[ex-1,ey],[ex,ey+1],[ex,ey-1]].forEach(([nx,ny]) => {
      if (nx > 0 && nx < GRID_COLS-1 && ny > 0 && ny < GRID_ROWS-1) {
        maze[ny][nx] = { type: 'empty', x: nx, y: ny };
      }
    });
    gridRef.current = maze;
    syncVisualFromBase();
    setIsRunning(false);
    setDone(false);
    setStats({ nodesVisited: 0, pathLength: 0, time: 0 });
    drawCanvas();
  }, [stopInterval, syncVisualFromBase, drawCanvas]);

  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  const info = PATH_INFO[algorithm];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="md:col-span-4 flex flex-col gap-4">
        {/* Algorithm Selector */}
        <div className="card-bg border rounded-2xl p-4">
          <p className="text-xs text-muted uppercase tracking-widest mb-3 font-mono">Algorithm</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'astar', label: 'A* Search' },
              { key: 'dijkstra', label: "Dijkstra's" },
              { key: 'bfs', label: 'BFS' },
              { key: 'dfs', label: 'DFS' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { if (!isRunning) setAlgorithm(key); }}
                className={`py-2 px-3 rounded-full text-xs font-mono font-semibold transition-all ${
                  algorithm === key
                    ? 'bg-emerald-500 text-black'
                    : 'bg-slate-800/60 text-secondary hover:bg-slate-700/60'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="card-bg border rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted uppercase tracking-widest font-mono">Speed</p>
            <span className="text-xs font-mono text-accent">{speed}x</span>
          </div>
          <input
            type="range" min={1} max={10} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Controls */}
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-2">
          <button
            onClick={runPathfinding}
            disabled={isRunning}
            className="w-full py-2 rounded-full text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {done ? '▶ Run Again' : '▶ Find Path'}
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={genMaze}
              disabled={isRunning}
              className="py-2 rounded-full text-xs font-mono font-semibold bg-slate-700 text-primary hover:bg-slate-600 disabled:opacity-40 transition-all"
            >
              ⚙ Maze
            </button>
            <button
              onClick={clearWalls}
              disabled={isRunning}
              className="py-2 rounded-full text-xs font-mono font-semibold bg-slate-700 text-primary hover:bg-slate-600 disabled:opacity-40 transition-all"
            >
              ✕ Clear
            </button>
            <button
              onClick={resetVisualization}
              className="py-2 rounded-full text-xs font-mono font-semibold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="card-bg border rounded-2xl p-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Visited', value: stats.nodesVisited, color: 'text-cyan-400' },
            { label: 'Path Len', value: stats.pathLength, color: 'text-emerald-400' },
            { label: 'Time (ms)', value: stats.time, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center">
              <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
              <span className="text-xs text-muted font-mono">{label}</span>
            </div>
          ))}
        </div>

        {/* Algorithm Description */}
        <div className="card-bg border rounded-2xl p-4" style={{ borderColor: `${info.color}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
            <p className="text-xs font-mono font-semibold" style={{ color: info.color }}>{info.name}</p>
          </div>
          <p className="text-xs text-secondary leading-relaxed">{info.desc}</p>
        </div>

        {/* Color Legend */}
        <div className="card-bg border rounded-2xl p-4">
          <p className="text-xs text-muted uppercase tracking-widest mb-2 font-mono">Legend</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {[
              { color: '#10b981', label: 'Start' },
              { color: '#f43f5e', label: 'End' },
              { color: '#334155', label: 'Wall' },
              { color: 'rgba(6,182,212,0.5)', label: 'Visited' },
              { color: '#10b981', label: 'Path', glow: true },
              { color: '#060b18', label: 'Empty', border: true },
            ].map(({ color, label, border }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-sm flex-shrink-0 ${border ? 'border border-slate-700' : ''}`}
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction Hint */}
        <div className="card-bg border rounded-2xl p-3">
          <p className="text-xs text-muted font-mono leading-relaxed">
            <span className="text-accent">Left drag</span> → draw walls<br/>
            <span className="text-rose-400">Right drag</span> → erase walls<br/>
            <span className="text-cyan-400">Drag</span> start/end nodes to move them
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-3 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={360}
            className="w-full rounded-xl cursor-crosshair"
            style={{ maxWidth: '100%', display: 'block', touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={e => e.preventDefault()}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          />
        </div>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card-bg border rounded-2xl p-3 text-center ${
              stats.pathLength > 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
            }`}
          >
            <span className={`font-mono text-sm font-semibold ${stats.pathLength > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.pathLength > 0
                ? `✓ Path found! Length: ${stats.pathLength} — ${stats.nodesVisited} nodes visited in ${stats.time}ms`
                : '✗ No path found — the destination is unreachable'}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'sorting', label: '⟨ Sorting ⟩', icon: '▦' },
  { key: 'pathfinding', label: '⟨ Pathfinding ⟩', icon: '◈' },
  { key: 'kmeans', label: '⟨ K-Means ⟩', icon: '⚄' },
  { key: 'huffman', label: '⟨ Huffman ⟩', icon: '🗜' },
  { key: 'gameoflife', label: '⟨ Life ⟩', icon: '🦠' },
];

export default function AlgorithmObservatory() {
  const [activeTab, setActiveTab] = useState('sorting');

  return (
    <section id="algo-observatory" className="section-dark py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border font-mono text-xs text-accent"
            style={{ borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.05)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            &lt; Algorithm Observatory /&gt;
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
            <SplitTextReveal>Algorithm</SplitTextReveal>{' '}
            <span className="text-accent">
              <SplitTextReveal>Observatory</SplitTextReveal>
            </span>
          </h2>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Watch classic algorithms come alive — step by step, frame by frame.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div
            className="inline-flex gap-2 p-1.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2 rounded-full text-sm font-mono font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'sorting' && <SortingVisualizer />}
            {activeTab === 'pathfinding' && <PathfindingVisualizer />}
            {activeTab === 'kmeans' && <AlgoKMeans />}
            {activeTab === 'huffman' && <AlgoHuffman />}
            {activeTab === 'gameoflife' && <AlgoGameOfLife />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
