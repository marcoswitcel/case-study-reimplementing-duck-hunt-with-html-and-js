import { Entity, EntityExtensions, setEntityAnimation } from './entity.js';
import { behaviorLogger, mainLogger } from './logger.js';
import { NES, distance, vec2 } from './utils.js';
import { levelContext } from './level-context.js';

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
export function *dogAnimation(dog, timestamp, { from, to }, loop = false, reversed = false) {
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
export function *composeBehaviors(entity, timestamp, behaviorsAndParams) {
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

export function *changeSprite(entity, timestamp, animationName, totalTime) {
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

export function *wait(entity, timestamp, totalTime) {
    const initialTimestamp = timestamp;

    while (true) {
        const currentTimestamp = yield;
        const diffInSeconds = (currentTimestamp - initialTimestamp) / 1000;

        if (diffInSeconds > totalTime) {
            break;
        }
    }
}

export function *runAction(object, timestamp, callback) {
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
export function *moveBehavior(entity, timestamp, { from, to }, loop = false, reversed = false, totalTime) {
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
        // @todo João, deixar velocidade constante
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
export function *duckBehavior(entity, timestamp) {
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

        // @todo João, terminar de configurar a velocidade aqui
        const totalTime = distance(fromToDirection.from, fromToDirection.to) / 50;
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
