import ApplicationSetting from "./applicationSetting.js";

export class StringApplicationSetting extends ApplicationSetting<string> {
    global = false;

    constructor(applicationId: string, id: string, defaultValue: string) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.displayName = id;
        this.type = "string";
        this.description = "No description provided";
    }

    async setValue(value: string, userId: number) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        userSettings[`app:${this.applicationId}:${this.id}`] = value;

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return this;
    }

    async getValue(userId: number): Promise<string> {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        const settingValue = userSettings[`${this.applicationId}:${this.id}`];

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

export class GlobalStringApplicationSetting extends ApplicationSetting<string> {
    global = true;

    constructor(applicationId: string, id: string, defaultValue: string) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.type = "string";
        this.description = "No description provided";
    }

    async setValue(value: string) {
        await this.instance.sys.settings.setGlobalSetting(`app:${this.applicationId}:${this.id}`, value);

        return this;
    }

    async getValue(): Promise<string> {
        const settingValue = await this.instance.sys.settings.getGlobalSetting(`${this.applicationId}:${this.id}`);

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
