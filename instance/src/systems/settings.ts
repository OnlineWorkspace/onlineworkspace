import { Instance } from "../index.js";
import System from "../system.js";

export default class SettingsSystem extends System {
    constructor(instance: Instance) {
        super("settings", instance);

        return this;
    }

    getInstance(): Record<string, any> {
        console.error("TODO: implement me!");
        return {};
    }

    async getUser(userId: number): Promise<Record<string, any>> {
        const db = this.instance.sys.database.postgres();
        const settings = (await db`SELECT settings FROM users WHERE id = ${userId}`)?.[0]?.settings as Record<
            string,
            any
        >;

        return settings;
    }

    async setUser(userId: number, settings: Record<string, any>): Promise<boolean> {
        const db = this.instance.sys.database.postgres();

        await db`UPDATE users SET settings = ${settings} WHERE id = ${userId}`;

        return true;
    }
}
