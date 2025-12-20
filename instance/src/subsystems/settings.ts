import { Instance } from "../index.js";
import SubSystem from "../subSystems.js";

export default class SettingsSubsystem extends SubSystem {
    constructor(instance: Instance) {
        super("settings", instance);

        return this;
    }

    getInstance(): Record<string, any> {
        console.error("TODO: implement me!")
        return {};
    }

    async getUser(userId: number): Promise<Record<string, any>> {
        const db = this.instance.subSystems.database.postgres();
        const settings = (await db`SELECT settings FROM users WHERE id = ${userId}`)?.[0]?.settings as Record<string, any>;

        return settings;
    }
}
