import { ApplicationSetting, GlobalApplicationSetting } from "./applicationSetting.js";

export class BooleanApplicationSetting extends ApplicationSetting<boolean> {
    constructor(applicationId: string, id: string, defaultValue: boolean) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.displayName = id;
        this.type = "boolean";
        this.description = "No description provided";
    }

    async setValue(userId: number, value: boolean) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        userSettings[`app:${this.applicationId}:${this.id}`] = value;

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return true;
    }

    async getValue(userId: number): Promise<boolean> {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        const settingValue = userSettings[`app:${this.applicationId}:${this.id}`];

        if (settingValue === undefined) return this.defaultValue;

        return settingValue;
    }

    setDisplayName(displayName: string): this {
        this.displayName = displayName;

        return this;
    }

    setDescription(description: string): this {
        this.description = description;

        return this;
    }
}

export class GlobalBooleanApplicationSetting extends GlobalApplicationSetting<boolean> {
    constructor(applicationId: string, id: string, defaultValue: boolean) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.type = "boolean";
        this.description = "No description provided";
    }

    async setValue(value: boolean) {
        await this.instance.sys.settings.setGlobalSetting(`app:${this.applicationId}:${this.id}`, value);

        return true;
    }

    async getValue(): Promise<boolean> {
        const settingValue = await this.instance.sys.settings.getGlobalSetting(`app:${this.applicationId}:${this.id}`);

        if (settingValue === undefined) return this.defaultValue;

        return settingValue;
    }

    setDisplayName(displayName: string): this {
        this.displayName = displayName;

        return this;
    }

    setDescription(description: string): this {
        this.description = description;

        return this;
    }
}
