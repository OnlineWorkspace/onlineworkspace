import { Instance } from "../index.js";
import System from "../system.js";
import {
  ApplicationSetting,
  GlobalApplicationSetting,
} from "./settings/applicationSetting/applicationSetting.js";

export default class SettingsSystem extends System {
  applicationSettings: {
    [applicationId: string]: (
      | ApplicationSetting<any>
      | GlobalApplicationSetting<any>
    )[];
  };

  constructor(instance: Instance) {
    super("settings", instance);

    this.applicationSettings = {};

    return this;
  }

  async getUserSettings(userId: number): Promise<Record<string, any>> {
    const db = this.instance.sys.database.postgres();

    return (
      await db`SELECT settings FROM tricolor_workspaces.public.users WHERE id = ${userId}`
    )?.[0]?.settings as Record<string, any>;
  }

  async getUserApplicationSetting<SettingType extends ApplicationSetting<any>>(
    userId: number,
    applicationId: string,
    settingId: string,
  ): Promise<SettingType["defaultValue"]> {
    return (
      (await this.applicationSettings[applicationId]
        .find((s) => s.id === settingId)
        ?.getValue(userId)) ??
      this.applicationSettings[applicationId].find((s) => s.id === settingId)
        ?.defaultValue
    );
  }

  async setUserApplicationSetting<T>(
    userId: number,
    applicationId: string,
    settingId: string,
    value: T,
  ): Promise<boolean> {
    const applicationSetting = this.applicationSettings[applicationId].find(
      (s) => s.id === settingId,
    );

    if (!applicationSetting) return false;

    if (applicationSetting instanceof ApplicationSetting) {
      await applicationSetting?.setValue(userId, value);
      return true;
    } else {
      return false;
    }
  }

  async setUserSettings(
    userId: number,
    settings: Record<string, any>,
  ): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    await db`UPDATE tricolor_workspaces.public.users SET settings = ${settings} WHERE id = ${userId}`;

    return true;
  }

  async getGlobalSetting(settingId: string): Promise<any | undefined> {
    const db = this.instance.sys.database.postgres();

    return (
      await db`SELECT value FROM tricolor_workspaces.public.global_settings WHERE key = ${settingId}`
    )?.[0]?.value;
  }

  async setGlobalSetting(settingId: string, value: any): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    await db`INSERT INTO tricolor_workspaces.public.global_settings (key, value) VALUES (${settingId}, ${value}) ON CONFLICT (key) DO UPDATE SET value = ${value};`;

    return true;
  }

  async getGlobalSettings(): Promise<Record<string, string>> {
    const db = this.instance.sys.database.postgres();

    return (
      await db`SELECT * FROM tricolor_workspaces.public.global_settings`
    )?.[0]?.settings as Record<string, string>;
  }

  registerApplicationSetting<
    Setting extends ApplicationSetting<any> | GlobalApplicationSetting<any>,
  >(setting: Setting) {
    if (!this.applicationSettings[setting.applicationId]) {
      this.applicationSettings[setting.applicationId] = [];
    }

    setting.instance = this.instance;
    this.log.info(
      `Setting '${setting.id}' was registered for application '${setting.applicationId}'`,
    );
    this.applicationSettings[setting.applicationId].push(setting);

    return this;
  }

  async startup(): Promise<boolean> {
    await super.startup();

    const db = this.instance.sys.database.postgres();

    await db`CREATE TABLE IF NOT EXISTS global_settings (
            key TEXT,
            value TEXT
        )`;

    return true;
  }
}
