import { AnimatedSprite, Sprite, makeFrameSequence } from './sprites.js';
import { NES, createCanvas, distance, getParamAsBoolean, isInteger, registerAsGlobal, vec2 } from './utils.js';
import { LoggerManager, inputLogger, mainLogger } from './logger.js'
import { Entity, EntityExtensions, setEntityAnimation } from './entity.js';
import { EntityBehaviorManager } from './entity-behavior-manager.js';
import { changeSprite, composeBehaviors, duckBehavior, moveBehavior, runAction, wait } from './behaviors.js';
import { levelContext } from './level-context.js';
import { backgroundResourceLocation, dogResourceLocation, duckResourceLocation } from './assets.js';

/**
 * @typedef {import('./utils.js').Vector2} Vector2
 */

LoggerManager.initFromQueryString('loggerFilter');

const debugHitArea = getParamAsBoolean("debugHitArea");
const debugAnimationName = getParamAsBoolean("debugAnimationName");

console.log('olá mundo duck hunt');

const canvas = createCanvas(NES.width, NES.height, document.body);
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext('2d');

// layers
/**
 * @type {HTMLCanvasElement} Canvas usado para compor os elementos da
 * camada frontal (primeira camanada). Aqui é renderizado a vegetação e
 * cão durante a cena de abertura.
 * @todo João, os elementos de UI estão temporariamente nessa camada, fixos
 * avaliar e implementar renderização desses elementos assim que forem separados
 * da vegetação.
 */
const layer01 = createCanvas(NES.width, NES.height);
layer01.style.imageRendering = 'pixelated';
const ctxLayer01 = layer01.getContext('2d');
/**
 * @type {HTMLCanvasElement} Canvas usado para compor os elementos da
 * camada do fundo (segunda camanada). Aqui é renderizado a cor sólida
 * do céu e os patos e o cão, após ele saltar atrás das plantas.
 */
const layer02 = createCanvas(NES.width, NES.height);
layer02.style.imageRendering = 'pixelated';
const ctxLayer02 = layer02.getContext('2d');

// @todo João, terminar o layer da UI
const layerUI = createCanvas(NES.width, NES.height);
layerUI.style.imageRendering = 'pixelated';
const ctxLayerUI = layerUI.getContext('2d')

const image = new Image;

image.src = dogResourceLocation;

const background = new Image;

background.src = backgroundResourceLocation;

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

duckImage.src = duckResourceLocation;

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

// registerAsGlobal(EntityBehaviorManager);
registerAsGlobal(levelContext, 'levelContext');

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
const app = {
    input: {
        lastClicked: null,
    },
};

let lastTimestamp = 0;

function addFlyingDuck(timestamp) {
    const newDuck = makeDuck();
    entities.push(newDuck);
    EntityBehaviorManager.register(duckBehavior(newDuck, timestamp));
    mainLogger.log("adicionando pato...");
}

function processClickableEntities() {
    const coord = app.input.lastClicked
    
    if (coord) {
        for (const entity of entities) {
            // @note João, criar atributo e objeto pra representar objetos 'clicáveis'
            if (entity.type == 'duck' || entity.type == 'dog') {
                if (distance(entity.position, coord) < entity[EntityExtensions.hitRadius]) {
                    entity[EntityExtensions.hitted] = true;
                    levelContext.hitted++;
                }
            }
        }
    }

    // @note dveria ser feito ao final do frame
    app.input.lastClicked = null;
}

function main(timestamp = 0) {
    const deltaTime = lastTimestamp - timestamp;
    lastTimestamp = timestamp;
    
    if (!timestamp || !lastTimestamp) {
        requestAnimationFrame(main);
        return;
    }
    
    // lidando com input
    processClickableEntities();

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

    EntityBehaviorManager.runNextTick(timestamp);

    // Renderização começa aqui

    // blue background
    ctxLayer02.fillStyle = '#4da4ff';
    ctxLayer02.fillRect(0, 0, NES.width, NES.height);

    // limpa layer
    ctxLayer01.clearRect(0, 0, NES.width, NES.height);
    ctxLayerUI.clearRect(0, 0, NES.width, NES.height);

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

    // Compondo layers para formar a imagem final
    ctx.drawImage(layer02, 0, 0);
    ctx.drawImage(layer01, 0, 0);
    ctx.drawImage(layerUI, 0, 0);

    requestAnimationFrame(main);
}

canvas.addEventListener('click', (event) => {
    const ratio = canvas.clientWidth / NES.width;
    const boundings = canvas.getBoundingClientRect();
    // posição menos offset do canvas e reescalado para compensar o escalonamento atual do canvas
    const coords = { x: (event.clientX - boundings.x) / ratio, y: (event.clientY - boundings.y) / ratio, };

    app.input.lastClicked = coords;
    inputLogger.logAsJson(coords);
});

image.addEventListener('load', () => {
    mainLogger.log('iniciando função main');
    main();
});
