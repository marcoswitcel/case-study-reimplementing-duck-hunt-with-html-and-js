
const TYPE_NULL = 0;
const TYPE_CONSOLE = 1;
const TYPE_LOCAL_STORAGE = 1 << 1;

export class LoggerManager {
    /**
     * @private
     * @type {Map<string, boolean>}
     */
   static agents = new Map();
   
   /**
    * @public
    * @param {string} agent 
    * @returns {boolean}
    */
    static isAgentOn(agent) {
      return !!(this.agents.get(agent))
    }
    
    static initFromQueryString(parameterName) {
        const params = new URLSearchParams(window.location.search);

        const value = params.get(parameterName);

        if (value) {
            for (const agent of value.split(',')) {
                if (agent.trim()) {
                    this.agents.set(agent.trim(), true);
                }
            }
        }
    }

    static setAgent(agent, on) {
        this.agents.set(agent, on);
    }

    static turnOn(agent) {
        this.agents.set(agent, true);
    }

    static turnOff(agent) {
        this.agents.set(agent, false);
    }
}

export class Logger {

    /**
     * @private
     * @type {number}
     */
    type;
    
    /**
     * @readonly
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

        if (!this.isOn()) return;

        if (this.type & TYPE_CONSOLE) {
            console.log(finalMessage)
        }
    }

    logAsJson(object) {
        const message = JSON.stringify(object);
        this.log(message);
    }

    /**
     * @private
     * @returns {boolean}
     */
    isOn() {
        return LoggerManager.isAgentOn(this.agent);
    }

    on() {
        LoggerManager.turnOn(this.agent);
    }

    off() {
        LoggerManager.turnOff(this.agent);
    }
}
