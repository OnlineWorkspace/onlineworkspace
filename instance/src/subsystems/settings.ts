import { Instance } from "../index.js";
import SubSystem from "../subSystems.js";

export default class SettingsSubsystem extends SubSystem {
    constructor(instance: Instance) {
        super("settings", instance);

        return this;
    }

    getInstance(): Record<string, any> {
        return {};
    }

    getUser(userId: number): Record<string, any> {
        return {};
    }
}
