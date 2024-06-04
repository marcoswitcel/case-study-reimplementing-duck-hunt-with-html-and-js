import { AnimatedSprite, Sprite, makeFrameSequence } from './sprites.js';
import { createCanvas } from './utils.js';
import { Logger, LoggerManager } from './logger.js'

LoggerManager.initFromQueryString('loggerFilter');

const mainLogger = new Logger('main');
const inputLogger = new Logger('input');
const behaviorLogger = new Logger('behavior');


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
const isInteger = (n) => n === ~~n;

const EntityExtensions = {
    hitted: Symbol.for('Entity.hitted'),
    hitRadius: Symbol.for('Entity.hitRadius'),
}
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
     * @type {boolean}
     */
    visible;

    /**
     * Campo que sinaliza se a entidade foi removida da simulação, ao final do frame ela deve
     * ser removida da lista de entidades, porém ao longo do frame alguma rotina ainda pode interagir
     * com ela caso necessário.
     * @type {boolean}
     */
    removed;

    /**
     * 
     * @param {Vector2} position 
     * @param {'dog' | 'duck'} type 
     * @param {Sprite | AnimatedSprite | null} renderable
     * @param {1 | 2} layer
     * @param {boolean} visible
     */
    constructor(
        type,
        position,
        renderable,
        layer = 1,
        visible = true,
    ) {
        this.type = type;
        this.position = position;
        this.renderable = renderable;
        this.layer = layer;
        this.visible = visible;
        this.removed = false;
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
image.src = './assets/NES - Duck Hunt - The Dog - transparent.png';

const background = new Image;

// @todo João, ajustar essa urls para não serem fixas
background.src = './assets/NES - Duck Hunt - Backgrounds - transparent.png';
const dogWalkingSprite = new AnimatedSprite(56, 44, makeFrameSequence(image, 0, 13, 56, 44, 4, 4), 1);
const dogSmellingSprite = new AnimatedSprite(56, 44, makeFrameSequence(image, 0, 69, 56, 44, 2, 2), 1);
const dogFoundSprite = new Sprite(image, 0, 120, 56, 50);
const dogJumpSprite = new AnimatedSprite(40, 44, makeFrameSequence(image, 0, 185, 40, 44, 2, 2), 1);

const dog = new Entity(
    'dog',
    vec2(~~(NES.width * 0.1), ~~(NES.height * 0.6)),
    dogWalkingSprite,
    1,
    false,
);

const duckImage = new Image;

// @todo João, ajustar essa urls para não serem fixas
// @todo João, fazer uma versão com fundo transparente no GIMP
duckImage.src = './assets/NES - Duck Hunt - Ducks - transparent.png';
const duckHitSprite = new Sprite(duckImage, 220, 6, 38, 38);
const duckFallingSprite = new Sprite(duckImage, 258, 6, 31, 38);
const duckFlyingSprite = new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 106, 6, 38, 38, 3, 3), 1);
const duckFlyingUpSprite = new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 6, 2, 33, 33, 3, 3), 1);

function makeDuck() {
    const duck = new Entity(
        'duck',
        vec2(~~(NES.width * 0), ~~(NES.height * 0.15)),
        duckFlyingUpSprite,
        2
    );

    // @todo João, hit radius padrão
    duck[EntityExtensions.hitRadius] = duckFlyingSprite.width / 2;

    return duck;
}

const duck = makeDuck();

const backgroundSprite = new Sprite(background, 0, 0, NES.width, NES.height);

const backgrounds = [ backgroundSprite ];

/**
 * @type {boolean}
 */
let behaviorManagerInitted = false;

class EntityBehaviorManager {

    static behaviors = [];

    static register(behavior) {
        this.behaviors.push(behavior);
    }

    static runNextTick(timestamp) {
        const notCompleted = []; 
        for (const behaviorRunner of this.behaviors)
        {
            const { value, done } = behaviorRunner.next(timestamp)
    
            if (done) {
                behaviorLogger.log('finalizando um comportamento');
            } else {
                notCompleted.push(behaviorRunner);
            }
        }

        this.behaviors = notCompleted;
    }
}

