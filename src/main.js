import { createCanvas } from './utils.js';

console.log('olá mundo duck hunt');

const NES = { width: 256, height: 240, };

const canvas = createCanvas(NES.width, NES.height, document.body);
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext('2d');


class RenderInfo {
    /**
     * @type {CanvasImageSource}
     */
    image;

    source_x; source_y;
    source_W; source_H;

    targe_x; targe_y;
    targe_W; targe_H;

    constructor(...args) {
        console.assert([3, 5, 9].indexOf(args.length) !== -1);
        this.image = args[0];
        this.source_x = args[1];
        this.source_y = args[2];
        this.source_W = args[3];
        this.source_H = args[4];
        this.targe_x = args[5];
        this.targe_y = args[6];
        this.targe_W = args[7];
        this.targe_H = args[8];
    }

    get args() {
        return [
            this.image,
            this.source_x, this.source_y,
            this.source_W, this.source_H,
            this.targe_x, this.targe_y,
            this.targe_W, this.targe_H,
        ]
    }
}

class AnimatedSprite {

    constructor(image, sequenceOfFramesInfo, time) {
        this.image = image;
        this.sequenceOfFramesInfo = sequenceOfFramesInfo;
        this.time = time;
    }

    renderInfo() {
        // @todo João, faze funcionar de verdade, usar o tempo
        const frame = this.sequenceOfFramesInfo[0];

        return new RenderInfo(this.image, ...frame)
    }
}


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

    // @todo João, remover assim que terminar de testar
    teste: {
        const animatedSprite = new AnimatedSprite(image, [[
            0 * 56, 13, 56, 44, offsetX, offsetY - 100, 56, 44
        ]], 0);
        ctx.drawImage(...(animatedSprite.renderInfo().args));
    }

    requestAnimationFrame(main);
}

image.addEventListener('load', () => {
    main();
});
