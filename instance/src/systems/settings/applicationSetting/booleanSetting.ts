import ApplicationSetting from "./applicationSetting.js";

export class BooleanApplicationSetting extends ApplicationSetting<boolean> {
    constructor(applicationId: string, id: string, defaultValue: boolean) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.displayName = id;
        this.type = "boolean";
    }

    async setValue(value: boolean, userId: number) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        userSettings[`app:${this.applicationId}:${this.id}`] = value ? "true" : "false";

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return this;
    }

    async getValue(userId: number): Promise<boolean> {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        const settingValue = userSettings[`${this.applicationId}:${this.id}`];

        if (settingValue === undefined) return this.defaultValue;

        return settingValue === "true";
    }

    setDisplayName(displayName: string): this {
        this.displayName = displayName;

        return this;
    }
}

export class GlobalBooleanApplicationSetting extends ApplicationSetting<boolean> {
    constructor(applicationId: string, id: string, defaultValue: boolean) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
    }

    async setValue(value: boolean) {
        await this.instance.sys.settings.setGlobalSetting(
            `app:${this.applicationId}:${this.id}`,
            value ? "true" : "false",
        );

        return this;
    }

    async getValue(): Promise<boolean> {
        const settingValue = await this.instance.sys.settings.getGlobalSetting(`${this.applicationId}:${this.id}`);

        if (settingValue === undefined) return this.defaultValue;

        return settingValue === "true";
    }

    setDisplayName(displayName: string): this {
        this.displayName = displayName;

        return this;
    }
}
