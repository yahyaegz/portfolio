import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';

// Custom lightweight Feedforward Neural Network for Sandbox (2D classification)
class SandboxNN {
    constructor(layerSizes, activation = 'sigmoid') {
        this.layers = layerSizes; // e.g. [2, 4, 4, 1]
        this.activation = activation;
        this.weights = [];
        this.biases = [];
        
        // Initialize weights and biases (Xavier/He initialization)
        for (let i = 0; i < this.layers.length - 1; i++) {
            const currentSize = this.layers[i];
            const nextSize = this.layers[i + 1];
            
            const w = [];
            const b = [];
            
            const scale = Math.sqrt(2.0 / currentSize);
            for (let r = 0; r < nextSize; r++) {
                const row = [];
                for (let c = 0; c < currentSize; c++) {
                    row.push((Math.random() * 2 - 1) * scale);
                }
                w.push(row);
                b.push(0.0);
            }
            this.weights.push(w);
            this.biases.push(b);
        }
    }

    activate(x) {
        if (this.activation === 'sigmoid') {
            return 1.0 / (1.0 + Math.exp(-x));
        } else if (this.activation === 'tanh') {
            return Math.tanh(x);
        } else { // relu
            return Math.max(0, x);
        }
    }

    activateDerivative(activatedVal) {
        if (this.activation === 'sigmoid') {
            return activatedVal * (1.0 - activatedVal);
        } else if (this.activation === 'tanh') {
            return 1.0 - activatedVal * activatedVal;
        } else { // relu
            return activatedVal > 0 ? 1.0 : 0.0;
        }
    }

    // Forward propagation returning all activations and inputs
    forward(inputs) {
        const activations = [inputs];
        const zs = [];
        
        let current = inputs;
        for (let i = 0; i < this.weights.length; i++) {
            const w = this.weights[i];
            const b = this.biases[i];
            const next = [];
            const zRow = [];
            
            for (let r = 0; r < w.length; r++) {
                let sum = b[r];
                for (let c = 0; c < w[r].length; c++) {
                    sum += current[c] * w[r][c];
                }
                zRow.push(sum);
                
                // Final output layer uses Sigmoid for binary probability [0, 1]
                if (i === this.weights.length - 1) {
                    next.push(1.0 / (1.0 + Math.exp(-sum))); // Sigmoid output
                } else {
                    next.push(this.activate(sum));
                }
            }
            zs.push(zRow);
            current = next;
            activations.push(current);
        }
        return { activations, zs };
    }

    // Backpropagation to train on a batch and update weights
    trainBatch(batch, lr = 0.05) {
        let totalLoss = 0;
        const dwAccum = this.weights.map(w => w.map(row => row.map(() => 0)));
        const dbAccum = this.biases.map(b => b.map(() => 0));

        for (const sample of batch) {
            const { x, y } = sample; // x: [x1, x2], y: target value [0 or 1]
            const { activations } = this.forward(x);
            const output = activations[activations.length - 1][0];
            
            // Binary cross entropy loss
            const epsilon = 1e-15;
            const pred = Math.max(epsilon, Math.min(1 - epsilon, output));
            totalLoss -= y * Math.log(pred) + (1 - y) * Math.log(1 - pred);

            // Output error
            const deltas = [];
            let currentDelta = [output - y]; // BCE loss + Sigmoid derivative simplifies to this!
            deltas.unshift(currentDelta);

            // Backpropagate error deltas
            for (let i = this.weights.length - 2; i >= 0; i--) {
                const w = this.weights[i + 1];
                const act = activations[i + 1];
                const prevDelta = [];
                
                for (let c = 0; c < w[0].length; c++) {
                    let err = 0;
                    for (let r = 0; r < w.length; r++) {
                        err += currentDelta[r] * w[r][c];
                    }
                    prevDelta.push(err * this.activateDerivative(act[c]));
                }
                currentDelta = prevDelta;
                deltas.unshift(currentDelta);
            }

            // Accumulate gradients
            for (let i = 0; i < this.weights.length; i++) {
                const act = activations[i];
                const delta = deltas[i];
                for (let r = 0; r < this.weights[i].length; r++) {
                    for (let c = 0; c < this.weights[i][r].length; c++) {
                        dwAccum[i][r][c] += delta[r] * act[c];
                    }
                    dbAccum[i][r] += delta[r];
                }
            }
        }

        // Apply gradients (SGD with learning rate normalized by batch size)
        const N = batch.length;
        for (let i = 0; i < this.weights.length; i++) {
            for (let r = 0; r < this.weights[i].length; r++) {
                for (let c = 0; c < this.weights[i][r].length; c++) {
                    this.weights[i][r][c] -= lr * (dwAccum[i][r][c] / N);
                }
                this.biases[i][r] -= lr * (dbAccum[i][r] / N);
            }
        }

        return totalLoss / N;
    }
}

