import { ApplicationSetting, GlobalApplicationSetting } from "./applicationSetting.js";

export class StringListApplicationSetting extends ApplicationSetting<string[]> {
    allowedValues?: string[];
    allowDuplicateValues?: boolean;

    constructor(
        applicationId: string,
        id: string,
        defaultValue: string[],
        options?: { allowedValues: string[]; allowDuplicateValues?: boolean },
    ) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.displayName = id;
        this.type = "stringList";
        this.description = "No description provided";
        this.allowedValues = options?.allowedValues;
        this.allowDuplicateValues = options?.allowDuplicateValues;

        return this;
    }

    async setValue(userId: number, value: string[]) {
        if (this.allowedValues) {
            for (const val of value) {
                if (!this.allowedValues.includes(val)) {
                    this.instance.log.system.warning(
                        `Unable to set setting '${this.applicationId}:${this.id}' for user ${userId} as it contains invalid value '${value}'`,
                    );
                    return false;
                }
            }
        }

        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        userSettings[`app:${this.applicationId}:${this.id}`] = JSON.stringify(value);

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return true;
    }

    async addValue(userId: number, value: string) {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        userSettings[`app:${this.applicationId}:${this.id}`] = JSON.stringify([
            ...JSON.parse(userSettings[`app:${this.applicationId}:${this.id}`]),
            value,
        ]);

        await this.instance.sys.settings.setUserSettings(userId, userSettings);

        return this;
    }

    async getValue(userId: number): Promise<string[]> {
        let userSettings = await this.instance.sys.settings.getUserSettings(userId);

        const settingValue = userSettings[`app:${this.applicationId}:${this.id}`];

        if (settingValue === undefined) return this.defaultValue;

        return JSON.parse(settingValue);
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

export class GlobalStringListApplicationSetting extends GlobalApplicationSetting<string[]> {
    allowedValues?: string[];
    allowDuplicateValues?: boolean;

    constructor(
        applicationId: string,
        id: string,
        defaultValue: string[],
        options?: { allowedValues: string[]; allowDuplicateValues?: boolean },
    ) {
        super();

        this.applicationId = applicationId;
        this.id = id;
        this.defaultValue = defaultValue;
        this.type = "string";
        this.description = "No description provided";
        this.allowedValues = options?.allowedValues;
        this.allowDuplicateValues = options?.allowDuplicateValues;

        return this;
    }

    async setValue(value: string[]) {
        if (this.allowedValues) {
            for (const val of value) {
                if (!this.allowedValues.includes(val)) {
                    this.instance.log.system.warning(
                        `Unable to set setting '${this.applicationId}:${this.id}' as it contains invalid value '${value}'`,
                    );
                    return false;
                }
            }
        }

        await this.instance.sys.settings.setGlobalSetting(
            `app:${this.applicationId}:${this.id}`,
            JSON.stringify(value),
        );

        return true;
    }

    async addValue(value: string) {
        const rawSettingValue = await this.instance.sys.settings.getGlobalSetting(
            `app:${this.applicationId}:${this.id}`,
        );
        let settingValue: string[];

        if (rawSettingValue === undefined) {
            settingValue = [];
        } else {
            settingValue = JSON.parse(rawSettingValue);
        }

        await this.instance.sys.settings.setGlobalSetting(
            `app:${this.applicationId}:${this.id}`,
            JSON.stringify([...settingValue, value]),
        );

        return this;
    }

    async getValue(): Promise<string[]> {
        const settingValue = await this.instance.sys.settings.getGlobalSetting(`app:${this.applicationId}:${this.id}`);

        if (settingValue === undefined) return this.defaultValue;

        return JSON.parse(settingValue);
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
