import { createCanvas } from './utils.js';

console.log('olá mundo duck hunt');

const NES = { width: 256, height: 240, };

const canvas = createCanvas(NES.width, NES.height, document.body);
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext('2d');





const image = new Image;

// @todo João, ajustar essa urls para não serem fixas
image.src = '/public/assets/NES - Duck Hunt - The Dog - transparent.png';

function main(timestamp) {
    if (!timestamp) requestAnimationFrame(main);

    // background
    ctx.fillStyle = '#4da4ff';
    ctx.fillRect(0, 0, NES.width, NES.height);
    
    // @todo João, implementar um forma organizada e eficiente de gerenciar animações/sprites animados.
    // @todo João, implementar um sistema para descrever animações/eventos e modificações em sprites ou entidades, não sei ainda se preciso de entidades para a animação, talvez só sprites funcionem
    let i = ~~((timestamp / (1000 / 6)) % 4);
    let offsetX = ~~((timestamp / (100)) % 80);
    let offsetY = NES.height * 0.6;
    console.log(i)
    ctx.drawImage(image, i * 56, 13, 56, 44, offsetX, offsetY, 56, 44);

    requestAnimationFrame(main);
}

image.addEventListener('load', () => {
    main();
});