/**
 * Função criada para auxiliar na depuração pelo console do navegador
 * @param {*} object 
 * @param {*} name 
 */
function registerAsGlobal(object, name = null) {
    const bindingName = name === null ? object.name : name; 

    console.log(`Making global: ${bindingName}`);
    window[bindingName] = object;
}

// registerAsGlobal(EntityBehaviorManager);

/**
 * 
 * @param {Entity} dog 
 * @param {number} timestamp 
 * @param {{ from: number, to: number}} param2
 * @param {boolean} loop
 * @param {boolean} reversed
 * @yields {boolean}
 * @returns {Generator<boolean, boolean, number>}
 */
function *dogAnimation(dog, timestamp, { from, to }, loop = false, reversed = false) {
    const initialTimestamp = timestamp;
    const totalTime = 4;

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
                    return;
                } else {
                    yield* dogAnimation(dog, currentTimestamp, { from, to }, loop, reversed);
                    return;
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
 * @param {*} entity 
 * @param {*} timestamp 
 * @param {*} behaviorsAndParams 
 */
function *composeBehaviors(entity, timestamp, behaviorsAndParams) {
    for (const [ behavior, params ] of behaviorsAndParams) {
        let currentTimestamp = yield;
        const instance = behavior(entity, currentTimestamp, ...params);

        let { done } = instance.next(currentTimestamp);

        while (!done) {
            currentTimestamp = yield;
            done  = instance.next(currentTimestamp).done;
        }
    }
}

function *changeSprite(entity, timestamp, sprite, totalTime) {
    const initialTimestamp = timestamp;

    entity.renderable = sprite;

    while (true) {
        const currentTimestamp = yield;
        const diffInSeconds = (currentTimestamp - initialTimestamp) / 1000;

        if (diffInSeconds > totalTime) {
            break;
        }
    }
}

function *runAction(object, timestamp, callback) {
    callback(object);
}

/**
 * 
 * @note Imagino que loop e reversed poderiam ser 'behaviors' separadamente, pois varios comportamentos podem e irão
 * ser reversíveis.
 * 
 * @param {*} entity 
 * @param {*} timestamp 
 * @param {*} param2 
 * @param {*} loop 
 * @param {*} reversed 
 * @param {*} totalTime 
 * @returns 
 */
function *moveBehavior(entity, timestamp, { from, to }, loop = false, reversed = false, totalTime) {
    const initialTimestamp = timestamp;

    // seta o início
    entity.position.x = ~~(from.x);
    entity.position.y = ~~(from.y);

    while (true) {
        const currentTimestamp = yield;
        const diffInSeconds = (currentTimestamp - initialTimestamp) / 1000;

        if (diffInSeconds > totalTime) {
            if (loop) {
                if (reversed) {
                    yield* moveBehavior(entity, currentTimestamp, { from: to, to: from }, loop, reversed, totalTime);
                    return;
                } else {
                    yield* moveBehavior(entity, currentTimestamp, { from, to }, loop, reversed, totalTime);
                    return;
                }
            } else {
                if (reversed) {
                    yield* moveBehavior(entity, currentTimestamp, { from: to, to: from }, loop, false, totalTime);
                    return;
                } else {
                    break;
                }
            }
        }

        const timePass = (diffInSeconds / totalTime);
        const newPosition = {
            x: from.x + timePass * (to.x - from.x),
            y: from.y + timePass * (to.y - from.y),
        };

        // aplicando 
        entity.position.x = ~~(newPosition.x);
        entity.position.y = ~~(newPosition.y);
    }
}

function generateDuckSteps() {
    const startPoint = vec2(100, 155);
    const result = [];
    
    // número aleatório entre 1 e 5, incluindo as duas extremidades
    const numberOfSteps = Math.ceil(Math.random() * 5);

    let lastPoint = startPoint;
    for (let i = 0; i < numberOfSteps; i++) {
        const newPoint = vec2(
            100 + ((Math.random() - 0.5) * 2 * 100),
            155 + (Math.random() *  -100)
        );

        result.push({ from: lastPoint, to: newPoint, });

        lastPoint = newPoint;
    }
    return result.reverse();
}

/**
 * @todo João, adicionar lógica de movimento do pato e troca para animação de queda
 * @param {*} entity 
 * @param {*} timestamp
 * @returns 
 */
function *duckBehavior(entity, timestamp) {
    const initialTimestamp = timestamp;
    const totalTime = 4;

    /**
     * @todo João, gerar 4 ou 5 etapas no movimento até finalmente sair da tela,
     * criar uma função para definir esse movimento para cada pato. Mas no geral
     * pensei em criar uma padrão de 4 a 6 etapas semialeatório.
     */
    const steps = generateDuckSteps();
    let fromToDirection;
    let currentTimestamp;
    let isFalling = false;
    outer: while (fromToDirection = steps.pop()) {

        mainLogger.logAsJson(fromToDirection)
        currentTimestamp = yield;
        // @todo João deduzir sprite mais apropriado de acordo com a direção do movimento
        const instance = moveBehavior(entity, currentTimestamp, fromToDirection, false, false, totalTime);

        let { done } = instance.next(currentTimestamp);

        while (!done) {
            currentTimestamp = yield;
            done  = instance.next(currentTimestamp).done;

            if (entity[EntityExtensions.hitted]) {
                mainLogger.log("inicinado comportamento de queda");
                isFalling = true;
                break outer;
            }
        }
    }

    if (isFalling) {
        currentTimestamp = yield;
        yield *changeSprite(entity, currentTimestamp, duckHitSprite, 0.500);

        entity.renderable = duckFallingSprite;

        currentTimestamp = yield;
        yield *moveBehavior(entity, currentTimestamp, {
            from: vec2(entity.position.x, entity.position.y),
            to: vec2(entity.position.x, entity.position.y + 100),
        }, false, false, totalTime / 2);
    }

    entity.removed = true;
}

/**
 * @type {Entity[]}
 */
const entities = [];

registerAsGlobal(entities, 'entities');
registerAsGlobal(LoggerManager, 'LoggerManager');

entities.push(dog);
entities.push(duck);

// @todo João, temporário, pensar melhor em como apresentar os dados do mouse para o programa principal,
// talvez um buffer de eventos? (muito complexo para o que eu preciso, eu desduplicaria mouseMove?), talvez
// apenas uma estrutura com mousePos, e mouseDown, e isRepeat (pra saber se é o primeiro mouse down) e preciso
// saber quando rolou o mouse up?
const mouseContext = {
    lastClicked: null
}

let lastTimestamp = 0;

function main(timestamp = 0) {
    const deltaTime = lastTimestamp - timestamp;
    lastTimestamp = timestamp;

    if (!timestamp || !lastTimestamp) {
        requestAnimationFrame(main);
        return;
    }

    // lidando com input
    inputContext: { // @todo João, trabalho em progesso
        const coord = mouseContext.lastClicked
        
        if (coord) {
            for (const entity of entities) {
                if (entity.type == 'duck') {
                    const dx = (entity.position.x + entity.renderable.width / 2) - coord.x;
                    const dy = (entity.position.y + entity.renderable.height / 2) - coord.y;

                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    // @note por hora os patos são figuras quadradas, porém eventualmente deveria
                    // permitir configurar por entidade o raio de colisão 
                    if (distance < entity[EntityExtensions.hitRadius]) {
                        entity[EntityExtensions.hitted] = true;
                    }
                }
            }
        }
    }

    mouseContext.lastClicked = null;

    if (!behaviorManagerInitted) {
        behaviorManagerInitted = true;
        EntityBehaviorManager.register(composeBehaviors(dog, timestamp, [
            [ runAction, [ (dog) => { dog.position = vec2(-60, ~~(NES.height * 0.6)); dog.visible = true; } ]],
            [ moveBehavior, [ { from: vec2(-60, NES.height * 0.6), to: vec2(90, NES.height * 0.6) }, false, false, 4 ]],
            [ changeSprite, [ dogSmellingSprite, 2 ]],
            [ changeSprite, [ dogFoundSprite, 1 ]],
            [ changeSprite, [ dogJumpSprite, 0 ]],
            [ moveBehavior, [ { from: vec2(90, NES.height * 0.6), to: vec2(90, NES.height * 0.5) }, false, false, 1 ]],
            [ runAction, [ (dog) => { dog.layer = 2; } ]],
            [ moveBehavior, [ { from: vec2(90, NES.height * 0.5), to: vec2(90, NES.height * 0.6), }, false, false, 1 ]],
            [ runAction, [ (dog) => { dog.visible = false; } ]],
        ]));
        EntityBehaviorManager.register(duckBehavior(duck, timestamp));
    }
    
    // @todo João, implementar um sistema para descrever animações/eventos e modificações em sprites ou entidades, não sei ainda se preciso de entidades para a animação, talvez só sprites funcionem

    EntityBehaviorManager.runNextTick(timestamp);

    // Renderização começa aqui

    // blue background
    ctxLayer02.fillStyle = '#4da4ff';
    ctxLayer02.fillRect(0, 0, NES.width, NES.height);

    // limpa layer
    ctxLayer01.clearRect(0, 0, NES.width, NES.height);

    for (const current of backgrounds) {
        ctxLayer01.drawImage(current.source, current.offsetX, current.offsetY, current.width, current.height);
    }

    for (const entity of entities) {
        if (!entity.renderable || !entity.visible) continue;
        
        const ctx = entity.layer === 1 ? ctxLayer01 : ctxLayer02;

        /**
         * @type {Sprite}
         */
        const frame = (entity.renderable instanceof AnimatedSprite) ? entity.renderable.getFrameFor(timestamp) : entity.renderable;
        
        console.assert(isInteger(entity.position.x))
        ctx.drawImage(frame.source, frame.offsetX, frame.offsetY, frame.width, frame.height, entity.position.x, entity.position.y, frame.width, frame.height);
        
        // @todo João, terminar de ajustar posição dos sprites
        // @todo João, terminar de implementar um controle para habilitar depuração da área clicável
        if (false && entity.type === 'duck') {
            ctx.beginPath();
            ctx.strokeStyle = "red";
            ctx.arc(entity.position.x + (entity.renderable.width / 2), entity.position.y + (entity.renderable.height / 2), entity[EntityExtensions.hitRadius], 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    // removendo entidades deletadas
    if (entities.some(entity => entity.removed))
    {
        mainLogger.log('removendo entidade(s)...');
        // @note filtrando no lugar
        // @url https://stackoverflow.com/questions/37318808/what-is-the-in-place-alternative-to-array-prototype-filter
        entities.splice(0, entities.length, ...entities.filter(entity => !entity.removed));

        // @todo João, temporário pra testar
        const newDuck = makeDuck();
        entities.push(newDuck);
        EntityBehaviorManager.register(duckBehavior(newDuck, timestamp));
    }

    // Compoem imagem
    ctx.drawImage(layer02, 0, 0);
    ctx.drawImage(layer01, 0, 0);

    requestAnimationFrame(main);
}

canvas.addEventListener('click', (event) => {
    // @todo João, revisar essa conversão
    const ratio = canvas.clientWidth / NES.width;
    const boundings = canvas.getBoundingClientRect();
    // posição menos offset do canvas e reescalado para compensar o escalonamento atual do canvas
    const coords = { x: (event.clientX - boundings.x) / ratio, y: (event.clientY - boundings.y) / ratio, };

    mouseContext.lastClicked = coords;
    inputLogger.logAsJson(coords);
});

image.addEventListener('load', () => {
    mainLogger.log('iniciando função main');
    main();
});
