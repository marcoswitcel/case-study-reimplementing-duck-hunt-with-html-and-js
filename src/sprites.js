
export class Sprite {
    
    /**
     * @type {CanvasImageSource}
     */
    source;

    /**
     * @type {number}
     */
    offsetX;
    /**
     * @type {number}
     */
    offsetY;
    /**
     * @type {number}
     */
    width;
    /**
     * @type {number}
     */
    height;

    /**
     * @param {number} offsetX
     * @param {number} offsetY 
     * @param {number} height 
     * @param {number} width 
     */
    constructor(
        offsetX,
        offsetY,
        width,
        height,
    ) {
        this.offsetX = offsetX;
        this.offsetY = offsetY; 
        this.width = width;
        this.height = height;
    }
}

export class AnimatedSprite {
    
    /**
     * @type {number}
     */
    width;
    
    /**
     * @type {number}
     */
    height;

    /**
     * @type {Sprite[]}
     */
    frames;
    
    /**
     * @type {number}
     */
    lengthTime;

    /**
     * @param {number} width 
     * @param {number} height 
     * @param {Sprite[]} frames 
     * @param {number} lengthTime 
     */
    constructor(
        width,
        height,
        frames,
        lengthTime,
    ) {
        this.width = width;
        this.height = height;
        this.frames = frames;
        this.lengthTime = lengthTime; 
    }
}
