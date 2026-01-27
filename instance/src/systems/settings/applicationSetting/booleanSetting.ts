import ApplicationSetting from "./applicationSetting.js";

export default class BooleanApplicationSetting extends ApplicationSetting<boolean, boolean> {
    constructor(id: string, defaultValue: boolean) {
        super();

        this.id = id;
        this.defaultValue = defaultValue;
    }
}
