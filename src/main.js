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
     * @type {1 | 2}
     */
    layer;

    /**
     * 
     * @param {Vector2} position 
     * @param {'dog' | 'duck'} type 
     * @param {Sprite | AnimatedSprite | null} renderable
     * @param {1 | 2} layer
     */
    constructor(
        type,
        position,
        renderable,
        layer = 1,
    ) {
        this.type = type;
        this.position = position;
        this.renderable = renderable;
        this.layer = layer;
    }
}

console.log('olá mundo duck hunt');

const NES = { width: 256, height: 240, };

const canvas = createCanvas(NES.width, NES.height, document.body);
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext('2d');

// layers
const layer01 = createCanvas(NES.width, NES.height);
layer01.style.imageRendering = 'pixelated';
const ctxLayer01 = layer01.getContext('2d');
const layer02 = createCanvas(NES.width, NES.height);
layer02.style.imageRendering = 'pixelated';
const ctxLayer02 = layer02.getContext('2d');

const image = new Image;

// @todo João, ajustar essa urls para não serem fixas
image.src = '/public/assets/NES - Duck Hunt - The Dog - transparent.png';

const background = new Image;

// @todo João, ajustar essa urls para não serem fixas
background.src = '/public/assets/NES - Duck Hunt - Backgrounds - transparent.png';

const dog = new Entity(
    'dog',
    vec2(~~(NES.width * 0.1), ~~(NES.height * 0.6)),
    new AnimatedSprite(56, 44, makeFrameSequence(image, 0, 13, 56, 44, 4, 4), 1)
);

const duckImage = new Image;

// @todo João, ajustar essa urls para não serem fixas
// @todo João, fazer uma versão com fundo transparente no GIMP
duckImage.src = '/public/assets/NES - Duck Hunt - Ducks - transparent.png';

const duck = new Entity(
    'duck',
    vec2(~~(NES.width * 0), ~~(NES.height * 0.15)),
    new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 106, 6, 38, 38, 3, 3), 1),
    2
);

const backgroundSprite = new Sprite(background, 0, 0, NES.width, NES.height);

const backgrounds = [ backgroundSprite ];

/**
 * @typedef {{
 *   target: object,
 *   from: number,
 *   state: 'done' | 'started' | 'not initialized',
 *   to: number,
 *   totalTime: number,
 *   time: number,
 *   next: Interpolation | null
 * }} Interpolation
 */

/**
 * @type {Interpolation[]}
 */
let interpolations = [
    {
        target: (value) => { duck.position.x = ~~(value) },
        from: 0,
        to: 200,
        state: 'not initialized',
        time: 4,
        totalTime: 0,
        next: {
            target: (value) => { duck.position.x = ~~(value) },
            from: 200,
            to: 0,
            state: 'not initialized',
            time: 2,
            totalTime: 0,
            next: null
        }
    }
];

/**
 * @type {Generator<boolean, boolean, number>}
 */
let dogAnimationRunner;

/**
 * 
 * @param {Entity} dog 
 * @param {number} timestamp 
 * @param {{ from: number, to: number}} 
 * @param {boolean} loop
 * @param {boolean} reversed
 * @yields {boolean}
 * @returns {Generator<boolean, boolean, number>}
 */
function *dogAnimation(dog, timestamp, { from, to }, loop = false, reversed = false) {
    const initialTimestamp = timestamp;
    const totalTime = 2;

    // seta o início
    dog.position.x = ~~(from);
    dog.position.y = NES.height * 0.6;

    while (true) {
        const currentTimestamp = yield;
        const diffInSeconds = (currentTimestamp - initialTimestamp) / 1000;

        if (diffInSeconds > totalTime) {
            if (loop) {
                if (reversed) {
                    yield* dogAnimation(dog, currentTimestamp, { from: to, to: from }, loop, reversed);
                } else {
                    yield* dogAnimation(dog, currentTimestamp, { from, to }, loop, reversed);
                }
            } else {
                break;
            }
        }

        const newX = from + (diffInSeconds / totalTime) * (to - from);

        // aplicando 
        dog.position.x = ~~(newX);
    }

    return true;
}

/**
 * @type {Interpolation[]}
 */
const toAdd = [];

/**
 * @type {Entity[]}
 */
const entities = [];

entities.push(dog);
entities.push(duck);

function main(timestamp) {
    if (!timestamp) {
        requestAnimationFrame(main);
        return;
    }

    if (dogAnimationRunner === undefined) {
        dogAnimationRunner = dogAnimation(dog, timestamp, { from: 0, to: 200 }, true, true)
    }

    // blue background
    ctxLayer02.fillStyle = '#4da4ff';
    ctxLayer02.fillRect(0, 0, NES.width, NES.height);

    // limpa layer
    ctxLayer01.clearRect(0, 0, NES.width, NES.height);
    
    // @todo João, implementar um forma organizada e eficiente de gerenciar animações/sprites animados. (ok?)
    // @todo João, implementar um sistema para descrever animações/eventos e modificações em sprites ou entidades, não sei ainda se preciso de entidades para a animação, talvez só sprites funcionem
    let i = ~~((timestamp / (1000 / 6)) % 4);
    let iDuck = ~~((timestamp / (1000 / 6)) % 3);
    



    for (const interpolation of interpolations)
    {
        if (interpolation.state === 'done') continue;
        if (interpolation.state === 'not initialized') {
            interpolation.target(interpolation.from);
            interpolation.state = 'started';
            interpolation.totalTime = timestamp
        }
        const delta = (timestamp - interpolation.totalTime) / 1000;
        const result = interpolation.from + (delta / interpolation.time) * (interpolation.to - interpolation.from);
        // console.log(result)
        interpolation.target(result)

        if (delta > interpolation.time) {
            interpolation.state = 'done';
            if (interpolation.next) {
                toAdd.push(interpolation.next)
            }
        }
    }

    {
        if (dogAnimationRunner) {
            const { value, done } = dogAnimationRunner.next(timestamp)
    
            if (done) {
                dogAnimationRunner = null;
            }
        }
    }

    interpolations = interpolations.filter(interp => interp.state !== 'done');
    interpolations.push(...toAdd);
    toAdd.length = 0;


    for (const current of backgrounds) {
        ctxLayer01.drawImage(current.source, current.offsetX, current.offsetY, current.width, current.height);
    }

    for (const entity of entities) {
        if (!entity.renderable) continue;
        
        const ctx = entity.layer === 1 ? ctxLayer01 : ctxLayer02;

        const index = (entity.type === 'duck') ? iDuck : i;
        /**
         * @type {Sprite}
         */
        const frame = (entity.renderable instanceof AnimatedSprite) ? entity.renderable.frames[index] : entity.renderable;
        
        console.assert(is_integer(entity.position.x))
        ctx.drawImage(frame.source, frame.offsetX, frame.offsetY, frame.width, frame.height, entity.position.x, entity.position.y, frame.width, frame.height);
    }

    // Compoem imagem
    ctx.drawImage(layer02, 0, 0);
    ctx.drawImage(layer01, 0, 0);

    requestAnimationFrame(main);
}

image.addEventListener('load', () => {
    main();
});
