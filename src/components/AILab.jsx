import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';
import SectionBackground from './SectionBackground';
import mnistWeights from '../data/mnist_weights.json';

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
    
    // Normalize to [0, 1] first so bounding box threshold is robust
    let maxVal = 0;
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            if (matrix[r][c] > maxVal) maxVal = matrix[r][c];
        }
    }
    if (maxVal > 0) {
        for (let r = 0; r < 28; r++) {
            for (let c = 0; c < 28; c++) {
                matrix[r][c] /= maxVal;
            }
        }
    }
    
    // 1. Find Bounding Box
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            if (matrix[r][c] > 0.1) {
                if (r < minRow) minRow = r;
                if (r > maxRow) maxRow = r;
                if (c < minCol) minCol = c;
                if (c > maxCol) maxCol = c;
                hasStroke = true;
            }
        }
    }
    
    if (!hasStroke) return matrix;
    
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;
    
    // 2. Scale digit to fit inside a 20x20 box (MNIST standard)
    const targetSize = 20;
    const maxDim = Math.max(height, width);
    const scale = targetSize / maxDim;
    
    // 3. Compute Center of Mass
    const temp = Array(28).fill(0).map(() => Array(28).fill(0));
    let mass = 0, cx = 0, cy = 0;
    
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            const srcR = minRow + r / scale;
            const srcC = minCol + c / scale;
            
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
                
                temp[r][c] = val;
                
                mass += val;
                cy += val * r;
                cx += val * c;
            }
        }
    }
    
    if (mass === 0) return matrix;
    
    cy /= mass;
    cx /= mass;
    
    // 4. Translate image so Center of Mass is at (14, 14)
    const shiftX = 14.0 - cx;
    const shiftY = 14.0 - cy;
    
    const norm = Array(28).fill(0).map(() => Array(28).fill(0));
    
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            const srcR = r - shiftY;
            const srcC = c - shiftX;
            
            if (srcR >= 0 && srcR <= 27 && srcC >= 0 && srcC <= 27) {
                const r0 = Math.floor(srcR);
                const r1 = Math.min(27, r0 + 1);
                const c0 = Math.floor(srcC);
                const c1 = Math.min(27, c0 + 1);
                
                const weightR = srcR - r0;
                const weightC = srcC - c0;
                
                const val = (1 - weightR) * (1 - weightC) * temp[r0][c0] +
                            weightR * (1 - weightC) * temp[r1][c0] +
                            (1 - weightR) * weightC * temp[r0][c1] +
                            weightR * weightC * temp[r1][c1];
                
                norm[r][c] = val;
            }
        }
    }
    return norm;
}

