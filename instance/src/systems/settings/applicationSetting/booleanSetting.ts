import ApplicationSetting from "./applicationSetting.js";

export default class BooleanApplicationSetting extends ApplicationSetting<boolean, boolean> {
    constructor(applicationId: string, id: string, defaultValue: boolean) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
    }

    async setValue(value: boolean, userId: number) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return this;
    }

    async getValue(userId: number) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        return userSettings[`${this.applicationId}:${this.id}`];
    }
}
