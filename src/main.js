import { AnimatedSprite, Sprite, makeFrameSequence } from './sprites.js';
import { createCanvas, getParamAsBoolean, isInteger, registerAsGlobal, vec2 } from './utils.js';
import { LoggerManager, behaviorLogger, inputLogger, mainLogger } from './logger.js'
import { Entity, EntityExtensions } from './entity.js';
import { EntityBehaviorManager } from './entity-behavior-manager.js';

/**
 * @typedef {import('./utils.js').Vector2} Vector2
 */

LoggerManager.initFromQueryString('loggerFilter');

const debugHitArea = getParamAsBoolean("debugHitArea");
const debugAnimationName = getParamAsBoolean("debugAnimationName");



function setEntityAnimation(entity, animationStateName) {
    if (animationStateName && entity[EntityExtensions.animationMap]) {

        entity[EntityExtensions.animationState] = animationStateName;
        entity.renderable = entity[EntityExtensions.animationMap][animationStateName];
        
        console.assert(entity.renderable);
        return;
    }
    
    console.assert(animationStateName);
    console.assert(entity[EntityExtensions.animationMap]);
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

const dog = new Entity(
    'dog',
    vec2(~~(NES.width * 0.1), ~~(NES.height * 0.6)),
    null,
    1,
    false,
);

dog[EntityExtensions.hitRadius] = 20;
dog[EntityExtensions.animationMap] = {
    'walking': new AnimatedSprite(56, 44, makeFrameSequence(image, 0, 13, 56, 44, 4, 4), 1),
    'smelling': new AnimatedSprite(56, 44, makeFrameSequence(image, 0, 69, 56, 44, 2, 2), 1),
    'found': new Sprite(image, 0, 120, 56, 50),
    'jump': new AnimatedSprite(40, 44, makeFrameSequence(image, 0, 185, 40, 44, 2, 2), 1),
    'got1duck': new Sprite(image, 0, 256, 50, 48),
    'got2duck': new Sprite(image, 0, 256, 50, 48), // @todo João, mesma animação da got1duck
    'got3duck': new Sprite(image, 0, 256, 50, 48), // @todo João, mesma animação da got1duck
    'laughing': new AnimatedSprite(40, 44, makeFrameSequence(image, 0, 320, 32, 40, 2, 2), 1),
};
setEntityAnimation(dog, 'walking');

const duckImage = new Image;

// @todo João, ajustar essa urls para não serem fixas
// @todo João, fazer uma versão com fundo transparente no GIMP
duckImage.src = './assets/NES - Duck Hunt - Ducks - transparent.png';

const duckSpritesVariations = [];

for (let i = 0; i < 3; i++)
{
    duckSpritesVariations.push({
        hit: new Sprite(duckImage, 220, 6 + (i * 44), 38, 38),
        falling: new Sprite(duckImage, 258, 6 + (i * 44), 31, 38),
        'flying.right': new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 106, 6 + (i * 44), 38, 38, 3, 3), 1),
        'flying.right.up': new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 6, 2 + (i * 44), 33, 33, 3, 3), 1),
        'flying.left': new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 106, 6 + (i * 44), 38, 38, 3, 3), 1),
        'flying.left.up': new AnimatedSprite(38, 38, makeFrameSequence(duckImage, 6, 2 + (i * 44), 33, 33, 3, 3), 1),
    });
}

function makeDuck() {
    const duck = new Entity(
        'duck',
        vec2(-100, -100), //  deixar fora da tela pra começar
        null,
        2
    );

    // @todo João, hit radius padrão
    duck[EntityExtensions.hitRadius] = 38 / 2;

    const animationMap = duckSpritesVariations[Math.floor(duckSpritesVariations.length * Math.random())];

    duck[EntityExtensions.animationState] = 'flying.right';
    duck[EntityExtensions.animationMap] = animationMap;

    duck.renderable = duck[EntityExtensions.animationMap]['flying.right'];

    return duck;
}

const backgroundSprite = new Sprite(background, 0, 0, NES.width, NES.height);

const backgrounds = [ backgroundSprite ];

/**
 * @type {boolean}
 */
let behaviorManagerInitted = false;

const levelContext = {
    lost: 0,
    hitted: 0,
}

// registerAsGlobal(EntityBehaviorManager);
registerAsGlobal(levelContext, 'levelContext');

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

function *changeSprite(entity, timestamp, animationName, totalTime) {
    const initialTimestamp = timestamp;

    setEntityAnimation(entity, animationName);

    while (true) {
        const currentTimestamp = yield;
        const diffInSeconds = (currentTimestamp - initialTimestamp) / 1000;

        if (diffInSeconds > totalTime) {
            break;
        }
    }
}

