import { createCanvas } from './utils.js';

console.log('olá mundo duck hunt');

const canvas = createCanvas(256, 240, document.body);
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext('2d');

// background
ctx.fillStyle = '#4da4ff';
ctx.fillRect(0, 0, 256, 240);
