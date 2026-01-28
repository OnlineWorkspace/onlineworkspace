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

    async getGlobalSetting(settingId: string): Promise<string | undefined> {
        const db = this.instance.sys.database.postgres();
        const setting = (
            await db`SELECT value FROM tricolor_workspaces.public.global_settings WHERE key = ${settingId}`
        )?.[0]?.value;

        return setting;
    }

    async setGlobalSetting(settingId: string, value: string): Promise<boolean> {
        const db = this.instance.sys.database.postgres();

        await db`INSERT INTO tricolor_workspaces.public.global_settings (key, value) VALUES (${settingId}, ${value}) ON CONFLICT (key) DO UPDATE SET value = ${value};`;

        return true;
    }

    async getGlobalSettings(): Promise<Record<string, string>> {
        const db = this.instance.sys.database.postgres();
        const settings = (await db`SELECT * FROM tricolor_workspaces.public.global_settings`)?.[0]?.settings as Record<
            string,
            string
        >;

        return settings;
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

    async startup(): Promise<boolean> {
        super.startup();

        const db = this.instance.sys.database.postgres();

        await db`CREATE TABLE IF NOT EXISTS global_settings (
            key TEXT,
            value TEXT
        )`;

        return true;
    }
}
