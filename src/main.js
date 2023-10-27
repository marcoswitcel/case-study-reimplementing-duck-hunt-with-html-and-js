import { createCanvas } from './utils.js';

console.log('olá mundo duck hunt');

const canvas = createCanvas(256, 240, document.body);
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext('2d');

// background
ctx.fillStyle = '#4da4ff';
ctx.fillRect(0, 0, 256, 240);


const image = new Image;

image.src = '/public/assets/NES - Duck Hunt - The Dog.png';

function main(timestamp) {
    if (!timestamp) requestAnimationFrame(main);
    
    let i = ~~((timestamp / (1000 / 6)) % 4);
    console.log(i)
    ctx.drawImage(image, i * 56, 13, 56, 44, 0, 0, 56, 44);

    requestAnimationFrame(main);
}

image.addEventListener('load', () => {
    main();
});