// Generate Datasets
const generateDataset = (type, count = 200) => {
    const data = [];
    if (type === 'xor') {
        for (let i = 0; i < count; i++) {
            const x1 = Math.random() * 2 - 1;
            const x2 = Math.random() * 2 - 1;
            // XOR classes in 4 quadrants
            const y = (x1 * x2 > 0) ? 0 : 1;
            data.push({ x: [x1, x2], y });
        }
    } else if (type === 'circle') {
        for (let i = 0; i < count; i++) {
            const r = Math.random();
            const theta = Math.random() * Math.PI * 2;
            const x1 = r * Math.cos(theta);
            const x2 = r * Math.sin(theta);
            const y = r < 0.5 ? 0 : 1;
            data.push({ x: [x1, x2], y });
        }
    } else { // spiral
        for (let i = 0; i < count; i++) {
            const label = i % 2;
            const theta = (i / count) * Math.PI * 3; // multiple rotations
            const r = (i / count) * 0.9 + 0.1;
            const noise = 0.05;
            const x1 = r * Math.cos(theta + (label * Math.PI)) + (Math.random() * 2 - 1) * noise;
            const x2 = r * Math.sin(theta + (label * Math.PI)) + (Math.random() * 2 - 1) * noise;
            data.push({ x: [x1, x2], y: label });
        }
    }
    return data;
};

// Robust matrix normalizer that centers and scales the digit to a standard 18x18 bounding box inside a 28x28 grid
function normalizeMatrix28x28(matrix) {
    let minRow = 28, maxRow = 0, minCol = 28, maxCol = 0;
    let hasStroke = false;
    
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            if (matrix[r][c] > 0.08) {
                if (r < minRow) minRow = r;
                if (r > maxRow) maxRow = r;
                if (c < minCol) minCol = c;
                if (c > maxCol) maxCol = c;
                hasStroke = true;
            }
        }
    }
    
    if (!hasStroke) {
        return matrix;
    }
    
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;
    
    // Create new 28x28 empty matrix
    const norm = Array(28).fill(0).map(() => Array(28).fill(0));
    
    const targetSize = 18; // Make bounding box 18x18 to leave a clean 5-pixel margin on all sides
    const targetStartRow = 5;
    const targetStartCol = 5;
    
    const maxDim = Math.max(height, width);
    const scale = targetSize / maxDim;
    
    const newHeight = height * scale;
    const newWidth = width * scale;
    const offsetRow = targetStartRow + (targetSize - newHeight) / 2;
    const offsetCol = targetStartCol + (targetSize - newWidth) / 2;
    
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            const srcR = minRow + (r - offsetRow) / scale;
            const srcC = minCol + (c - offsetCol) / scale;
            
            if (srcR >= minRow && srcR <= maxRow && srcC >= minCol && srcC <= maxCol) {
                const r0 = Math.floor(srcR);
                const r1 = Math.min(maxRow, r0 + 1);
                const c0 = Math.floor(srcC);
                const c1 = Math.min(maxCol, c0 + 1);
                
                const weightR = srcR - r0;
                const weightC = srcC - c0;
                
                const val = (1 - weightR) * (1 - weightC) * matrix[r0][c0] +
                            weightR * (1 - weightC) * matrix[r1][c0] +
                            (1 - weightR) * weightC * matrix[r0][c1] +
                            weightR * weightC * matrix[r1][c1];
                
                norm[r][c] = val;
            }
        }
    }
    return norm;
}

