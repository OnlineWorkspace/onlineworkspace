import { promises as fs, existsSync as fsExistsSync, readFileSync as fsReadFileSync } from "node:fs";
import * as os from "node:os";
import path from "node:path";
import type { Instance } from "../index.js";
import System from "../system.js";

export enum WorkspacesFeatureFlags {
  SlashCommands = "slash_commands",
  ShootYourselfInTheFoot = "shoot_yourself_in_the_foot",
  AllowUserSignups = "allow_user_signups",
}

export const FEATURE_FLAG_DESCRIPTIONS = {
  [WorkspacesFeatureFlags.SlashCommands]: "Enable the ability to use slash commands in the instance's console",
  [WorkspacesFeatureFlags.ShootYourselfInTheFoot]:
    "Allow administrators to alter settings / configuration options which may cause the instance to malfunction. (Only enable this if you are sure you know what you are doing!)",
  [WorkspacesFeatureFlags.AllowUserSignups]: "Allow new users to create accounts from the instance user login page",
};

export default class ConfigurationSystem extends System {
  isDevMode: boolean = true;
  databases: {
    postgres: {
      user: string;
      password: string;
      host: string;
      port: number;
      database: string;
    };
  };
  // https://localhost
  backendUrl: string;
  // https://localhost
  webUrl: string[];
  enabledFeatures: (WorkspacesFeatureFlags | string)[];
  signupRequirements: {
    email: boolean;
    twoFactorAuthentication: boolean;
    passwordMinimumLength?: number;
    passwordContains?: {
      minimumUppercase?: number;
      minimumLowercase?: number;
      minimumNumbers?: number;
      minimumSymbols?: number;
    };
  };
  displayName: string;
  mailServer: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  termsOfUse: { message: string; lastUpdated: number };
  defaultQuickShortcuts: string[];
  defaultApplications: { id: string; uri: string }[];

  constructor(instance: Instance) {
    super("configuration", instance);

    this.enabledFeatures = [WorkspacesFeatureFlags.SlashCommands];
    this.databases = {
      postgres: {
        user: "postgres",
        password: "postgres",
        host: "localhost",
        port: 5432,
        database: "onlineworkspace_workspace",
      },
    };

    if (process.env.POSTGRES_DATABASE_HOST) this.databases.postgres.host = process.env.POSTGRES_DATABASE_HOST;

    this.backendUrl = "https://localhost";
    // localhost and the current machine's local ip
    this.webUrl = [
      "https://localhost",
      // @ts-ignore
      Object.values(os.networkInterfaces())
        .flat()
        .filter((networkInterface) => networkInterface!.internal === false && networkInterface!.family === "IPv4")
        .map((networkInterface) => `https://${networkInterface!.address}`),
    ];
    this.signupRequirements = {
      email: false,
      twoFactorAuthentication: false,
      passwordMinimumLength: 5,
      passwordContains: {
        minimumLowercase: 1,
        minimumNumbers: 1,
        minimumSymbols: 1,
        minimumUppercase: 1,
      },
    };
    this.displayName = "Workspace";
    this.mailServer = {
      host: "smtp.example.com",
      port: 587,
      secure: true,
      auth: {
        user: "user",
        pass: "password",
      },
    };
    this.termsOfUse = {
      message: `1. Acceptance of Terms
    - By logging in, you agree to these rules. If you do not agree, please do not use the service.
2. Account Security
    - You are the gatekeeper of your account. Keep your password private, as you are responsible for all activity that happens under your login.
3. Content Ownership
    - What is yours remains yours. We claim no ownership over the files, photos, or data you upload to this instance.
4. Acceptable Use
    - Do not use this space for anything illegal, malicious, or harmful. This includes uploading malware or attempting to disrupt the service for others.
5. Privacy and Access
    - We value your privacy. We will not access your stored data unless it is strictly necessary for technical support or required by legal authorities.
6. Storage and Maintenance
    - While we strive for 100% uptime, this service is provided "as is." We may occasionally perform maintenance that results in temporary downtime.
7. Personal Responsibility
    - Hardware and software can fail. You agree to maintain your own external backups of any mission-critical data. We are not liable for data loss.
8. Termination
    - We reserve the right to suspend or close accounts that violate these terms or compromise the security of the server.
9. Policy Updates
    - These terms may change. If we make significant updates, we will post a notification within the app or send an email.`,
      lastUpdated: Date.now(),
    };

    this.defaultQuickShortcuts = ["uk.ewsgit.dashboard", "uk.ewsgit.store", "uk.ewsgit.settings", "uk.ewsgit.photos", "uk.ewsgit.files"];

    this.defaultApplications = [
      { id: "uk.ewsgit.dashboard", uri: "local:uk.ewsgit.dashboard" },
      { id: "uk.ewsgit.store", uri: "local:uk.ewsgit.store" },
      { id: "uk.ewsgit.settings", uri: "local:uk.ewsgit.settings" },
      { id: "uk.ewsgit.photos", uri: "local:uk.ewsgit.photos" },
      { id: "uk.ewsgit.files", uri: "local:uk.ewsgit.files" },
    ];

    if (fsExistsSync(path.join(this.instance.sys.filesystem.AUTOINSTALL_PATH, "configuration.json"))) {
      this.log.info("Auto-install configuration detected. Loading configuration from auto-install.");

      const autoInstallConfig = JSON.parse(fsReadFileSync(path.join(this.instance.sys.filesystem.AUTOINSTALL_PATH, "configuration.json")).toString());

      if (autoInstallConfig.enabledFeatures) this.enabledFeatures = autoInstallConfig.enabledFeatures;
      if (autoInstallConfig.databases) this.databases = autoInstallConfig.databases;
      if (autoInstallConfig.backendUrl) this.backendUrl = autoInstallConfig.backendUrl;
      if (autoInstallConfig.webUrl) this.webUrl = autoInstallConfig.webUrl;
      if (autoInstallConfig.signupRequirements) this.signupRequirements = autoInstallConfig.signupRequirements;
      if (autoInstallConfig.displayName) this.displayName = autoInstallConfig.displayName;
      if (autoInstallConfig.mailserver) this.mailServer = autoInstallConfig.mailserver;
      if (autoInstallConfig.termsOfUse) this.termsOfUse = autoInstallConfig.termsOfUse;
      if (autoInstallConfig.defaultQuickShortcuts) this.defaultQuickShortcuts = autoInstallConfig.defaultQuickShortcuts;
      if (autoInstallConfig.defaultApplications) this.defaultApplications = autoInstallConfig.defaultApplications;
    }
  }

