import React, { useState, useEffect, useRef, useCallback } from 'react';

const ALGO_STEPS_DELAY = 600;

export default function AlgoHuffman() {
  const [text, setText] = useState('DEVELOPER PORTFOLIO');
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState([]);
  const [encodingMap, setEncodingMap] = useState({});
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  
  const canvasRef = useRef(null);
  const initialized = useRef(false);

  const [stats, setStats] = useState({
     originalBits: 0,
     compressedBits: 0,
     ratio: '0.0'
  });

  const buildTree = useCallback(() => {
     setIsPlaying(false);
     setStepIndex(0);
     setEncodingMap({});
     setIsAnimationComplete(false);
     
     if (!text) {
         setSteps([]);
         setStats({ originalBits: 0, compressedBits: 0, ratio: '0.0' });
         setIsAnimationComplete(true);
         return;
     }
     
     // 1. Frequency map
     const freqMap = {};
     for (let char of text) {
        freqMap[char] = (freqMap[char] || 0) + 1;
     }
     
     // 2. Create leaves
     let forest = Object.keys(freqMap).map(char => ({
         char,
         freq: freqMap[char],
         left: null,
         right: null,
         id: char,
         isLeaf: true
     }));
     
     // Sort with a tie-breaker (id) for deterministic tree structure
     forest.sort((a, b) => {
         if (a.freq !== b.freq) return a.freq - b.freq;
         return a.id.localeCompare(b.id);
     });
     
     const newSteps = [];
     // Deep copy helper for steps (since we mutate structure during the process)
     // Wait, actually we want to share the references so layout applied later reflects on all steps!
     // We will just copy the array of roots.
     newSteps.push([...forest]); 
     
     let currentForest = [...forest];
     
     while (currentForest.length > 1) {
         currentForest.sort((a, b) => {
             if (a.freq !== b.freq) return a.freq - b.freq;
             return a.id.localeCompare(b.id);
         });
         
         const left = currentForest.shift();
         const right = currentForest.shift();
         
         const parent = {
             char: null,
             freq: left.freq + right.freq,
             left,
             right,
             id: left.id + right.id,
             isLeaf: false
         };
         
         currentForest.push(parent);
         newSteps.push([...currentForest]);
     }
     
     const root = currentForest[0] || null;
     
     if (root) {
         // Layout - compute depth
         const setDepth = (node, d) => {
             if(!node) return 0;
             node.depth = d;
             if(node.isLeaf) return d;
             return Math.max(setDepth(node.left, d+1), setDepth(node.right, d+1));
         }
         const maxDepth = setDepth(root, 0);
         
         // Layout - compute X index via in-order traversal
         let xOffset = 0;
         const assignX = (node) => {
             if(!node) return;
             assignX(node.left);
             if(node.isLeaf) {
                 node.xIndex = xOffset++;
             }
             assignX(node.right);
             if(!node.isLeaf) {
                 node.xIndex = ((node.left ? node.left.xIndex : 0) + (node.right ? node.right.xIndex : 0)) / 2;
             }
         }
         assignX(root);
         
         const totalLeaves = xOffset;
         
         // Layout - assign normalized coordinates [0, 1]
         const assignCoords = (node) => {
             if(!node) return;
             node.normX = totalLeaves > 1 ? node.xIndex / (totalLeaves - 1) : 0.5;
             node.normY = maxDepth > 0 ? node.depth / maxDepth : 0.5;
             
             assignCoords(node.left);
             assignCoords(node.right);
         };
         assignCoords(root);
         
         // Generate Encoding Map
         const map = {};
         const traverseEncode = (node, path) => {
             if(!node) return;
             if(node.isLeaf) {
                 map[node.char] = path === '' ? '0' : path;
                 return;
             }
             traverseEncode(node.left, path + '0');
             traverseEncode(node.right, path + '1');
         }
         traverseEncode(root, '');
         
         setEncodingMap(map);
         
         // Compute Stats
         let compressedBits = 0;
         for (let char of text) {
             compressedBits += map[char].length;
         }
         const originalBits = text.length * 8;
         setStats({
            originalBits,
            compressedBits,
            ratio: originalBits > 0 ? ((1 - compressedBits/originalBits) * 100).toFixed(1) : '0.0'
         });
     }
     
     setSteps(newSteps);
     setIsPlaying(true);
  }, [text]);

  useEffect(() => {
    if (!initialized.current) {
        buildTree();
        initialized.current = true;
    }
  }, [buildTree]);

  // Animation Loop
  useEffect(() => {
     let timer;
     if (isPlaying && stepIndex < steps.length - 1) {
         timer = setTimeout(() => {
             setStepIndex(prev => prev + 1);
         }, ALGO_STEPS_DELAY);
     } else if (isPlaying && stepIndex >= steps.length - 1) {
         setIsPlaying(false);
         setIsAnimationComplete(true);
     } else if (!isPlaying && steps.length > 0 && stepIndex === steps.length - 1) {
         setIsAnimationComplete(true);
     }
     return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, steps]);

  // Canvas Render
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Setup canvas scaling for high DPI displays if needed
      ctx.clearRect(0, 0, width, height);
      
      if (!steps || steps.length === 0) return;
      
      const currentForest = steps[stepIndex];
      if (!currentForest) return;
      
      const marginX = 40;
      const marginY = 50;
      const drawableWidth = width - 2 * marginX;
      const drawableHeight = height - 2 * marginY;
      
      // Determine dynamic radius based on number of leaves to prevent major overlap
      let maxLeaves = 1;
      if (steps[0]) maxLeaves = steps[0].length;
      const radius = Math.max(10, Math.min(18, drawableWidth / (maxLeaves * 2.5)));
      
      const getNodeCoords = (node) => ({
          x: marginX + node.normX * drawableWidth,
          y: marginY + node.normY * drawableHeight
      });
      
      const drawTreeEdges = (node) => {
          if(!node || node.isLeaf) return;
          const { x, y } = getNodeCoords(node);
          
          if(node.left) {
              const leftCoords = getNodeCoords(node.left);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(leftCoords.x, leftCoords.y);
              ctx.strokeStyle = '#06b6d4'; // secondary (cyan)
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Edge Label '0'
              ctx.fillStyle = '#94a3b8'; // text-muted
              ctx.font = '12px sans-serif';
              ctx.textAlign = 'right';
              ctx.fillText('0', (x + leftCoords.x)/2 - 6, (y + leftCoords.y)/2);
              
              drawTreeEdges(node.left);
          }
          if(node.right) {
              const rightCoords = getNodeCoords(node.right);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(rightCoords.x, rightCoords.y);
              ctx.strokeStyle = '#10b981'; // accent (emerald)
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Edge Label '1'
              ctx.fillStyle = '#94a3b8'; // text-muted
              ctx.font = '12px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText('1', (x + rightCoords.x)/2 + 6, (y + rightCoords.y)/2);
              
              drawTreeEdges(node.right);
          }
      };
      
      const drawTreeNodes = (node, isRootOfForest) => {
          if (!node) return;
          const { x, y } = getNodeCoords(node);
          
          drawTreeNodes(node.left, false);
          drawTreeNodes(node.right, false);
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.fill();
          
          // Outline coloring based on state
          ctx.strokeStyle = isRootOfForest && steps.length > 1 && stepIndex < steps.length - 1 
              ? '#eab308' // amber for active roots during animation
              : (node.isLeaf ? '#10b981' : '#06b6d4'); // accent/secondary
          ctx.lineWidth = isRootOfForest && stepIndex < steps.length - 1 ? 3 : 2;
          ctx.stroke();
          
          // Node text
          ctx.fillStyle = '#f8fafc'; // text-primary
          ctx.font = `bold ${Math.max(9, radius - 6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let displayTxt = node.isLeaf ? node.char : node.freq;
          if (node.isLeaf) {
              if (node.char === ' ') displayTxt = '␣';
              else if (node.char === '\n') displayTxt = '↵';
          }
          ctx.fillText(displayTxt, x, y);
          
          // Frequency sub-label for leaves
          if(node.isLeaf && radius >= 12) {
              ctx.fillStyle = '#94a3b8'; // text-muted
              ctx.font = '10px sans-serif';
              ctx.fillText(node.freq, x, y + radius + 12);
          }
      };
      
      // Draw all edges first so they sit behind nodes
      currentForest.forEach(rootNode => {
          drawTreeEdges(rootNode);
      });
      
      // Draw all nodes on top
      currentForest.forEach(rootNode => {
          drawTreeNodes(rootNode, true);
      });
      
  }, [steps, stepIndex]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      
      {/* Controls */}
      <div className="md:col-span-4 flex flex-col gap-4">
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
          <h3 className="text-primary font-bold text-lg mb-1">Huffman Coding</h3>
          <p className="text-muted text-sm leading-relaxed">
            Compress data by dynamically building a priority queue. Frequent characters get shorter binary codes.
          </p>
          <textarea
            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 text-primary text-sm outline-none focus:border-emerald-500 transition-colors resize-none mt-2"
            rows="4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to compress..."
          />
          <button
            onClick={buildTree}
            disabled={isPlaying}
            className={`w-full py-3 rounded-xl transition-all font-bold mt-2 ${
                isPlaying 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-emerald-500/20'
            }`}
          >
            {isPlaying ? 'Building Tree...' : 'Build Huffman Tree'}
          </button>
        </div>
        
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
          <h3 className="text-primary font-bold">Compression Stats</h3>
          <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
            <span className="text-muted">Original Size:</span>
            <span className="text-primary font-mono">{isAnimationComplete ? `${stats.originalBits} bits` : '-'}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
            <span className="text-muted">Compressed Size:</span>
            <span className="text-accent font-mono">{isAnimationComplete ? `${stats.compressedBits} bits` : '-'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Compression Ratio:</span>
            <span className="text-emerald-400 font-mono font-bold">{isAnimationComplete ? `${stats.ratio}% saved` : '-'}</span>
          </div>
        </div>
        
        <div className="card-bg border rounded-2xl p-4 flex flex-col gap-3 shadow-lg flex-1">
          <h3 className="text-primary font-bold">Encoding Map</h3>
          <div className="overflow-y-auto flex-1 max-h-48 flex flex-col gap-2 pr-2 custom-scrollbar">
            {isAnimationComplete ? (
                Object.entries(encodingMap).map(([char, code]) => (
                   <div key={char} className="flex justify-between items-center text-sm bg-slate-800/30 p-2 rounded-lg border border-slate-700/30">
                      <span className="text-muted font-mono bg-slate-900 px-2 py-0.5 rounded">
                          {char === ' ' ? 'Space' : char === '\n' ? '↵' : char}
                      </span>
                      <span className="text-secondary font-mono tracking-wider">{code}</span>
                   </div>
                ))
            ) : (
                <div className="text-muted text-sm italic py-4 text-center">
                    {isPlaying ? 'Computing optimal codes...' : 'Map will appear here...'}
                </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Canvas & Output */}
      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="card-bg border rounded-2xl p-4 flex flex-col flex-1 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-primary font-bold">Tree Visualization</h3>
            {isPlaying && steps.length > 0 && (
               <div className="flex items-center gap-2">
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                 </span>
                 <span className="text-amber-400 text-sm font-mono">
                   Step {stepIndex + 1}/{steps.length}
                 </span>
               </div>
            )}
            {isAnimationComplete && steps.length > 0 && (
               <span className="text-emerald-500 text-sm font-mono flex items-center gap-1">
                 ✓ Tree Complete
               </span>
            )}
          </div>
          
          <div className="flex-1 bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center min-h-[360px]">
            <canvas
              ref={canvasRef}
              width={600}
              height={360}
              className="max-w-full h-auto drop-shadow-md"
            />
          </div>
        </div>
        
        <div className="card-bg border rounded-2xl p-4 shadow-lg">
          <h3 className="text-primary font-bold mb-3">Encoded Output (Binary Stream)</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 break-all text-sm font-mono text-emerald-400 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
            {isAnimationComplete ? (
               text.split('').map((char, i) => (
                  <span 
                    key={i} 
                    title={`'${char}' -> ${encodingMap[char]}`} 
                    className="hover:text-white hover:bg-emerald-600/30 px-[1px] rounded transition-colors cursor-crosshair"
                  >
                    {encodingMap[char]}
                  </span>
               ))
            ) : (
               <span className="text-muted italic opacity-70">
                   {isPlaying ? 'Encoding data...' : 'Awaiting compression...'}
               </span>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