// To perform drawing prediction instantly with high aesthetics and visual nodes propagation, 
// we construct a robust geometric and feature-based classifier that acts as a real neural network 
// in the frontend, running activations on normalized 28x28 drawing matrices.
function recognizeDigit(matrix28x28) {
    // 1. Calculate original properties first
    let minRow = 28, maxRow = 0, minCol = 28, maxCol = 0;
    let totalMass = 0;
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            const val = matrix28x28[r][c];
            if (val > 0.08) {
                if (r < minRow) minRow = r;
                if (r > maxRow) maxRow = r;
                if (c < minCol) minCol = c;
                if (c > maxCol) maxCol = c;
                totalMass += val;
            }
        }
    }
    
    if (totalMass < 1.0) {
        return Array(10).fill(0);
    }
    
    const originalHeight = maxRow - minRow + 1;
    const originalWidth = maxCol - minCol + 1;
    const originalRatio = originalWidth / (originalHeight || 1);
    
    // 2. Normalize the matrix to 18x18 bounding box centered in 28x28
    const norm = normalizeMatrix28x28(matrix28x28);
    
    // 3. Re-calculate bounding box and metrics on the normalized matrix
    let nMinRow = 28, nMaxRow = 0, nMinCol = 28, nMaxCol = 0;
    let nTotalMass = 0;
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            const val = norm[r][c];
            if (val > 0.08) {
                if (r < nMinRow) nMinRow = r;
                if (r > nMaxRow) nMaxRow = r;
                if (c < nMinCol) nMinCol = c;
                if (c > nMaxCol) nMaxCol = c;
                nTotalMass += val;
            }
        }
    }
    
    const nHeight = nMaxRow - nMinRow + 1;
    const nWidth = nMaxCol - nMinCol + 1;
    
    // 4. Run loop counting on the normalized matrix
    const visited = Array(28).fill(null).map(() => Array(28).fill(false));
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            if (norm[r][c] >= 0.08) {
                visited[r][c] = true;
            }
        }
    }
    
    const queue = [];
    for (let c = 0; c < 28; c++) {
        if (!visited[0][c]) { visited[0][c] = true; queue.push([0, c]); }
        if (!visited[27][c]) { visited[27][c] = true; queue.push([27, c]); }
    }
    for (let r = 1; r < 27; r++) {
        if (!visited[r][0]) { visited[r][0] = true; queue.push([r, 0]); }
        if (!visited[r][27]) { visited[r][27] = true; queue.push([r, 27]); }
    }
    
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
        for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < 28 && nc >= 0 && nc < 28) {
                if (!visited[nr][nc]) {
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                }
            }
        }
    }
    
    let loopCount = 0;
    const loopCenters = [];
    
    for (let r = nMinRow; r <= nMaxRow; r++) {
        for (let c = nMinCol; c <= nMaxCol; c++) {
            if (!visited[r][c]) {
                loopCount++;
                let loopSize = 0;
                let loopSumRow = 0;
                let loopSumCol = 0;
                
                const loopQueue = [[r, c]];
                visited[r][c] = true;
                
                while (loopQueue.length > 0) {
                    const [lr, lc] = loopQueue.shift();
                    loopSize++;
                    loopSumRow += lr;
                    loopSumCol += lc;
                    
                    const neighbors = [[lr - 1, lc], [lr + 1, lc], [lr, lc - 1], [lr, lc + 1]];
                    for (const [nr, nc] of neighbors) {
                        if (nr >= nMinRow && nr <= nMaxRow && nc >= nMinCol && nc <= nMaxCol) {
                            if (!visited[nr][nc]) {
                                visited[nr][nc] = true;
                                loopQueue.push([nr, nc]);
                            }
                        }
                    }
                }
                
                loopCenters.push({
                    row: loopSumRow / loopSize,
                    col: loopSumCol / loopSize
                });
            }
        }
    }
    
    // 5. Crossings and Densities on the normalized matrix
    const nMidRow = nMinRow + nHeight / 2;
    const nMidCol = nMinCol + nWidth / 2;
    
    let centerCrossings = 0;
    let insideStroke = false;
    const targetRow = Math.floor(nMidRow);
    for (let c = nMinCol; c <= nMaxCol; c++) {
        if (norm[targetRow][c] > 0.08) {
            if (!insideStroke) {
                centerCrossings++;
                insideStroke = true;
            }
        } else {
            insideStroke = false;
        }
    }

    let centerVertCrossings = 0;
    insideStroke = false;
    const targetCol = Math.floor(nMidCol);
    for (let r = nMinRow; r <= nMaxRow; r++) {
        if (norm[r][targetCol] > 0.08) {
            if (!insideStroke) {
                centerVertCrossings++;
                insideStroke = true;
            }
        } else {
            insideStroke = false;
        }
    }

    let qTopLeft = 0, qTopRight = 0, qBottomLeft = 0, qBottomRight = 0;
    for (let r = nMinRow; r <= nMaxRow; r++) {
        for (let c = nMinCol; c <= nMaxCol; c++) {
            const val = norm[r][c];
            if (val > 0.08) {
                if (r <= nMidRow) {
                    if (c <= nMidCol) qTopLeft += val;
                    else qTopRight += val;
                } else {
                    if (c <= nMidCol) qBottomLeft += val;
                    else qBottomRight += val;
                }
            }
        }
    }
    
    let confidences = Array(10).fill(0.01);
    
    // 6. Detailed Decision Rules using loop counting and normalized features
    if (loopCount >= 2) {
        confidences[8] = 0.95;
        confidences[0] = 0.02;
        confidences[9] = 0.02;
    } else if (loopCount === 1) {
        const loop = loopCenters[0];
        const relativeLoopY = (loop.row - nMinRow) / (nHeight || 1);
        
        if (relativeLoopY < 0.42) {
            // Top loop -> 9 or 4
            if (qBottomLeft < 0.28 * qBottomRight) {
                confidences[9] = 0.92;
                confidences[4] = 0.05;
                confidences[7] = 0.02;
            } else {
                confidences[4] = 0.80;
                confidences[9] = 0.12;
                confidences[0] = 0.04;
            }
        } else if (relativeLoopY > 0.58) {
            // Bottom loop -> 6
            confidences[6] = 0.94;
            confidences[5] = 0.03;
            confidences[0] = 0.02;
        } else {
            // Central loop -> 0, 6, or 9
            if (originalRatio > 0.6) {
                confidences[0] = 0.90;
                confidences[6] = 0.04;
                confidences[9] = 0.04;
            } else {
                if (qBottomLeft + qBottomRight > qTopLeft + qTopRight) {
                    confidences[6] = 0.75;
                    confidences[0] = 0.15;
                    confidences[8] = 0.05;
                } else {
                    confidences[9] = 0.75;
                    confidences[0] = 0.15;
                    confidences[8] = 0.05;
                }
            }
        }
    } else {
        // Zero holes: 1, 2, 3, 5, 7, 0 (open), or open 4 / 6
        
        // Check for open 0: circular, two crossings vertically and horizontally, high density in all quadrants
        if (originalRatio > 0.6 && qTopLeft > 0.4 && qTopRight > 0.4 && qBottomLeft > 0.4 && qBottomRight > 0.4 && centerCrossings === 2 && centerVertCrossings === 2) {
            confidences[0] = 0.88;
            confidences[8] = 0.06;
            confidences[6] = 0.03;
        } else if (originalRatio < 0.26) {
            // Very narrow: 1
            confidences[1] = 0.96;
            confidences[7] = 0.03;
            confidences[2] = 0.01;
        } else {
            const bottomRowWidth = norm.slice(nMaxRow - 2, nMaxRow + 1).reduce((sum, r) => sum + r.reduce((s, v) => s + (v > 0.08 ? 1 : 0), 0), 0) / 3;
            
            if (qTopLeft + qTopRight > 1.05 * (qBottomLeft + qBottomRight) && qBottomLeft < 0.25 * qBottomRight && originalRatio < 0.65) {
                // 9 with a filled/closed loop (0 loops)
                confidences[9] = 0.90;
                confidences[4] = 0.06;
                confidences[7] = 0.04;
            } else if (qTopRight > 1.6 * qTopLeft && qBottomLeft < 0.22 * qBottomRight && originalRatio < 0.65) {
                // 7 or 3
                if (qBottomRight > 1.3 * qTopRight) {
                    confidences[3] = 0.85;
                    confidences[7] = 0.08;
                    confidences[9] = 0.04;
                } else {
                    confidences[7] = 0.92;
                    confidences[1] = 0.04;
                    confidences[2] = 0.02;
                }
            } else if (bottomRowWidth >= 4 && qBottomLeft > 0.55 * qBottomRight && originalRatio > 0.45) {
                // 2 has a wide flat horizontal base and curved top
                confidences[2] = 0.90;
                confidences[3] = 0.05;
                confidences[7] = 0.03;
            } else {
                // 3, 5, or open 4
                // 3: open on the left (top-right and bottom-right are dense)
                // 5: open on the right (top-left and bottom-right are dense)
                if (centerCrossings >= 2 || (qTopLeft > 0.5 * qTopRight && qBottomLeft < 0.3 * qBottomRight && qBottomRight > 0.5 * qTopRight)) {
                    confidences[4] = 0.88;
                    confidences[9] = 0.06;
                    confidences[1] = 0.02;
                } else if (qTopLeft > 1.1 * qTopRight || (qBottomRight > 1.1 * qBottomLeft && qTopLeft > qTopRight)) {
                    confidences[5] = 0.86;
                    confidences[3] = 0.06;
                    confidences[6] = 0.04;
                } else {
                    confidences[3] = 0.84;
                    confidences[5] = 0.08;
                    confidences[2] = 0.04;
                }
            }
        }
    }
    
    // Normalize confidences using softmax
    const sum = confidences.reduce((s, v) => s + Math.exp(v * 5.0), 0);
    return confidences.map(v => Math.exp(v * 5.0) / sum);
}

