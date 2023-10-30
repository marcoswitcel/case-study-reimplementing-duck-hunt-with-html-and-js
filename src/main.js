import { AnimatedSprite, Sprite, makeFrameSequence } from './sprites.js';
import { createCanvas } from './utils.js';

/**
 * @typedef {{ x: number, y: number }} Vector2
 */

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * 
 * @returns {Vector2}
 */
const vec2 = (x, y) => ({ x, y });

/**
 * @note Não funciona com número muitos grandes 2e22 por exemplo
 * 
 * @param {number} n 
 * @returns {boolean}
 */
const is_integer = (n) => n === ~~n;

class Entity {
    
    /**
     * @type {Vector2}
     */
    position;

    /**
     * @type {'dog' | 'duck'}
     */
    type;

    /**
     * @type {Sprite | AnimatedSprite | null}
     */
    renderable;

    /**
     * 
     * @param {Vector2} position 
     * @param {'dog' | 'duck'} type 
     * @param {Sprite | AnimatedSprite | null} renderable
     */
    constructor(
        type,
        position,
        renderable,
    ) {
        this.type = type;
        this.position = position;
        this.renderable = renderable;
    }
}

console.log('olá mundo duck hunt');

const NES = { width: 256, height: 240, };

const canvas = createCanvas(NES.width, NES.height, document.body);
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext('2d');


const image = new Image;

// @todo João, ajustar essa urls para não serem fixas
image.src = '/public/assets/NES - Duck Hunt - The Dog - transparent.png';

const background = new Image;

// @todo João, ajustar essa urls para não serem fixas
background.src = '/public/assets/NES - Duck Hunt - Backgrounds - transparent.png';

const dog = new Entity(
    'dog',
    vec2(NES.width * 0.5, NES.height * 0.5),
    new AnimatedSprite(56, 44, makeFrameSequence(image, 0, 13, 56, 44, 4, 4), 1)
);

const duckImage = new Image;

// @todo João, ajustar essa urls para não serem fixas
duckImage.src = '/public/assets/NES - Duck Hunt - Ducks.png';

const duck = new Entity(
    'duck',
    vec2(NES.width * 0.5, NES.height * 0.5),
    new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 106, 6, 38, 38, 3, 3), 1)
);

const backgroundSprite = new Sprite(background, 0, 0, NES.width, NES.height);

const backgrounds = [ backgroundSprite ];

/**
 * @type {Entity[]}
 */
const entities = [];

entities.push(dog);
entities.push(duck);

function main(timestamp) {
    if (!timestamp) requestAnimationFrame(main);

    // background
    ctx.fillStyle = '#4da4ff';
    ctx.fillRect(0, 0, NES.width, NES.height);
    
    // @todo João, implementar um forma organizada e eficiente de gerenciar animações/sprites animados. (ok?)
    // @todo João, implementar um sistema para descrever animações/eventos e modificações em sprites ou entidades, não sei ainda se preciso de entidades para a animação, talvez só sprites funcionem
    let i = ~~((timestamp / (1000 / 6)) % 4);
    let iDuck = ~~((timestamp / (1000 / 6)) % 3);
    let offsetX = ~~((timestamp / (100)) % 80);
    let offsetY = NES.height * 0.6;

    for (const current of backgrounds) {
        ctx.drawImage(current.source, current.offsetX, current.offsetY, current.width, current.height);
    }

    for (const entity of entities) {
        if (!entity.renderable) continue;

        const index = (entity.type === 'duck') ? iDuck : i;
        /**
         * @type {Sprite}
         */
        const frame = (entity.renderable instanceof AnimatedSprite) ? entity.renderable.frames[index] : entity.renderable;
        
        console.assert(is_integer(frame.offsetX))
        ctx.drawImage(frame.source, frame.offsetX, frame.offsetY, frame.width, frame.height, offsetX, offsetY, frame.width, frame.height);
    }

    requestAnimationFrame(main);
}

image.addEventListener('load', () => {
    main();
});
