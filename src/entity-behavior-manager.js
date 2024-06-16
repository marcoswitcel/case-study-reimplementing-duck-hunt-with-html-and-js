import { behaviorLogger } from './logger.js';

export class EntityBehaviorManager {

    static behaviors = [];

    static register(behavior) {
        this.behaviors.push(behavior);
    }

    static runNextTick(timestamp) {
        const notCompleted = [];
        for (const behaviorRunner of this.behaviors) {
            const { value, done } = behaviorRunner.next(timestamp);

            if (done) {
                behaviorLogger.log('finalizando um comportamento');
            } else {
                notCompleted.push(behaviorRunner);
            }
        }

        this.behaviors = notCompleted;
    }
}