  hasFeature(feature: WorkspacesFeatureFlags | string): boolean {
    return !!this.enabledFeatures.find((f) => f === feature);
  }

  async enableFeature(feature: WorkspacesFeatureFlags | string) {
    if (!this.enabledFeatures.includes(feature)) this.enabledFeatures.push(feature);

    await this.saveConfiguration();

    return true;
  }

  async disableFeature(feature: WorkspacesFeatureFlags | string) {
    this.enabledFeatures = this.enabledFeatures.filter((feat) => feat !== feature);

    await this.saveConfiguration();

    return true;
  }

  async saveConfiguration(): Promise<boolean> {
    const CONFIGURATION_FILE_PATH = path.join(this.instance.sys.filesystem.FS_ROOT, "configuration.json");

    await fs.writeFile(
      CONFIGURATION_FILE_PATH,
      JSON.stringify(
        {
          enabledFeatures: this.enabledFeatures,
          databases: this.databases,
          backendUrl: this.backendUrl,
          webUrl: this.webUrl,
          signupRequirements: this.signupRequirements,
          displayName: this.displayName,
          mailserver: this.mailServer,
          termsOfUse: this.termsOfUse,
          defaultQuickShortcuts: this.defaultQuickShortcuts,
        },
        null,
        2,
      ),
    );

    return true;
  }

  async startup(): Promise<boolean> {
    const CONFIGURATION_FILE_PATH = path.join(this.instance.sys.filesystem.FS_ROOT, "configuration.json");

    if (!fsExistsSync(CONFIGURATION_FILE_PATH)) {
      await this.saveConfiguration();
    }

    const configurationFile = JSON.parse((await fs.readFile(CONFIGURATION_FILE_PATH)).toString());

    if (configurationFile.enabledFeatures) this.enabledFeatures = configurationFile.enabledFeatures;
    if (configurationFile.databases) this.databases = configurationFile.databases;
    if (configurationFile.backendUrl) this.backendUrl = configurationFile.backendUrl;
    if (configurationFile.webUrl) this.webUrl = configurationFile.webUrl;
    if (configurationFile.signupRequirements) this.signupRequirements = configurationFile.signupRequirements;
    if (configurationFile.displayName) this.displayName = configurationFile.displayName;
    if (configurationFile.mailserver) this.mailServer = configurationFile.mailserver;
    if (configurationFile.termsOfUse) this.termsOfUse = configurationFile.termsOfUse;
    if (configurationFile.defaultQuickShortcuts) this.defaultQuickShortcuts = configurationFile.defaultQuickShortcuts;
    if (configurationFile.defaultApplications) this.defaultApplications = configurationFile.defaultApplications;

    for (const feature of Object.keys(WorkspacesFeatureFlags)) {
      this.log.info(
        // @ts-ignore
        `Feature ${feature} -> ${this.enabledFeatures.includes(WorkspacesFeatureFlags[feature])}`,
      );
    }

    return true;
  }
}
