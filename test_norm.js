const fs = require('fs');

function normalizeMatrix28x28(matrix) {
    let minRow = 28, maxRow = 0, minCol = 28, maxCol = 0;
    let hasStroke = false;
    
    // 1. Find Bounding Box
    for (let r = 0; r < 28; r++) {
        for (let c = 0; c < 28; c++) {
            if (matrix[r][c] > 0.05) {
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

// Create a simple vertical line at column 5, rows 5-20 (a "1")
let mat = Array(28).fill(0).map(() => Array(28).fill(0));
for(let i=5; i<=20; i++) {
    mat[i][5] = 1.0;
}

let out = normalizeMatrix28x28(mat);

let s = "";
for(let r=0; r<28; r++) {
    for(let c=0; c<28; c++) {
        s += out[r][c] > 0.1 ? "X" : ".";
    }
    s += "\n";
}
console.log(s);
