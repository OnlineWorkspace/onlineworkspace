import ApplicationSetting from "./applicationSetting.js";

export default class GlobalBooleanApplicationSetting extends ApplicationSetting<boolean, boolean> {
    constructor(applicationId: string, id: string, defaultValue: boolean) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
    }

    async setValue(value: boolean) {
        await this.instance.sys.settings.setGlobalSetting(`${this.applicationId}:${this.id}`, value ? "true" : "false");

        return this;
    }

    async getValue() {
        let userSettings = await this.instance.sys.settings.getGlobalSettings();

        return userSettings[`${this.applicationId}:${this.id}`];
    }
}