const RAW_TEMPLATES = [
    // 0
    {
        digit: 0,
        grid: [
            "....####....",
            "..##....##..",
            ".##......##.",
            "##........##",
            "##........##",
            "##........##",
            "##........##",
            "##........##",
            "##........##",
            ".##......##.",
            "..##....##..",
            "....####...."
        ]
    },
    {
        digit: 0,
        grid: [
            ".....###....",
            "...##...##..",
            "..##.....##.",
            ".##.......##",
            ".##.......##",
            ".##.......##",
            ".##.......##",
            ".##.......##",
            "..##.....##.",
            "...##...##..",
            ".....###....",
            "............"
        ]
    },
    // 1
    {
        digit: 1,
        grid: [
            "....##......",
            "...###......",
            "....##......",
            "....##......",
            "....##......",
            "....##......",
            "....##......",
            "....##......",
            "....##......",
            "....##......",
            "...####.....",
            "............"
        ]
    },
    {
        digit: 1,
        grid: [
            "......##....",
            "......##....",
            ".....##.....",
            ".....##.....",
            ".....##.....",
            "....##......",
            "....##......",
            "....##......",
            "...##.......",
            "...##.......",
            "...##.......",
            "............"
        ]
    },
    // 2
    {
        digit: 2,
        grid: [
            "...####.....",
            "..##..##....",
            "##.....##...",
            "......##....",
            ".....##.....",
            "....##......",
            "...##.......",
            "..##........",
            ".##.........",
            "##..........",
            "##########..",
            "............"
        ]
    },
    {
        digit: 2,
        grid: [
            "..#####.....",
            ".##...##....",
            "......##....",
            ".....##.....",
            "....##......",
            "...##.......",
            "..##........",
            ".##.........",
            "##.....##...",
            "##....##....",
            ".######.....",
            "............"
        ]
    },
    // 3
    {
        digit: 3,
        grid: [
            "..#####.....",
            ".##...##....",
            "......##....",
            ".....##.....",
            "....###.....",
            "......##....",
            ".......##...",
            "........##..",
            "........##..",
            ".##....##...",
            "..######....",
            "............"
        ]
    },
    {
        digit: 3,
        grid: [
            "########....",
            ".....##.....",
            "....##......",
            "...##.......",
            "....###.....",
            "......##....",
            ".......##...",
            "........##..",
            "........##..",
            ".......##...",
            "..######....",
            "............"
        ]
    },
    // 4
    {
        digit: 4,
        grid: [
            "....##.##...",
            "...##..##...",
            "..##...##...",
            ".##....##...",
            "##.....##...",
            "#########...",
            ".......##...",
            ".......##...",
            ".......##...",
            ".......##...",
            ".......##...",
            "............"
        ]
    },
    {
        digit: 4,
        grid: [
            "......##....",
            ".....###....",
            "....####....",
            "...##.##....",
            "..##..##....",
            ".##...##....",
            "#########...",
            "......##....",
            "......##....",
            "......##....",
            "......##....",
            "............"
        ]
    },
    // 5
    {
        digit: 5,
        grid: [
            "########....",
            "##..........",
            "##..........",
            "#####.......",
            "....###.....",
            "......##....",
            ".......##...",
            "........##..",
            "........##..",
            "##.....##...",
            ".#######....",
            "............"
        ]
    },
    {
        digit: 5,
        grid: [
            ".#######....",
            ".##.........",
            ".##.........",
            ".######.....",
            "......##....",
            ".......##...",
            "........##..",
            "........##..",
            ".......##...",
            ".##...##....",
            "..#####.....",
            "............"
        ]
    },
    // 6
    {
        digit: 6,
        grid: [
            "....####....",
            "...##.......",
            "..##........",
            ".##.........",
            ".######.....",
            "##....##....",
            "##.....##...",
            "##.....##...",
            "##.....##...",
            "##....##....",
            ".######.....",
            "............"
        ]
    },
    {
        digit: 6,
        grid: [
            ".....###....",
            "....##......",
            "...##.......",
            "..##........",
            "..######....",
            ".##....##...",
            ".##.....##..",
            ".##.....##..",
            ".##....##...",
            "..######....",
            "............",
            "............"
        ]
    },
    // 7
    {
        digit: 7,
        grid: [
            "##########..",
            ".......##...",
            "......##....",
            ".....##.....",
            "....##......",
            "...##.......",
            "...##.......",
            "..##........",
            "..##........",
            ".##.........",
            ".##.........",
            "............"
        ]
    },
    {
        digit: 7,
        grid: [
            "########....",
            ".....##.....",
            "....##......",
            "...##.......",
            "..#####.....",
            "...##.......",
            "..##........",
            "..##........",
            ".##.........",
            ".##.........",
            "............",
            "............"
        ]
    },
    // 8
    {
        digit: 8,
        grid: [
            "....####....",
            "..##....##..",
            ".##......##.",
            "..##....##..",
            "....####....",
            "..##....##..",
            ".##......##.",
            "##........##",
            "##........##",
            ".##......##.",
            "..##....##..",
            "....####...."
        ]
    },
    {
        digit: 8,
        grid: [
            "....###.....",
            "..##...##...",
            ".##.....##..",
            "..##...##...",
            "....###.....",
            "..##...##...",
            ".##.....##..",
            ".##.....##..",
            "..##...##...",
            "....###.....",
            "............",
            "............"
        ]
    },
    // 9
    {
        digit: 9,
        grid: [
            "....####....",
            "..##....##..",
            ".##......##.",
            "##........##",
            "##........##",
            ".##......##.",
            "..##....##..",
            "....######..",
            "........##..",
            ".......##...",
            "....####....",
            "............"
        ]
    },
    {
        digit: 9,
        grid: [
            "....####....",
            "..##....##..",
            "##........##",
            "##........##",
            "..##....##..",
            "....######..",
            "........##..",
            "........##..",
            ".......##...",
            "......##....",
            "....###.....",
            "............"
        ]
    }
];

class MNISTPretrainedMLP {
    constructor(weights) {
        // Support new multi-layer format { architecture, layers: [{w, b}] }
        // as well as old legacy format { w1, b1, w2, b2 }
        if (weights.layers) {
            this.layers = weights.layers; // [{w:(out,in), b:(out,)}]
            this.architecture = weights.architecture || 'relu';
        } else {
            // Legacy sigmoid 2-layer format
            this.layers = [
                { w: weights.w1, b: weights.b1 },
                { w: weights.w2, b: weights.b2 },
            ];
            this.architecture = 'sigmoid';
        }
    }

    relu(x) { return x > 0 ? x : 0; }
    sigmoid(x) { return 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, x)))); }

    // Softmax over raw logits for a stable, calibrated output
    softmax(arr) {
        const maxVal = Math.max(...arr);
        const exps = arr.map(v => Math.exp(Math.min(v - maxVal, 80)));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(v => v / sum);
    }

    forward(inputs) {
        let current = inputs;
        const isRelu = this.architecture === 'relu';

        for (let li = 0; li < this.layers.length; li++) {
            const { w, b } = this.layers[li];
            const isLastLayer = li === this.layers.length - 1;
            const next = Array(w.length).fill(0);

            for (let j = 0; j < w.length; j++) {
                let sum = b[j];
                for (let i = 0; i < w[j].length; i++) {
                    sum += current[i] * w[j][i];
                }
                if (isLastLayer) {
                    // Raw logit — will apply softmax after
                    next[j] = sum;
                } else {
                    next[j] = isRelu ? this.relu(sum) : this.sigmoid(sum);
                }
            }
            current = next;
        }

        // Apply softmax on final logits for proper probability distribution
        const out = this.softmax(current);
        return { out };
    }
}

const pretrainedMNISTModel = new MNISTPretrainedMLP(mnistWeights);

