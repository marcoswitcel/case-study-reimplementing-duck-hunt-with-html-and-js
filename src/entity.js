import { AnimatedSprite, Sprite } from './sprites.js';

/**
 * @typedef {import('./utils.js').Vector2} Vector2
 */

export class Entity {

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
        visible = true
    ) {
        this.type = type;
        this.position = position;
        this.renderable = renderable;
        this.layer = layer;
        this.visible = visible;
        this.removed = false;
    }
}

export const EntityExtensions = {
    hitted: Symbol.for('Entity.hitted'),
    hitRadius: Symbol.for('Entity.hitRadius'),
    animationState: Symbol.for('Entity.animationState'),
    animationMap: Symbol.for('Entity.animationMap'),
}

export function setEntityAnimation(entity, animationStateName) {
    if (animationStateName && entity[EntityExtensions.animationMap]) {

        entity[EntityExtensions.animationState] = animationStateName;
        entity.renderable = entity[EntityExtensions.animationMap][animationStateName];
        
        console.assert(entity.renderable);
        return;
    }
    
    console.assert(animationStateName);
    console.assert(entity[EntityExtensions.animationMap]);
}