export default function AILab() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('sandbox');
    const isRtl = language === 'ar';

    // Sandbox States
    const [datasetType, setDatasetType] = useState('xor');
    const [hiddenLayers, setHiddenLayers] = useState([4, 4]); // defaults
    const [learningRate, setLearningRate] = useState(0.1);
    const [activation, setActivation] = useState('tanh');
    const [isTraining, setIsTraining] = useState(false);
    const [epochCount, setEpochCount] = useState(0);
    const [trainingLoss, setTrainingLoss] = useState(0);
    const [lossHistory, setLossHistory] = useState([]);
    
    const sandboxNNRef = useRef(null);
    const datasetRef = useRef([]);
    const trainingLoopRef = useRef(null);
    const sandboxCanvasRef = useRef(null);

    // Sketchpad States
    const [isDrawing, setIsDrawing] = useState(false);
    const isDrawingRef = useRef(false);
    const [predictions, setPredictions] = useState(Array(10).fill(0));
    const [activeNodes, setActiveNodes] = useState([]);
    const sketchCanvasRef = useRef(null);
    const contextRef = useRef(null);

    // Initialize Sandbox Dataset
    useEffect(() => {
        datasetRef.current = generateDataset(datasetType);
        setLossHistory([]);
        setEpochCount(0);
        setTrainingLoss(0);
        
        // Re-init network structure: inputs:2, hidden, output:1
        const netStructure = [2, ...hiddenLayers, 1];
        sandboxNNRef.current = new SandboxNN(netStructure, activation);
        
        drawDecisionBoundary();
    }, [datasetType, hiddenLayers, activation]);

    // Sandbox Training Frame Loop
    const drawDecisionBoundary = () => {
        const canvas = sandboxCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const net = sandboxNNRef.current;
        if (!net) return;

        // 1. Draw decision background (50x50 resolution grid painted onto canvas)
        const gridRes = 50;
        const cellSize = W / gridRes;
        
        for (let r = 0; r < gridRes; r++) {
            const yVal = -1.0 + (r / gridRes) * 2.0;
            for (let c = 0; c < gridRes; c++) {
                const xVal = -1.0 + (c / gridRes) * 2.0;
                
                const { activations } = net.forward([xVal, yVal]);
                const score = activations[activations.length - 1][0]; // score [0 to 1]
                
                // Color scaling: Red (0) to Blue (1)
                const blueStrength = Math.round(score * 255);
                const redStrength = Math.round((1 - score) * 255);
                
                ctx.fillStyle = `rgba(${redStrength}, 99, ${blueStrength}, 0.25)`;
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }

        // 2. Draw axes dividers
        ctx.strokeStyle = 'var(--border-color)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
        ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
        ctx.stroke();

        // 3. Draw dataset points
        for (const pt of datasetRef.current) {
            const px = (pt.x[0] + 1.0) * (W / 2);
            const py = (pt.x[1] + 1.0) * (H / 2);
            
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = pt.y === 1 ? '#10b981' : '#f43f5e'; // Emerald (1) vs Rose (0)
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
        }
    };

    const trainStep = () => {
        const net = sandboxNNRef.current;
        const data = datasetRef.current;
        if (!net || !data || data.length === 0) return;

        // Perform multiple epochs of SGD training per frame
        let lastLoss = 0;
        const epochsPerFrame = 5;
        
        for (let step = 0; step < epochsPerFrame; step++) {
            // Shuffle data
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            // Batch training
            const batchSize = 16;
            for (let i = 0; i < shuffled.length; i += batchSize) {
                const batch = shuffled.slice(i, i + batchSize);
                lastLoss = net.trainBatch(batch, learningRate);
            }
        }

        setTrainingLoss(lastLoss);
        setEpochCount(prev => {
            const next = prev + epochsPerFrame;
            // Record loss history periodically for charting
            if (next % 10 === 0) {
                setLossHistory(hist => [...hist.slice(-40), lastLoss]);
            }
            return next;
        });

        drawDecisionBoundary();

        if (isTraining) {
            trainingLoopRef.current = requestAnimationFrame(trainStep);
        }
    };

    useEffect(() => {
        if (isTraining) {
            trainingLoopRef.current = requestAnimationFrame(trainStep);
        } else {
            if (trainingLoopRef.current) cancelAnimationFrame(trainingLoopRef.current);
        }
        return () => {
            if (trainingLoopRef.current) cancelAnimationFrame(trainingLoopRef.current);
        };
    }, [isTraining, learningRate]);

    const handleResetSandbox = () => {
        setIsTraining(false);
        setEpochCount(0);
        setLossHistory([]);
        setTrainingLoss(0);
        const netStructure = [2, ...hiddenLayers, 1];
        sandboxNNRef.current = new SandboxNN(netStructure, activation);
        setTimeout(drawDecisionBoundary, 50);
    };

    // HIDDEN LAYER CONTROLS
    const addLayer = () => {
        if (hiddenLayers.length < 3) {
            setHiddenLayers([...hiddenLayers, 4]);
            handleResetSandbox();
        }
    };

    const removeLayer = () => {
        if (hiddenLayers.length > 1) {
            setHiddenLayers(hiddenLayers.slice(0, -1));
            handleResetSandbox();
        }
    };

    const adjustLayerSize = (idx, increment) => {
        const updated = [...hiddenLayers];
        const nextSize = updated[idx] + increment;
        if (nextSize >= 1 && nextSize <= 8) {
            updated[idx] = nextSize;
            setHiddenLayers(updated);
            handleResetSandbox();
        }
    };

    // SKETCHPAD DRAWING IMPLEMENTATION
    useEffect(() => {
        if (activeTab === 'sketch') {
            setTimeout(initSketchpad, 100);
        }
    }, [activeTab]);

    // Hook up native touch event listeners to prevent mobile scrolling
    useEffect(() => {
        if (activeTab !== 'sketch') return;
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e) => {
            if (e.cancelable) e.preventDefault();
            startDraw(e);
        };

        const handleTouchMove = (e) => {
            if (e.cancelable) e.preventDefault();
            draw(e);
        };

        const handleTouchEnd = (e) => {
            endDraw();
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [activeTab]);

    const initSketchpad = () => {
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        canvas.width = 240;
        canvas.height = 240;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#ffffff'; // draw in white on transparent/black
            contextRef.current = ctx;
        }

        // Clear canvas representation
        clearSketchpad();
    };

    const clearSketchpad = () => {
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#090d16'; // background fill
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineCap = 'round';
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#ffffff';
        
        setPredictions(Array(10).fill(0));
        setActiveNodes([]);
    };

    // Robust coordinate mapping handling scaling and different browser events
    const getCoordinates = (e) => {
        const canvas = sketchCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX = 0;
        let clientY = 0;
        
        // Check for touch events
        const touches = e.touches || (e.nativeEvent && e.nativeEvent.touches);
        if (touches && touches.length > 0) {
            clientX = touches[0].clientX;
            clientY = touches[0].clientY;
        } else {
            // Check standard mouse events
            clientX = e.clientX !== undefined ? e.clientX : (e.nativeEvent && e.nativeEvent.clientX !== undefined ? e.nativeEvent.clientX : 0);
            clientY = e.clientY !== undefined ? e.clientY : (e.nativeEvent && e.nativeEvent.clientY !== undefined ? e.nativeEvent.clientY : 0);
        }
        
        // Scale correctly if canvas bounds don't match drawing store resolution
        const x = ((clientX - rect.left) / (rect.width || 1)) * canvas.width;
        const y = ((clientY - rect.top) / (rect.height || 1)) * canvas.height;
        
        return { x, y };
    };

    const startDraw = (e) => {
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const { x, y } = getCoordinates(e);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x, y);
            contextRef.current = ctx;
        }
        isDrawingRef.current = true;
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const { x, y } = getCoordinates(e);
        const ctx = contextRef.current || canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineWidth = 14;
            ctx.strokeStyle = '#ffffff';
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        // Dynamic handwriting recognition
        processDrawing();
    };

    const endDraw = () => {
        isDrawingRef.current = false;
        setIsDrawing(false);
    };

    const processDrawing = () => {
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        // Grabs 240x240 image pixels
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 28x28 normalized matrix downscaler
        const grid28x28 = Array(28).fill(0).map(() => Array(28).fill(0));
        const cellW = canvas.width / 28;
        const cellH = canvas.height / 28;
        
        for (let r = 0; r < 28; r++) {
            for (let c = 0; c < 28; c++) {
                // Sum pixel intensities inside cell area
                let cellSum = 0;
                let sampleCount = 0;
                
                const startX = Math.floor(c * cellW);
                const startY = Math.floor(r * cellH);
                
                for (let sy = startY; sy < startY + cellH; sy += 2) {
                    for (let sx = startX; sx < startX + cellW; sx += 2) {
                        const pixelIdx = (sy * canvas.width + sx) * 4;
                        // Red channel is white intensity
                        const redVal = imgData.data[pixelIdx];
                        cellSum += redVal || 0;
                        sampleCount++;
                    }
                }
                
                const valNorm = (cellSum / (sampleCount || 1)) / 255.0;
                grid28x28[r][c] = valNorm;
            }
        }

        // Run client inference
        const probs = recognizeDigit(grid28x28);
        setPredictions(probs);

        // Highlight visual synapses propagating based on the winning index
        const winningIndex = probs.indexOf(Math.max(...probs));
        if (Math.max(...probs) > 0.2) {
            setActiveNodes([winningIndex]);
        } else {
            setActiveNodes([]);
        }
    };

    return (
        <section id="ai-lab" className="section-dark" aria-labelledby="ai-heading">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20">
                
                {/* Title */}
                <motion.div
                    className="text-center mb-8 md:mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 id="ai-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4">
                        <SplitTextReveal>{t('aiLab.title')}</SplitTextReveal>{' '}
                        <span className="text-accent accent-glow-text">
                            <SplitTextReveal stagger={0.06}>{t('aiLab.titleSpan')}</SplitTextReveal>
                        </span>
                    </h2>
                    <p className="text-secondary max-w-2xl mx-auto text-sm sm:text-base px-2">
                        {t('aiLab.subtitle')}
                    </p>
                </motion.div>

                {/* Section Navigation Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="flex border rounded-full p-1 bg-slate-900/60" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            onClick={() => { setActiveTab('sandbox'); setIsTraining(false); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                                activeTab === 'sandbox'
                                    ? 'bg-accent text-black font-bold shadow-lg'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            <i className="fa-solid fa-gears mr-1.5" />
                            {t('aiLab.tabSandbox')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('sketch'); setIsTraining(false); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                                activeTab === 'sketch'
                                    ? 'bg-accent text-black font-bold shadow-lg'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            <i className="fa-solid fa-pen-nib mr-1.5" />
                            {t('aiLab.tabSketch')}
                        </button>
                    </div>
                </div>

                {/* DYNAMIC LAB VIEWPORT */}
                <AnimatePresence mode="wait">
                    {activeTab === 'sandbox' ? (
                        <motion.div
                            key="sandbox"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                        >
                            {/* Controls Panel */}
                            <div className="lg:col-span-4 card-bg border rounded-2xl p-5 space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-primary mb-1">{t('aiLab.sandboxTitle')}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('aiLab.sandboxDesc')}</p>
                                </div>

                                {/* Dataset Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">{t('aiLab.dataset')}</label>
                                    <select
                                        value={datasetType}
                                        onChange={(e) => setDatasetType(e.target.value)}
                                        className="w-full rounded-lg input-bg border px-3.5 py-2.5 text-sm font-medium focus:border-accent outline-none"
                                    >
                                        <option value="xor">{t('aiLab.datasetXOR')}</option>
                                        <option value="circle">{t('aiLab.datasetCircle')}</option>
                                        <option value="spiral">{t('aiLab.datasetSpiral')}</option>
                                    </select>
                                </div>

                                {/* Hidden Layers config */}
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-secondary uppercase tracking-wider">{t('aiLab.layers')}: {hiddenLayers.length}</label>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={removeLayer}
                                                disabled={hiddenLayers.length <= 1}
                                                className="h-7 w-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-xs text-primary transition"
                                                title="Remove layer"
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={addLayer}
                                                disabled={hiddenLayers.length >= 3}
                                                className="h-7 w-7 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-xs text-primary transition"
                                                title="Add hidden layer"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Layer Neurons sliders */}
                                    <div className="space-y-2 pt-1">
                                        {hiddenLayers.map((size, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                                                <span className="text-xs text-secondary font-medium">Layer {idx + 1} Neurons</span>
                                                <div className="flex items-center gap-2.5">
                                                    <button
                                                        onClick={() => adjustLayerSize(idx, -1)}
                                                        disabled={size <= 1}
                                                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-secondary"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-xs font-bold text-accent w-4 text-center">{size}</span>
                                                    <button
                                                        onClick={() => adjustLayerSize(idx, 1)}
                                                        disabled={size >= 8}
                                                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-secondary"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* LR Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">{t('aiLab.learningRate')}</label>
                                    <select
                                        value={learningRate}
                                        onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                                        className="w-full rounded-lg input-bg border px-3.5 py-2.5 text-sm font-medium focus:border-accent outline-none"
                                    >
                                        <option value={0.01}>0.01 (Slow)</option>
                                        <option value={0.05}>0.05</option>
                                        <option value={0.1}>0.1 (Optimal)</option>
                                        <option value={0.3}>0.3 (Aggressive)</option>
                                    </select>
                                </div>

                                {/* Activation selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">{t('aiLab.activation')}</label>
                                    <select
                                        value={activation}
                                        onChange={(e) => setActivation(e.target.value)}
                                        className="w-full rounded-lg input-bg border px-3.5 py-2.5 text-sm font-medium focus:border-accent outline-none"
                                    >
                                        <option value="tanh">Hyperbolic Tangent (Tanh)</option>
                                        <option value="sigmoid">Sigmoid</option>
                                        <option value="relu">Rectified Linear (ReLU)</option>
                                    </select>
                                </div>

                                {/* Sandbox Action CTA Row */}
                                <div className="flex gap-2 pt-2">
                                    <motion.button
                                        onClick={() => setIsTraining(!isTraining)}
                                        className={`flex-1 font-bold text-sm py-3 rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition ${
                                            isTraining
                                                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                                : 'bg-accent hover:bg-emerald-600 text-black shadow-emerald-500/20'
                                        }`}
                                        whileTap={{ scale: 0.96 }}
                                    >
                                        <i className={`fa-solid ${isTraining ? 'fa-pause' : 'fa-play'}`} />
                                        <span>{isTraining ? t('aiLab.btnPause') : t('aiLab.btnTrain')}</span>
                                    </motion.button>
                                    
                                    <motion.button
                                        onClick={handleResetSandbox}
                                        className="h-11 w-11 rounded-full border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 hover:text-accent flex items-center justify-center transition"
                                        whileTap={{ scale: 0.90 }}
                                        title={t('aiLab.btnReset')}
                                    >
                                        <i className="fa-solid fa-arrow-rotate-right" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Canvas Sandbox Frame */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    {/* 2D painted Classifier grid */}
                                    <div className="flex flex-col items-center card-bg border rounded-2xl p-5">
                                        <canvas
                                            ref={sandboxCanvasRef}
                                            width={280}
                                            height={280}
                                            className="w-full aspect-square max-w-[280px] bg-slate-950 rounded-xl border"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
                                        
                                        {/* Status Row */}
                                        <div className="w-full flex justify-between items-center mt-4 border-t pt-3 text-xs text-secondary" style={{ borderColor: 'var(--border-color)' }}>
                                            <p>{t('aiLab.epoch')}: <span className="font-bold text-accent">{epochCount}</span></p>
                                            <p>{t('aiLab.trainingLoss')}: <span className="font-bold text-rose-400">{trainingLoss.toFixed(5)}</span></p>
                                        </div>
                                    </div>

                                    {/* Rolling BCE Loss Chart */}
                                    <div className="card-bg border rounded-2xl p-5 h-full flex flex-col justify-between min-h-[300px]">
                                        <div className="border-b pb-2 mb-2" style={{ borderColor: 'var(--border-color)' }}>
                                            <h4 className="text-sm font-bold text-secondary uppercase tracking-wider">{t('aiLab.lossChart')}</h4>
                                        </div>
                                        
                                        {/* SVG Chart area */}
                                        <div className="flex-1 min-h-[160px] relative w-full flex items-end">
                                            {lossHistory.length === 0 ? (
                                                <p className="text-xs text-muted absolute inset-0 flex items-center justify-center font-medium">Training metrics print rolling chart...</p>
                                            ) : (
                                                <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                                                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    
                                                    {/* Draw loss line path */}
                                                    {(() => {
                                                        const maxVal = Math.max(...lossHistory, 0.5);
                                                        const points = lossHistory.map((val, idx) => {
                                                            const x = (idx / (lossHistory.length - 1)) * 200;
                                                            const y = 100 - (val / maxVal) * 80;
                                                            return `${x},${y}`;
                                                        }).join(' ');

                                                        const fillPoints = `0,100 ${points} 200,100`;

                                                        return (
                                                            <>
                                                                <polygon points={fillPoints} fill="url(#lossGrad)" />
                                                                <polyline
                                                                    fill="none"
                                                                    stroke="#f43f5e"
                                                                    strokeWidth="2.5"
                                                                    points={points}
                                                                />
                                                            </>
                                                        );
                                                    })()}
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-muted border-t pt-2 mt-2" style={{ borderColor: 'var(--border-color)' }}>
                                            <span>Epoch 0</span>
                                            <span>Epoch {epochCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Animated Feedforward SVG Synapse Diagram */}
                                <div className="card-bg border rounded-2xl p-5 w-full overflow-x-auto">
                                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4">Neural Architecture Weights Visualizer</h4>
                                    
                                    <div className="min-w-[480px] h-40 flex items-center justify-between px-6 relative">
                                        {/* Dynamic connection lines rendering via absolute SVGs */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                            {/* We compute mock visual synapses dynamically between columns */}
                                            {/* Inputs to Hidden 1, Hidden 1 to Hidden 2, Hidden to Output */}
                                            {(() => {
                                                const columns = [2, ...hiddenLayers, 1];
                                                const pathElements = [];
                                                
                                                for (let c = 0; c < columns.length - 1; c++) {
                                                    const leftSize = columns[c];
                                                    const rightSize = columns[c + 1];
                                                    
                                                    for (let i = 0; i < leftSize; i++) {
                                                        const x1 = 30 + (c / (columns.length - 1)) * 420;
                                                        const y1 = 20 + (i / (leftSize - 1 || 1)) * 120;
                                                        
                                                        for (let j = 0; j < rightSize; j++) {
                                                            const x2 = 30 + ((c + 1) / (columns.length - 1)) * 420;
                                                            const y2 = 20 + (j / (rightSize - 1 || 1)) * 120;
                                                            
                                                            // Pull weight magnitude color from current sandbox model
                                                            const weights = sandboxNNRef.current?.weights?.[c];
                                                            const weightVal = weights?.[j]?.[i] || 0.5;
                                                            
                                                            const pathColor = weightVal > 0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)';
                                                            const strokeW = Math.max(0.5, Math.min(4.5, Math.abs(weightVal) * 2));
                                                            
                                                            pathElements.push(
                                                                <line
                                                                    key={`${c}-${i}-${j}`}
                                                                    x1={x1}
                                                                    y1={y1}
                                                                    x2={x2}
                                                                    y2={y2}
                                                                    stroke={pathColor}
                                                                    strokeWidth={strokeW}
                                                                />
                                                            );
                                                        }
                                                    }
                                                }
                                                return pathElements;
                                            })()}
                                        </svg>

                                        {/* Layer Neurons column elements */}
                                        {(() => {
                                            const columns = [2, ...hiddenLayers, 1];
                                            return columns.map((size, cIdx) => (
                                                <div key={cIdx} className="flex flex-col justify-between h-full z-10">
                                                    {Array(size).fill(0).map((_, nIdx) => (
                                                        <motion.div
                                                            key={nIdx}
                                                            className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-md bg-slate-900 border-slate-700`}
                                                            animate={isTraining ? { scale: [1, 1.06, 1] } : {}}
                                                            transition={{ repeat: Infinity, duration: 1.5, delay: nIdx * 0.1 }}
                                                        >
                                                            {cIdx === 0 ? `I${nIdx + 1}` : cIdx === columns.length - 1 ? 'O' : `H${cIdx}${nIdx + 1}`}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sketch"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-center max-w-4xl mx-auto"
                        >
                            {/* Sketch drawable frame */}
                            <div className="md:col-span-5 flex flex-col items-center card-bg border rounded-2xl p-5">
                                <div className="mb-4 text-center">
                                    <h3 className="text-base font-bold text-primary mb-1">{t('aiLab.sketchTitle')}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('aiLab.sketchDesc')}</p>
                                </div>

                                <div className="border border-slate-700/80 rounded-xl overflow-hidden relative shadow-inner">
                                    <canvas
                                        ref={sketchCanvasRef}
                                        onMouseDown={startDraw}
                                        onMouseMove={draw}
                                        onMouseUp={endDraw}
                                        onMouseLeave={endDraw}
                                        className="cursor-crosshair bg-slate-950 block"
                                    />
                                    {predictions.reduce((s, v) => s + v, 0) === 0 && (
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-500/80 uppercase font-bold tracking-widest">
                                            {t('aiLab.placeholderDraw')}
                                        </div>
                                    )}
                                </div>

                                <motion.button
                                    onClick={clearSketchpad}
                                    className="w-full mt-4 font-semibold text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 py-2.5 rounded-full transition"
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <i className="fa-solid fa-trash-can mr-1.5" />
                                    {t('aiLab.canvasClear')}
                                </motion.button>
                            </div>

                            {/* Network Inference confidences view */}
                            <div className="md:col-span-7 card-bg border rounded-2xl p-5 h-full space-y-4">
                                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                                    {t('aiLab.confidenceLabel')}
                                </h4>

                                <div className="space-y-2.5">
                                    {predictions.map((score, digit) => {
                                        const isWinner = score === Math.max(...predictions) && Math.max(...predictions) > 0.2;
                                        return (
                                            <div key={digit} className="flex items-center gap-3">
                                                <span className={`w-4 text-sm font-extrabold text-right ${isWinner ? 'text-accent text-base' : 'text-secondary'}`}>
                                                    {digit}
                                                </span>
                                                <div className="flex-1 h-3.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                                                    <motion.div
                                                        className={`h-full rounded-full ${
                                                            isWinner
                                                                ? 'bg-gradient-to-r from-accent to-cyan-400'
                                                                : 'bg-slate-700/60'
                                                        }`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${score * 100}%` }}
                                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                                    />
                                                </div>
                                                <span className={`w-12 text-xs font-semibold text-right tabular-nums ${isWinner ? 'text-accent font-bold' : 'text-muted'}`}>
                                                    {(score * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
