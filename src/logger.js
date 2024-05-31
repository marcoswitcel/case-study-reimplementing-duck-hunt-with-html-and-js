
const TYPE_NULL = 0;
const TYPE_CONSOLE = 1;
const TYPE_LOCAL_STORAGE = 1 << 1;

export class Logger {

    /**
     * @type {number}
     */
    type;
    
    /**
     * @type {string}
     */
    agent;

    constructor(agent) {
        this.agent = agent;
        /**
         * @todo João, avaliar se faz sentido deixar pro localstorage por padrão
         */
        this.type = 0 | TYPE_CONSOLE | TYPE_LOCAL_STORAGE;
    }

    /**
     * 
     * @param  {string} message
     */
    log(message) {
        const finalMessage = `[${this.agent}] ${message}`;

        if (this.type & TYPE_CONSOLE) {
            console.log(finalMessage)
        }
    }
}
