
const params = new URLSearchParams(window.location.search);

/**
 * Cria um canvas com as dimensões especificadas e adiciona ele a algum elemnto
 * caso o parâmetro `appendTo` seja especificado
 * @param {number} width Largura inicial do canvas
 * @param {number} height Altura inicial do canvas
 * @param {HTMLElement?} appendTo O elemento especificado através dessa propriedade
 * @returns {HTMLCanvasElement} Canvas recém criado
 */
export function createCanvas(width, height, appendTo = null) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    if (appendTo) {
        appendTo.appendChild(canvas);
    }

    return canvas;
}

/**
 * @param {string} name nome do parâmetro
 * @returns {boolean} Verdadeiro se o valor pode ser convertido para verdadeiro
 */
export function getParamAsBoolean(name) {
    return Boolean(params.get(name));
}
