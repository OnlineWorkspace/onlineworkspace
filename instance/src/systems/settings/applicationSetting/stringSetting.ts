import { ApplicationSetting, GlobalApplicationSetting } from "./applicationSetting.ts";

export class StringApplicationSetting extends ApplicationSetting<string> {
  constructor(applicationId: string, id: string, defaultValue: string) {
    super();

    this.applicationId = applicationId;
    this.id = id;
    this.defaultValue = defaultValue;
    this.displayName = id;
    this.type = "string";
    this.description = "No description provided";
    this.hidden = false;
  }

  async setValue(userId: number, value: string) {
    const userSettings = await this.instance.sys.settings.getUserSettings(userId);

    userSettings[`app:${this.applicationId}:${this.id}`] = value;

    await this.instance.sys.settings.setUserSettings(userId, userSettings);

    return true;
  }

  async onValueChange(userId: number): Promise<string> {
    const userSettings = await this.instance.sys.settings.getUserSettings(userId);

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

  setHidden(hidden: boolean) {
    this.hidden = hidden;

    return this;
  }
}

export class GlobalStringApplicationSetting extends GlobalApplicationSetting<string> {
  constructor(applicationId: string, id: string, defaultValue: string) {
    super();

    this.applicationId = applicationId;
    this.id = id;
    this.defaultValue = defaultValue;
    this.type = "string";
    this.description = "No description provided";
    this.hidden = false;
  }

  async setValue(value: string) {
    await this.instance.sys.settings.setGlobalSetting(`app:${this.applicationId}:${this.id}`, value);

    return true;
  }

  async onValueChange(): Promise<string> {
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

  setHidden(hidden: boolean) {
    this.hidden = hidden;

    return this;
  }
}
