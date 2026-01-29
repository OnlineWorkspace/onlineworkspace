import ApplicationSetting from "./applicationSetting.js";

export class StringApplicationSetting extends ApplicationSetting<string> {
    constructor(applicationId: string, id: string, defaultValue: string) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.displayName = id;
        this.type = "string";
    }

    async setValue(value: string, userId: number) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        userSettings[`app:${this.applicationId}:${this.id}`] = value;

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return this;
    }

    async getValue(userId: number): Promise<string> {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        return userSettings[`${this.applicationId}:${this.id}`] || this.defaultValue;
    }
}

export class GlobalStringApplicationSetting extends ApplicationSetting<string> {
    constructor(applicationId: string, id: string, defaultValue: string) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
    }

    async setValue(value: string) {
        await this.instance.sys.settings.setGlobalSetting(`app:${this.applicationId}:${this.id}`, value);

        return this;
    }

    async getValue(): Promise<string> {
        return (
            (await this.instance.sys.settings.getGlobalSetting(`${this.applicationId}:${this.id}`)) || this.defaultValue
        );
    }
}