function *wait(entity, timestamp, totalTime) {
    const initialTimestamp = timestamp;

    while (true) {
        const currentTimestamp = yield;
        const diffInSeconds = (currentTimestamp - initialTimestamp) / 1000;

        if (diffInSeconds > totalTime) {
            break;
        }
    }
}

function *runAction(object, timestamp, callback) {
    callback(object, timestamp);
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
    const startPoint = vec2(100, 175);
    const result = [];
    
    // número aleatório entre 1 e 4, incluindo as duas extremidades
    const numberOfSteps = Math.ceil(Math.random() * 4);

    let lastPoint = startPoint;
    for (let i = 0; i < numberOfSteps; i++) {
        const newPoint = vec2(
            100 + ((Math.random() - 0.5) * 2 * 100),
            175 + (Math.random() *  -125) - 30
        );

        result.push({ from: lastPoint, to: newPoint, });

        lastPoint = newPoint;
    }

    // voa para fora da tela na última sempre
    result.push({ from: lastPoint, to: vec2(100 + ((Math.random() - 0.5) * 2 * 100), -30), })

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

        behaviorLogger.logAsJson(fromToDirection)
        currentTimestamp = yield;

        let animationName = (fromToDirection.from.x < fromToDirection.to.x) ? 'flying.right' : 'flying.left';
        
        if (fromToDirection.from.y > fromToDirection.to.y) {
            animationName += '.up';
        }

        setEntityAnimation(entity, animationName);

        // @todo João deduzir sprite mais apropriado de acordo com a direção do movimento
        const instance = moveBehavior(entity, currentTimestamp, fromToDirection, false, false, totalTime);

        let { done } = instance.next(currentTimestamp);

        while (!done) {
            currentTimestamp = yield;
            done  = instance.next(currentTimestamp).done;

            if (entity[EntityExtensions.hitted]) {
                mainLogger.log("iniciando comportamento de queda");
                isFalling = true;
                break outer;
            }
        }
    }

    if (isFalling) {
        currentTimestamp = yield;
        yield *changeSprite(entity, currentTimestamp, 'hit', 0.500);

        setEntityAnimation(entity, 'falling');

        currentTimestamp = yield;
        yield *moveBehavior(entity, currentTimestamp, {
            from: vec2(entity.position.x, entity.position.y),
            to: vec2(entity.position.x, entity.position.y + 100),
        }, false, false, totalTime / 2);
    }

    entity.removed = true;
    levelContext.lost++;
}

/**
 * @type {Entity[]}
 */
const entities = [];

registerAsGlobal(entities, 'entities');
registerAsGlobal(LoggerManager, 'LoggerManager');

entities.push(dog);

// @todo João, temporário, pensar melhor em como apresentar os dados do mouse para o programa principal,
// talvez um buffer de eventos? (muito complexo para o que eu preciso, eu desduplicaria mouseMove?), talvez
// apenas uma estrutura com mousePos, e mouseDown, e isRepeat (pra saber se é o primeiro mouse down) e preciso
// saber quando rolou o mouse up?
const mouseContext = {
    lastClicked: null
}

let lastTimestamp = 0;

