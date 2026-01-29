import { Instance } from "../index.js";
import System from "../system.js";

export enum WorkspacesEvent {
    BeforeStartupComplete,
}

export default class EventSystem extends System {
    __internal_eventListeners: { [key in WorkspacesEvent]?: (() => void)[] } = {};

    constructor(instance: Instance) {
        super("event", instance);

        return this;
    }

    on(eventType: WorkspacesEvent, cb: () => void) {
        if (!this.__internal_eventListeners[eventType]) {
            this.__internal_eventListeners[eventType] = [];
        }

        this.__internal_eventListeners[eventType].push(cb);

        return this;
    }

    invoke(eventType: WorkspacesEvent) {
        let events = this.__internal_eventListeners[eventType];

        if (!events) {
            return this;
        }

        for (const event of events) {
            event();
        }

        return this;
    }

    async startup(): Promise<boolean> {
        return true;
    }
}
