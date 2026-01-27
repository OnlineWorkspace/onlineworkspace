import { Instance } from "../index.js";
import System from "../system.js";
import ApplicationSetting from "./settings/applicationSetting/applicationSetting.js";

export default class SettingsSystem extends System {
    applicationSettings: { [applicationId: string]: ApplicationSetting<any, boolean>[] };

    constructor(instance: Instance) {
        super("settings", instance);

        this.applicationSettings = {};

        return this;
    }

    getInstance(): Record<string, any> {
        console.error("TODO: implement me!");
        return {};
    }

    async getUserSettings(userId: number): Promise<Record<string, any>> {
        const db = this.instance.sys.database.postgres();
        const settings = (await db`SELECT settings FROM tricolor_workspaces.public.users WHERE id = ${userId}`)?.[0]
            ?.settings as Record<string, any>;

        return settings;
    }

    async setUserSettings(userId: number, settings: Record<string, any>): Promise<boolean> {
        const db = this.instance.sys.database.postgres();

        await db`UPDATE tricolor_workspaces.public.users SET settings = ${settings} WHERE id = ${userId}`;

        return true;
    }

    registerApplicationSetting<Setting extends ApplicationSetting<any, boolean>>(
        applicationId: string,
        setting: Setting,
    ) {
        if (!this.applicationSettings[applicationId]) {
            this.applicationSettings[applicationId] = [];
        }

        this.log.info(`Setting '${setting.id}' was registered for application '${applicationId}'`);
        this.applicationSettings[applicationId].push(setting);

        return this;
    }
}