// Genetic Algorithm DNA class storing vector forces
class GeneticDNA {
    constructor(lifetime = 200, genes = null) {
        this.lifetime = lifetime;
        if (genes) {
            this.genes = genes;
        } else {
            this.genes = [];
            for (let i = 0; i < this.lifetime; i++) {
                const angle = Math.random() * Math.PI * 2;
                // Generate unit vectors representing push forces
                this.genes.push({
                    x: Math.cos(angle) * 0.4,
                    y: Math.sin(angle) * 0.4
                });
            }
        }
    }
    
    // Crossover combination with another parent
    crossover(partner) {
        const childGenes = [];
        const midpoint = Math.floor(Math.random() * this.lifetime);
        for (let i = 0; i < this.lifetime; i++) {
            if (i < midpoint) {
                childGenes.push(this.genes[i]);
            } else {
                childGenes.push(partner.genes[i]);
            }
        }
        return new GeneticDNA(this.lifetime, childGenes);
    }
    
    // Random mutation on genes
    mutate(rate) {
        for (let i = 0; i < this.lifetime; i++) {
            if (Math.random() < rate) {
                const angle = Math.random() * Math.PI * 2;
                this.genes[i] = {
                    x: Math.cos(angle) * 0.4,
                    y: Math.sin(angle) * 0.4
                };
            }
        }
    }
}

// Genetic Agent representation (Rocket/Particle evader)
class GeneticAgent {
    constructor(startX, startY, lifetime = 200, dna = null) {
        this.pos = { x: startX, y: startY };
        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        
        this.startX = startX;
        this.startY = startY;
        this.dna = dna || new GeneticDNA(lifetime);
        this.dead = false;
        this.completed = false;
        this.completeTime = 0;
        this.trail = []; // position history
        this.fitness = 0;
    }
    
    applyForce(force) {
        this.acc.x += force.x;
        this.acc.y += force.y;
    }
    
    update(frameIndex, obstacles, target, canvasW, canvasH, targetRadius = 14) {
        if (this.dead || this.completed) return;
        
        // Apply gene force
        if (frameIndex < this.dna.lifetime) {
            this.applyForce(this.dna.genes[frameIndex]);
        }
        
        // Physics update
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        
        // Limit velocity to prevent extreme speedups
        const speedLimit = 4.0;
        const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        if (speed > speedLimit) {
            this.vel.x = (this.vel.x / speed) * speedLimit;
            this.vel.y = (this.vel.y / speed) * speedLimit;
        }
        
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        
        // Reset acceleration
        this.acc.x = 0;
        this.acc.y = 0;
        
        // Add current coordinate to trail
        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > 8) {
            this.trail.shift();
        }
        
        // Boundary collision check
        if (this.pos.x < 0 || this.pos.x > canvasW || this.pos.y < 0 || this.pos.y > canvasH) {
            this.dead = true;
            return;
        }
        
        // Obstacles collision check
        for (const wall of obstacles) {
            if (this.pos.x >= wall.x && this.pos.x <= wall.x + wall.w &&
                this.pos.y >= wall.y && this.pos.y <= wall.y + wall.h) {
                this.dead = true;
                return;
            }
        }
        
