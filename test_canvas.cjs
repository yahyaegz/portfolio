const fs = require('fs');
const { createCanvas } = require('canvas');

const canvas = createCanvas(600, 450);
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

function drawFractalTree(ctx, x, y, angle, length, depth, maxDepth, branchAngle, lengthRatio, windPhase, windStrength) {
    if (depth === 0 || length < 1.5) return;
    const windOff = Math.sin(windPhase + depth * 0.8) * windStrength * (1 - depth / maxDepth) * 0.4;
    const x2 = x + Math.cos(angle + windOff) * length;
    const y2 = y + Math.sin(angle + windOff) * length;
    const ratio = depth / maxDepth;
    const r = Math.round(20 + ratio * 130);
    const g = Math.round(30 + ratio * 160);
    const b = Math.round(50 + ratio * 100);
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.25 + ratio * 0.75})`;
    ctx.lineWidth = Math.max(0.4, depth * 0.55);
    ctx.shadowBlur = depth < 3 ? 0 : 6;
    ctx.shadowColor = '#10b981';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawFractalTree(ctx, x2, y2, angle - branchAngle, length * lengthRatio, depth - 1, maxDepth, branchAngle, lengthRatio, windPhase, windStrength);
    drawFractalTree(ctx, x2, y2, angle + branchAngle, length * lengthRatio, depth - 1, maxDepth, branchAngle, lengthRatio, windPhase, windStrength);
}

ctx.fillStyle = '#06080f';
ctx.fillRect(0, 0, W, H);
ctx.save();
let depth = 8;
let angle = 25 * Math.PI / 180;
let ratio = 0.68;
let windPhase = 0;
let windStrength = 0.3;
drawFractalTree(ctx, W / 2, H - 20, -Math.PI / 2, 80, depth, depth, angle, ratio, windPhase, windStrength);
ctx.restore();

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test_canvas.png', buffer);
console.log('Done, wrote test_canvas.png');