function addFlyingDuck(timestamp) {
    const newDuck = makeDuck();
    entities.push(newDuck);
    EntityBehaviorManager.register(duckBehavior(newDuck, timestamp));
    mainLogger.log("adicionando pato...");
}

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
                // @note João, criar atributo e objeto pra representar objetos 'clicáveis'
                if (entity.type == 'duck' || entity.type == 'dog') {
                    const dx = entity.position.x - coord.x;
                    const dy = entity.position.y - coord.y;

                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    // @note por hora os patos são figuras quadradas, porém eventualmente deveria
                    // permitir configurar por entidade o raio de colisão 
                    if (distance < entity[EntityExtensions.hitRadius]) {
                        entity[EntityExtensions.hitted] = true;
                        levelContext.hitted++;
                    }
                }
            }
        }
    }

    mouseContext.lastClicked = null;

    if (!behaviorManagerInitted) {
        behaviorManagerInitted = true;
        EntityBehaviorManager.register(composeBehaviors(dog, timestamp, [
            [ runAction, [ (dog) => { dog.position = vec2(-60, ~~(NES.height * 0.7)); dog.visible = true; } ]],
            [ moveBehavior, [ { from: vec2(-60, NES.height * 0.7), to: vec2(125, NES.height * 0.7) }, false, false, 4 ]],
            [ changeSprite, [ 'smelling', 2 ]],
            [ changeSprite, [ 'found', 1 ]],
            [ changeSprite, [ 'jump', 0 ]],
            [ moveBehavior, [ { from: vec2(125, NES.height * 0.7), to: vec2(125, NES.height * 0.6) }, false, false, 1 ]],
            [ runAction, [ (dog) => { dog.layer = 2; } ]],
            [ moveBehavior, [ { from: vec2(125, NES.height * 0.6), to: vec2(125, NES.height * 0.7), }, false, false, 1 ]],
            [ runAction, [ (dog) => { dog.visible = false; } ]],
            [ runAction, [ (_, timestamp) => { addFlyingDuck(timestamp); } ]],
        ]));
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
        
        console.assert(isInteger(entity.position.x));
        const x = entity.position.x - ~~(entity.renderable.width / 2); // @note aredonda pra baixo em caso de número impar de pixels
        const y = entity.position.y - ~~(entity.renderable.height / 2); // @note aredonda pra baixo em caso de número impar de pixels
        ctx.drawImage(frame.source, frame.offsetX, frame.offsetY, frame.width, frame.height, x, y, frame.width, frame.height);
        
        // @todo João, terminar de ajustar posição dos sprites
        if (debugHitArea && (entity.type === 'duck' || entity.type === 'dog')) {
            ctx.beginPath();
            ctx.strokeStyle = "red";
            ctx.arc(entity.position.x, entity.position.y, entity[EntityExtensions.hitRadius], 0, 2 * Math.PI);
            ctx.stroke();
        }

        if (debugAnimationName && entity[EntityExtensions.animationState] && (entity.type === 'duck' || entity.type === 'dog')) {
            ctx.font = '12px monospace';
            ctx.fillStyle = 'red';
            ctx.fillText(entity[EntityExtensions.animationState], entity.position.x + entity[EntityExtensions.hitRadius], entity.position.y);
        }
    }

    // várias limpezas e processos rodados após a conclusão do frame
    for (const entity of entities) {
        
        if (entity[EntityExtensions.hitted]) {
            inputLogger.log("Entidade clicada no frame: " + entity.type);
            entity[EntityExtensions.hitted] = false;
        }

        if (entity.type === 'duck' && entity.removed) {


            // @todo João, ajustar para não usar o nome da animação aqui...
            if (entity[EntityExtensions.animationState] === 'falling') {
                EntityBehaviorManager.register(composeBehaviors(dog, timestamp, [
                    [ runAction, [ (dog) => { dog.layer = 2; dog.position = vec2(125, ~~(NES.height * 0.7)); dog.visible = true; setEntityAnimation(dog, 'got1duck') } ]],
                    [ moveBehavior, [ { from: vec2(125, ~~(NES.height * 0.7)), to: vec2(125, ~~(NES.height * 0.58)) }, false, false, 0.5 ]],
                    [ changeSprite, [ 'got1duck', .5 ]],
                    [ moveBehavior, [ { to: vec2(125, ~~(NES.height * 0.7)), from: vec2(125, ~~(NES.height * 0.58)) }, false, false, 0.5 ]],
                    [ runAction, [ (dog) => { dog.visible = false; } ]],
                    [ wait, [ .3 ]],
                    [ runAction, [ (_, timestamp) => { addFlyingDuck(timestamp); } ]],
                ]));    
            } else {
                EntityBehaviorManager.register(composeBehaviors(dog, timestamp, [
                    [ runAction, [ (dog) => { dog.layer = 2; dog.position = vec2(125, ~~(NES.height * 0.7)); dog.visible = true; setEntityAnimation(dog, 'laughing') } ]],
                    [ moveBehavior, [ { from: vec2(125, ~~(NES.height * 0.7)), to: vec2(125, ~~(NES.height * 0.58)) }, false, false, 0.5 ]],
                    [ changeSprite, [ 'laughing', .75 ]],
                    [ moveBehavior, [ { to: vec2(125, ~~(NES.height * 0.7)), from: vec2(125, ~~(NES.height * 0.58)) }, false, false, 0.5 ]],
                    [ runAction, [ (dog) => { dog.visible = false; } ]],
                    [ wait, [ .3 ]],
                    [ runAction, [ (_, timestamp) => { addFlyingDuck(timestamp); } ]],
                ]));
            }
        }

    }

    // removendo entidades deletadas
    if (entities.some(entity => entity.removed))
    {
        mainLogger.log('removendo entidade(s)...');
        // @note filtrando no lugar
        // @url https://stackoverflow.com/questions/37318808/what-is-the-in-place-alternative-to-array-prototype-filter
        entities.splice(0, entities.length, ...entities.filter(entity => !entity.removed));
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