        // Target checkpoint check
        const dx = this.pos.x - target.x;
        const dy = this.pos.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < targetRadius) {
            this.completed = true;
            this.completeTime = frameIndex;
        }
    }
    
    calcFitness(target) {
        const dx = this.pos.x - target.x;
        const dy = this.pos.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Inverse distance fitness
        let fit = 1.0 / (dist + 1.0);
        
        // Successful agents get huge bonus, scaled by speed
        if (this.completed) {
            fit *= (10.0 + (this.dna.lifetime - this.completeTime) * 3.0);
        }
        
        // Dead crashed agents get huge penalty
        if (this.dead) {
            fit /= 10.0;
        }
        
        // Squaring fitness strongly amplifies selective pressure for successful agents
        this.fitness = fit * fit;
        return this.fitness;
    }
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
    const [debugText, setDebugText] = useState("");
    const sketchCanvasRef = useRef(null);
    const contextRef = useRef(null);
    const processDrawingRef = useRef(null);

    // Genetic Sandbox States & Refs
    const [geneticPopSize, setGeneticPopSize] = useState(45);
    const [geneticMutationRate, setGeneticMutationRate] = useState(0.02); // 2%
    const [geneticSpeed, setGeneticSpeed] = useState(1); // speed multiplier
    const [geneticIsRunning, setGeneticIsRunning] = useState(true);
    const [geneticGen, setGeneticGen] = useState(1);
    const [geneticBestFit, setGeneticBestFit] = useState(0);
    const [geneticSuccessRate, setGeneticSuccessRate] = useState(0);
    const [geneticAvgDist, setGeneticAvgDist] = useState(0);
    const [geneticPreset, setGeneticPreset] = useState('central'); // 'central', 'slits', 'maze', 'clear'

    const geneticCanvasRef = useRef(null);
    const geneticLoopRef = useRef(null);
    const geneticPopRef = useRef([]);
    const geneticObstaclesRef = useRef([]);
    const geneticFrameIndexRef = useRef(0);
    const geneticGenRef = useRef(1);
    const geneticIsDrawingObstacleRef = useRef(false);
    const geneticObstacleStartRef = useRef({ x: 0, y: 0 });
    const geneticObstacleCurrentRef = useRef({ x: 0, y: 0 });
    
    // Draw / Erase Mode & Champion Trail Refs for upgrades
    const [geneticDrawMode, setGeneticDrawMode] = useState('draw'); // 'draw' or 'erase'
    const geneticBestTrailRef = useRef([]); // history array of coordinates from the previous generation's champion

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

    // Initialize Sandbox Dataset
    useEffect(() => {
        datasetRef.current = generateDataset(datasetType);

        // Re-init network structure: inputs:2, hidden, output:1
        const netStructure = [2, ...hiddenLayers, 1];
        sandboxNNRef.current = new SandboxNN(netStructure, activation);

        const resetTimer = window.setTimeout(() => {
            setLossHistory([]);
            setEpochCount(0);
            setTrainingLoss(0);
            drawDecisionBoundary();
        }, 0);

        return () => window.clearTimeout(resetTimer);
    }, [datasetType, hiddenLayers, activation]);

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
    const initSketchpad = () => {
        const canvas = sketchCanvasRef.current;
        if (!canvas) return;
        // 420x420 = exact 15× of 28x28 — clean integer downscale, no rounding artifacts
        canvas.width = 420;
        canvas.height = 420;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // 33px brush on 420px canvas ≈ 2.2 cells in 28×28 → matches MNIST stroke width
            ctx.lineWidth = 33;
            ctx.strokeStyle = '#ffffff';
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
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 22;
        ctx.strokeStyle = '#ffffff';
        
        setPredictions(Array(10).fill(0));
        setActiveNodes([]);
        setDebugText("");
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
            ctx.lineJoin = 'round';
            ctx.lineWidth = 22;
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
            ctx.lineJoin = 'round';
            ctx.lineWidth = 22;
            ctx.strokeStyle = '#ffffff';
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        // Dynamic handwriting recognition
        processDrawingRef.current?.();
    };

    const endDraw = () => {
        isDrawingRef.current = false;
        setIsDrawing(false);
    };

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

        const handleTouchEnd = () => {
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

    function processDrawing() {
        try {
            const canvas = sketchCanvasRef.current;
            if (!canvas) return;
            
            const W = canvas.width;  // 420
            const H = canvas.height; // 420
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, W, H);
            const raw = imgData.data; // RGBA flat array

            const gray = new Float32Array(W * H);
            for (let i = 0; i < W * H; i++) {
                const rVal = raw[i * 4];
                gray[i] = Math.max(0, (rVal - 9) / 246.0);
            }

            const kernel = [
                0.0030, 0.0133, 0.0219, 0.0133, 0.0030,
                0.0133, 0.0596, 0.0983, 0.0596, 0.0133,
                0.0219, 0.0983, 0.1621, 0.0983, 0.0219,
                0.0133, 0.0596, 0.0983, 0.0596, 0.0133,
                0.0030, 0.0133, 0.0219, 0.0133, 0.0030,
            ];
            const blurred = new Float32Array(W * H);
            for (let ry = 0; ry < H; ry++) {
                for (let rx = 0; rx < W; rx++) {
                    let v = 0;
                    for (let ky = -2; ky <= 2; ky++) {
                        for (let kx = -2; kx <= 2; kx++) {
                            const sy = Math.min(H - 1, Math.max(0, ry + ky));
                            const sx = Math.min(W - 1, Math.max(0, rx + kx));
                            v += gray[sy * W + sx] * kernel[(ky + 2) * 5 + (kx + 2)];
                        }
                    }
                    blurred[ry * W + rx] = v;
                }
            }

            const cellSize = W / 28; // = 15
            const grid28x28 = Array(28).fill(0).map(() => Array(28).fill(0));
            for (let r = 0; r < 28; r++) {
                for (let c = 0; c < 28; c++) {
                    let sum = 0;
                    const startY = r * cellSize;
                    const startX = c * cellSize;
                    for (let py = startY; py < startY + cellSize; py++) {
                        for (let px = startX; px < startX + cellSize; px++) {
                            sum += blurred[py * W + px];
                        }
                    }
                    grid28x28[r][c] = sum / (cellSize * cellSize);
                }
            }

            const norm28x28 = normalizeMatrix28x28(grid28x28);

            const inputs = norm28x28.flat();
            
            let maxVal = 0;
            for (let i = 0; i < inputs.length; i++) {
                if (inputs[i] > maxVal) maxVal = inputs[i];
            }
            if (maxVal > 0) {
                for (let i = 0; i < inputs.length; i++) {
                    inputs[i] /= maxVal;
                }
            }

            const totalMass = inputs.reduce((s, v) => s + v, 0);
            if (totalMass < 0.5) {
                setDebugText("MASS < 0.5 | W:" + W + " H:" + H);
                setPredictions(Array(10).fill(0));
                setActiveNodes([]);
                return;
            }

            const { out } = pretrainedMNISTModel.forward(inputs);
            
            setDebugText("MASS: " + totalMass.toFixed(2) + " | OUT[0]: " + out[0].toFixed(2));
            setPredictions(out);

            const winningIndex = out.indexOf(Math.max(...out));
            if (Math.max(...out) > 0.15) {
                setActiveNodes([winningIndex]);
            } else {
                setActiveNodes([]);
            }
        } catch (err) {
            setDebugText("ERROR: " + err.message);
            setPredictions(Array(10).fill(0));
        }
    }

    useEffect(() => {
        processDrawingRef.current = processDrawing;
    });

    // INITIALIZE GENETIC OBSTACLES AND POPULATION
    const initGeneticSimulation = () => {
        const canvas = geneticCanvasRef.current;
        if (!canvas) return;
        
        canvas.width = 480;
        canvas.height = 320;
        
        // Define obstacles based on current preset
        let walls = [];
        if (geneticPreset === 'central') {
            walls = [{ x: 100, y: 150, w: 280, h: 16 }];
        } else if (geneticPreset === 'slits') {
            walls = [
                { x: 0, y: 150, w: 170, h: 16 },
                { x: 310, y: 150, w: 170, h: 16 }
            ];
        } else if (geneticPreset === 'maze') {
            walls = [
                { x: 0, y: 90, w: 340, h: 16 },
                { x: 140, y: 190, w: 340, h: 16 }
            ];
        }
        geneticObstaclesRef.current = walls;
        
        // Initialize population
        const pop = [];
        for (let i = 0; i < geneticPopSize; i++) {
            pop.push(new GeneticAgent(240, 290, 200));
        }
        geneticPopRef.current = pop;
        
        geneticFrameIndexRef.current = 0;
        geneticGenRef.current = 1;
        
        setGeneticGen(1);
        setGeneticBestFit(0);
        setGeneticSuccessRate(0);
        setGeneticAvgDist(0);
    };

    // React Effect to initialize simulation when tab or preset changes
    useEffect(() => {
        if (activeTab === 'genetic') {
            setTimeout(initGeneticSimulation, 100);
        }
        return () => {
            if (geneticLoopRef.current) {
                cancelAnimationFrame(geneticLoopRef.current);
            }
        };
    }, [activeTab, geneticPreset, geneticPopSize]);

    // Genetic Selection & Crossover Engine (Tournament Selection)
    const runEvolution = () => {
        const pop = geneticPopRef.current;
        const target = { x: 240, y: 35 };
        
        // 1. Calculate fitness for all agents and gather stats
        let bestAgent = pop[0];
        let maxFit = 0;
        let completedCount = 0;
        let totalDist = 0;
        
        for (const agent of pop) {
            const fit = agent.calcFitness(target);
            if (fit > maxFit) {
                maxFit = fit;
                bestAgent = agent;
            }
            if (agent.completed) {
                completedCount++;
            }
            
            const dx = agent.pos.x - target.x;
            const dy = agent.pos.y - target.y;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        
        const successRate = completedCount / pop.length;
        const avgDist = totalDist / pop.length;
        
        setGeneticBestFit(maxFit);
        setGeneticSuccessRate(successRate);
        setGeneticAvgDist(avgDist);

        // Save previous generation champion's coordinate trail history
        if (bestAgent) {
            geneticBestTrailRef.current = [...bestAgent.trail];
        }
        
        // 2. Select mating pool and breed new population
        // Tournament Selection: Select best of k random candidates
        const tournamentSelect = (poolSize = 5) => {
            if (!pop || pop.length === 0) return null;
            let best = pop[Math.floor(Math.random() * pop.length)];
            for (let i = 1; i < poolSize; i++) {
                const contender = pop[Math.floor(Math.random() * pop.length)];
                if (!contender) continue;
                // .fitness is set by calcFitness(); fall back to 0 for un-evaluated agents
                const cFit = contender.fitness ?? 0;
                const bFit = best.fitness ?? 0;
                if (cFit > bFit) best = contender;
            }
            return best;
        };
        
        const nextPop = [];
        
        // Elitism: carry over the Champion DNA unchanged to guarantee fitness never decreases
        if (bestAgent) {
            const eliteChild = new GeneticAgent(240, 290, 200, bestAgent.dna);
            nextPop.push(eliteChild);
        }
        
        const startIdx = bestAgent ? 1 : 0;
        for (let i = startIdx; i < geneticPopSize; i++) {
            const parentA = tournamentSelect();
            const parentB = tournamentSelect();
            
            // Guard against empty pool edge case
            if (!parentA || !parentB) continue;

            // Crossover
            const childDNA = parentA.dna.crossover(parentB.dna);
            
            // Mutation
            childDNA.mutate(geneticMutationRate);
            
            // Instantiate child
            nextPop.push(new GeneticAgent(240, 290, 200, childDNA));
        }
        
        geneticPopRef.current = nextPop;
        geneticFrameIndexRef.current = 0;
        
        const nextGen = geneticGenRef.current + 1;
        geneticGenRef.current = nextGen;
        setGeneticGen(nextGen);
    };

    // Simulation Frame Tick & Render Loop
    const runGeneticFrame = () => {
        const canvas = geneticCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const W = canvas.width;
        const H = canvas.height;
        const target = { x: 240, y: 35 };
        const targetRadius = 14;
        const start = { x: 240, y: 290 };
        
        // Handle simulation physics updates (sub-steps based on geneticSpeed)
        if (geneticIsRunning) {
            const steps = geneticSpeed;
            for (let s = 0; s < steps; s++) {
                const frameIndex = geneticFrameIndexRef.current;
                const pop = geneticPopRef.current;
                const obstacles = geneticObstaclesRef.current;
                
                // Update agents physics
                let allFinished = true;
                for (const agent of pop) {
                    agent.update(frameIndex, obstacles, target, W, H, targetRadius);
                    if (!agent.dead && !agent.completed) {
                        allFinished = false;
                    }
                }
                
                // Increment frame index
                geneticFrameIndexRef.current = frameIndex + 1;
                
                // If generation finishes (either time is up or all crashed/succeeded)
                if (geneticFrameIndexRef.current >= 200 || allFinished) {
                    runEvolution();
                    break;
                }
            }
        }
        
        // RENDER DRAWINGS ON CANVAS
        // Fills deep dark slate background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, W, H);
        
        // Draw Grid Lines (glowing cybernet design)
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        
        // Draw Start Base (glowing pulsing capsule)
        const pulseFrame = geneticFrameIndexRef.current;
        const pulseStart = 8 + Math.sin(pulseFrame / 9) * 2;
        ctx.beginPath();
        ctx.arc(start.x, start.y, pulseStart, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        
        // Draw Target Portal (pulsing neon portal ring)
        const pulse = 16 + Math.sin(pulseFrame / 7) * 3;
        const grad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, pulse);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(target.x, target.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Target Portal Pulse Waves (Expanding concentric glowing rings)
        const pulseTime = (pulseFrame / 60) % 1.5;
        for (let r = 0; r < 2; r++) {
            const progress = ((pulseTime + r * 0.75) % 1.5) / 1.5;
            const size = targetRadius + progress * 20;
            ctx.strokeStyle = `rgba(16, 185, 129, ${1.0 - progress})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(target.x, target.y, size, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw Obstacles (translucent neon borders with glow)
        const walls = geneticObstaclesRef.current;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2;
        for (const w of walls) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeRect(w.x, w.y, w.w, w.h);
        }
        
        // Draw active drag obstacle if drawing
        if (geneticIsDrawingObstacleRef.current) {
            const x0 = geneticObstacleStartRef.current.x;
            const y0 = geneticObstacleStartRef.current.y;
            const x1 = geneticObstacleCurrentRef.current.x;
            const y1 = geneticObstacleCurrentRef.current.y;
            const rect = {
                x: Math.min(x0, x1),
                y: Math.min(y0, y1),
                w: Math.abs(x1 - x0),
                h: Math.abs(y1 - y0)
            };
            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
            ctx.lineWidth = 2.5;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }

        // Draw Champion's Trail (glowing, semi-translucent purple dashed line)
        const bestTrail = geneticBestTrailRef.current;
        if (bestTrail && bestTrail.length > 1) {
            ctx.save();
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)'; // Semitranslucent neon purple
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]); // Dashed line
            ctx.beginPath();
            ctx.moveTo(bestTrail[0].x, bestTrail[0].y);
            for (let i = 1; i < bestTrail.length; i++) {
                ctx.lineTo(bestTrail[i].x, bestTrail[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw Population Agents
        const pop = geneticPopRef.current;
        for (const agent of pop) {
            if (agent.completed) {
                // Glow green dot at target
                ctx.beginPath();
                ctx.arc(agent.pos.x, agent.pos.y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
                ctx.fill();
                continue;
            }
            if (agent.dead) {
                // Red crashed coordinates
                ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
                ctx.fillRect(agent.pos.x - 1, agent.pos.y - 1, 2, 2);
                continue;
            }
            
            // Draw Trail (neon streak)
            if (agent.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(agent.trail[0].x, agent.trail[0].y);
                for (let i = 1; i < agent.trail.length; i++) {
                    ctx.lineTo(agent.trail[i].x, agent.trail[i].y);
                }
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            
            // Draw active DNA force vector (pinkish-magenta vector line)
            const frameIndex = geneticFrameIndexRef.current;
            if (frameIndex < agent.dna.lifetime && agent.dna.genes[frameIndex]) {
                const force = agent.dna.genes[frameIndex];
                ctx.save();
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)'; // magenta force vector
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(agent.pos.x, agent.pos.y);
                ctx.lineTo(agent.pos.x + force.x * 20, agent.pos.y + force.y * 20);
                ctx.stroke();
                ctx.restore();
            }

            // Draw triangular vehicle pointing in direction of velocity
            const angle = Math.atan2(agent.vel.y, agent.vel.x);
            const size = 5;
            
            ctx.save();
            ctx.translate(agent.pos.x, agent.pos.y);
            ctx.rotate(angle);
            
            ctx.beginPath();
            ctx.moveTo(size * 1.5, 0);
            ctx.lineTo(-size, -size * 0.7);
            ctx.lineTo(-size, size * 0.7);
            ctx.closePath();
            
            ctx.fillStyle = '#06b6d4';
            ctx.fill();
            
            ctx.restore();
        }
        
        // Trigger next frame
        geneticLoopRef.current = requestAnimationFrame(runGeneticFrame);
    };

    // Effect to run simulation animation loop
    useEffect(() => {
        if (activeTab === 'genetic') {
            geneticLoopRef.current = requestAnimationFrame(runGeneticFrame);
        }
        return () => {
            if (geneticLoopRef.current) {
                cancelAnimationFrame(geneticLoopRef.current);
            }
        };
    }, [activeTab, geneticIsRunning, geneticSpeed, geneticMutationRate, geneticPopSize]);

    // Handle mouse event listeners for custom wall drawing
    const handleGeneticMouseDown = (e) => {
        const canvas = geneticCanvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (geneticDrawMode === 'erase') {
            const filtered = geneticObstaclesRef.current.filter(wall => {
                return !(x >= wall.x && x <= wall.x + wall.w &&
                         y >= wall.y && y <= wall.y + wall.h);
            });
            geneticObstaclesRef.current = filtered;
            return;
        }

        geneticIsDrawingObstacleRef.current = true;
        geneticObstacleStartRef.current = { x, y };
        geneticObstacleCurrentRef.current = { x, y };
    };

    const handleGeneticMouseMove = (e) => {
        if (!geneticIsDrawingObstacleRef.current) return;
        const canvas = geneticCanvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        geneticObstacleCurrentRef.current = { x, y };
    };

    const handleGeneticMouseUp = (e) => {
        if (!geneticIsDrawingObstacleRef.current) return;
        geneticIsDrawingObstacleRef.current = false;
        
        const x0 = geneticObstacleStartRef.current.x;
        const y0 = geneticObstacleStartRef.current.y;
        const x1 = geneticObstacleCurrentRef.current.x;
        const y1 = geneticObstacleCurrentRef.current.y;
        
        const w = Math.abs(x1 - x0);
        const h = Math.abs(y1 - y0);
        
        // Ignore tiny accidental clicks (less than 4px size)
        if (w < 4 || h < 4) return;
        
        const newWall = {
            x: Math.min(x0, x1),
            y: Math.min(y0, y1),
            w,
            h
        };
        
        // Append custom barrier obstacle!
        geneticObstaclesRef.current = [...geneticObstaclesRef.current, newWall];
    };


    return (
        <section id="ai-lab" className="section-dark" aria-labelledby="ai-heading">
            <SectionBackground variant="ai-lab" />
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
                        <button
                            onClick={() => { setActiveTab('genetic'); setIsTraining(false); }}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                                activeTab === 'genetic'
                                    ? 'bg-accent text-black font-bold shadow-lg'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            <i className="fa-solid fa-dna mr-1.5" />
                            {t('aiLab.tabGenetic')}
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'sandbox' && (
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
                                                            
                                                            const weightVal = Math.sin((c + 1) * 17 + (i + 1) * 11 + (j + 1) * 7 + epochCount * 0.03);
                                                            
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
                    )}
                    {activeTab === 'sketch' && (
                        <motion.div
                            key="sketch"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center max-w-5xl mx-auto"
                        >
                            {/* Sketch drawable frame */}
                            <div className="lg:col-span-6 flex flex-col items-center card-bg border rounded-2xl p-5 w-full">
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
                                        className="cursor-crosshair bg-slate-950 block w-full aspect-square max-w-[420px] mx-auto"
                                    />
                                    {predictions.reduce((s, v) => s + v, 0) === 0 && (
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-500/80 uppercase font-bold tracking-widest">
                                            {t('aiLab.placeholderDraw')}
                                        </div>
                                    )}
                                    {debugText && (
                                        <div className="absolute top-2 left-2 pointer-events-none bg-black/80 text-red-500 font-mono text-[10px] p-1 rounded z-50">
                                            {debugText}
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
                            <div className="lg:col-span-6 card-bg border rounded-2xl p-5 h-full space-y-5 flex flex-col justify-center">
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
                    {activeTab === 'genetic' && (
                        <motion.div
                            key="genetic"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center"
                        >
                            {/* Controls Panel */}
                            <div className="lg:col-span-4 card-bg border rounded-2xl p-5 space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-primary mb-1">{t('aiLab.geneticTitle')}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t('aiLab.geneticDesc')}</p>
                                </div>

                                {/* Population Size Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-wider">
                                        <span>{t('aiLab.geneticPopSize')}</span>
                                        <span className="text-accent">{geneticPopSize}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="20"
                                        max="80"
                                        step="5"
                                        value={geneticPopSize}
                                        onChange={(e) => setGeneticPopSize(parseInt(e.target.value))}
                                        className="w-full accent-accent h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Mutation Rate Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-wider">
                                        <span>{t('aiLab.geneticMutation')}</span>
                                        <span className="text-accent">{(geneticMutationRate * 100).toFixed(1)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.001"
                                        max="0.10"
                                        step="0.001"
                                        value={geneticMutationRate}
                                        onChange={(e) => setGeneticMutationRate(parseFloat(e.target.value))}
                                        className="w-full accent-accent h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Simulation Speed */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">{t('aiLab.geneticSpeed')}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 4].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setGeneticSpeed(s)}
                                                className={`py-2 rounded-lg text-xs font-bold border transition ${
                                                    geneticSpeed === s
                                                        ? 'bg-accent border-accent text-black'
                                                        : 'border-slate-800 text-secondary hover:border-slate-700'
                                                }`}
                                            >
                                                {s}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Obstacles Preset */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Obstacle Presets</label>
                                    <select
                                        value={geneticPreset}
                                        onChange={(e) => setGeneticPreset(e.target.value)}
                                        className="w-full rounded-lg input-bg border px-3.5 py-2.5 text-sm font-medium focus:border-accent outline-none"
                                    >
                                        <option value="central">{t('aiLab.geneticPresetCentral')}</option>
                                        <option value="slits">{t('aiLab.geneticPresetSlits')}</option>
                                        <option value="maze">{t('aiLab.geneticPresetMaze')}</option>
                                        <option value="clear">{t('aiLab.geneticPresetClear')}</option>
                                    </select>
                                </div>

                                {/* Editor Tool Draw/Erase Toggle */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Canvas Tool</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setGeneticDrawMode('draw')}
                                            className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                                                geneticDrawMode === 'draw'
                                                    ? 'bg-accent border-accent text-black'
                                                    : 'border-slate-800 text-secondary hover:border-slate-700'
                                            }`}
                                        >
                                            <i className="fa-solid fa-pen text-[10px]" />
                                            {t('aiLab.geneticDrawMode') || 'Draw Walls'}
                                        </button>
                                        <button
                                            onClick={() => setGeneticDrawMode('erase')}
                                            className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                                                geneticDrawMode === 'erase'
                                                    ? 'bg-accent border-accent text-black'
                                                    : 'border-slate-800 text-secondary hover:border-slate-700'
                                            }`}
                                        >
                                            <i className="fa-solid fa-eraser text-[10px]" />
                                            {t('aiLab.geneticEraseMode') || 'Wall Eraser'}
                                        </button>
                                    </div>
                                </div>

                                {/* Simulator Action Buttons */}
                                <div className="space-y-2 pt-2">
                                    <button
                                        onClick={() => setGeneticIsRunning(!geneticIsRunning)}
                                        className={`w-full font-bold text-xs py-3 rounded-full transition shadow-md flex items-center justify-center gap-1.5 ${
                                            geneticIsRunning
                                                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                                : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                        }`}
                                    >
                                        <i className={`fa-solid ${geneticIsRunning ? 'fa-pause' : 'fa-play'}`} />
                                        {geneticIsRunning ? t('aiLab.btnPause') : 'Resume Simulation'}
                                    </button>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={initGeneticSimulation}
                                            className="w-full font-semibold text-xs border border-slate-700 hover:bg-slate-800 py-2.5 rounded-full transition"
                                        >
                                            <i className="fa-solid fa-rotate-left mr-1" />
                                            Reset Sim
                                        </button>
                                        <button
                                            onClick={() => { geneticObstaclesRef.current = []; setGeneticPreset('clear'); }}
                                            className="w-full font-semibold text-xs border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 py-2.5 rounded-full transition"
                                        >
                                            <i className="fa-solid fa-eraser mr-1" />
                                            {t('aiLab.geneticClear')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Canvas & Telemetry Display */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                {/* Visualizer Area */}
                                <div className="card-bg border rounded-2xl p-5 flex flex-col items-center">
                                    <div className="border border-slate-800 rounded-xl overflow-hidden relative shadow-inner w-full max-w-[480px] bg-slate-950">
                                        <canvas
                                            ref={geneticCanvasRef}
                                            onMouseDown={handleGeneticMouseDown}
                                            onMouseMove={handleGeneticMouseMove}
                                            onMouseUp={handleGeneticMouseUp}
                                            className="cursor-crosshair block w-full aspect-[3/2]"
                                        />
                                        
                                        {/* Click and drag drawing guide overlays */}
                                        <div className="absolute top-2.5 left-2.5 pointer-events-none bg-slate-950/80 px-2.5 py-1.5 rounded border border-slate-800/80 text-[10px] font-semibold tracking-wide text-muted uppercase">
                                            {geneticDrawMode === 'draw' ? (
                                                <>
                                                    <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-accent" />
                                                    Drag mouse to draw custom walls
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-eraser mr-1.5 text-rose-400" />
                                                    Click custom walls to erase them
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* GA Telemetry Stats Dashboard */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {/* Stat 1: Gen */}
                                    <div className="card-bg border rounded-xl p-3.5 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('aiLab.geneticGen')}
                                        </span>
                                        <span className="text-xl font-black text-primary tabular-nums block">
                                            {geneticGen}
                                        </span>
                                    </div>
                                    {/* Stat 2: Best Fitness */}
                                    <div className="card-bg border rounded-xl p-3.5 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('aiLab.geneticBest')}
                                        </span>
                                        <span className="text-xl font-black text-accent tabular-nums block">
                                            {geneticBestFit > 0 ? (1 / Math.sqrt(geneticBestFit)).toFixed(1) : '-'}
                                        </span>
                                    </div>
                                    {/* Stat 3: Success Rate */}
                                    <div className="card-bg border rounded-xl p-3.5 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            {t('aiLab.geneticSuccess')}
                                        </span>
                                        <span className="text-xl font-black text-emerald-400 tabular-nums block">
                                            {(geneticSuccessRate * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    {/* Stat 4: Avg Distance */}
                                    <div className="card-bg border rounded-xl p-3.5 text-center">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                                            Avg Distance
                                        </span>
                                        <span className="text-xl font-black text-cyan-400 tabular-nums block">
                                            {geneticAvgDist.toFixed(0)} px
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
