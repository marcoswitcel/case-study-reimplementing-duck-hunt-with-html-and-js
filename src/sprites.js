
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
     * @param {CanvasImageSource} source
     * @param {number} offsetX
     * @param {number} offsetY 
     * @param {number} height 
     * @param {number} width 
     */
    constructor(
        source,
        offsetX,
        offsetY,
        width,
        height,
    ) {
        this.source = source;
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

/**
 * 
 * @param {CanvasImageSource} image 
 * @param {number} offsetX 
 * @param {number} offsetY 
 * @param {number} width 
 * @param {number} height 
 * @param {number} totalNumberOfFrames 
 * @param {number} perRow 
 * 
 * @returns {Sprite[]}
 */
export const makeFrameSequence = (image, offsetX, offsetY, width, height, totalNumberOfFrames, perRow) => {
    /**
     * @type {Sprite[]}
     */
    const frames = [];

    for (let rowIndex = 0; rowIndex < Math.ceil(totalNumberOfFrames / perRow); rowIndex ++ )  {
        for (let colIndex = 0; colIndex < perRow; colIndex++) {
            const sprite = new Sprite(
                image,
                offsetX + (colIndex * width),
                offsetY + (rowIndex * height),
                width,
                height
            );

            frames.push(sprite);
        }
    }

    return frames;
}
