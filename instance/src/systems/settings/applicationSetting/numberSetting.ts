import ApplicationSetting from "./applicationSetting.js";

export class NumberApplicationSetting extends ApplicationSetting<number> {
    global = false;

    constructor(applicationId: string, id: string, defaultValue: number) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.displayName = id;
        this.type = "number";
        this.description = "No description provided";
    }

    async setValue(value: number, userId: number) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        userSettings[`app:${this.applicationId}:${this.id}`] = value.toString();

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return this;
    }

    async getValue(userId: number): Promise<number> {
        const userSettings = await this.instance.sys.settings.getUserSettings(userId);
        const settingValue = userSettings[`${this.applicationId}:${this.id}`] as string | undefined;

        if (settingValue === undefined) return this.defaultValue;

        return Number(settingValue);
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

export class GlobalNumberApplicationSetting extends ApplicationSetting<number> {
    global = true;

    constructor(applicationId: string, id: string, defaultValue: number) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.type = "number";
        this.description = "No description provided";
    }

    async setValue(value: number) {
        await this.instance.sys.settings.setGlobalSetting(`app:${this.applicationId}:${this.id}`, value.toString());

        return this;
    }

    async getValue(): Promise<number> {
        const settingValue = await this.instance.sys.settings.getGlobalSetting(`${this.applicationId}:${this.id}`);

        if (settingValue === undefined) return this.defaultValue;

        return Number(settingValue);
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
