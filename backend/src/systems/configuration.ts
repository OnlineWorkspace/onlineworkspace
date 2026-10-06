import {
  existsSync as fsExistsSync,
  promises as fs,
  readFileSync as fsReadFileSync,
} from "node:fs";
import { randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export enum WorkspacesFeatureFlags {
  SlashCommands = "slash_commands",
  ShootYourselfInTheFoot = "shoot_yourself_in_the_foot",
  AllowUserSignups = "allow_user_signups",
  ExperimentalTerminalGui = "experimental_terminal_gui",
  ClearTerminalConsoleOnStartup = "clear_terminal_console_on_startup",
  DisplayProfilesAtLogon = "display_profiles_at_logon"
}

export const FEATURE_FLAG_DESCRIPTIONS = {
  [WorkspacesFeatureFlags.SlashCommands]:
    "Enable the ability to use slash commands in the instance's console",
  [WorkspacesFeatureFlags.ShootYourselfInTheFoot]:
    "Allow administrators to alter settings / configuration options which may cause the instance to malfunction. (Only enable this if you are sure you know what you are doing!)",
  [WorkspacesFeatureFlags.AllowUserSignups]:
    "Allow new users to create accounts from the instance user login page",
  [WorkspacesFeatureFlags.DisplayProfilesAtLogon]:
  "Display the instance's users as profiles on the login screen. This is only recommended for instances not publicly exposed to the internet."
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
  } = {
    postgres: {
      user: "postgres",
      password: "postgres",
      host: "localhost",
      port: 5432,
      database: "onlineworkspace_workspace",
    },
  };
  proxy: { secure: boolean; hostname: string } = {
    secure: true,
    hostname: "localhost",
  };
  enabledFeatures: (WorkspacesFeatureFlags | string)[] = [
    WorkspacesFeatureFlags.SlashCommands,
    WorkspacesFeatureFlags.ClearTerminalConsoleOnStartup
  ];
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
  } = {
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
  branding: {
    displayName: string;
    tagline: string;
    metaDescription: string;
    showLoginBackground: boolean;
    showLoginBanner: boolean;
    showSquareLogoInNavigation: boolean;
    squareLogoLinkEnabled: boolean;
    squareLogoLinkUrl: string;
  } = {
    displayName: "OnlineWorkspace",
    tagline: "Under construction...",
    metaDescription: "A self-hosted web platform for applications & services with design based on Google's Material 3 Expressive. (Work In Progress)",
    showLoginBackground: true,
    showLoginBanner: true,
    showSquareLogoInNavigation: false,
    squareLogoLinkEnabled: false,
    squareLogoLinkUrl: "",
  }
  mailServer: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  } = {
    enabled: false,
    host: "smtp.example.com",
    port: 465,
    secure: true,
    auth: {
      user: "user",
      pass: "password",
    },
  }
  termsOfUse: { message: string; lastUpdated: number };
  defaultQuickShortcuts: string[] = [
    "uk.ewsgit.dashboard",
    "uk.ewsgit.store",
    "uk.ewsgit.settings",
    "uk.ewsgit.photos",
    "uk.ewsgit.files",
  ];
  defaultApplications: { id: string; uri: string }[] = [
    { id: "uk.ewsgit.dashboard", uri: "local:uk.ewsgit.dashboard" },
    { id: "uk.ewsgit.store", uri: "local:uk.ewsgit.store" },
    { id: "uk.ewsgit.settings", uri: "local:uk.ewsgit.settings" },
    { id: "uk.ewsgit.photos", uri: "local:uk.ewsgit.photos" },
    { id: "uk.ewsgit.files", uri: "local:uk.ewsgit.files" },
    { id: "uk.ewsgit.guide", uri: "local:uk.ewsgit.guide" },
  ];
  userDefault: {
    homeDirectories: string[];
    quotaSize: number;
    displayNameFormat: string;
  } = {
    homeDirectories: ["Documents", "Photos", "Videos", "Projects"],
    quotaSize: 1024 * 1024 * 1024,
    displayNameFormat: "New User %num%",
  };
  caddyfile: string | undefined = "../Caddyfile";
  apiPort: number = 3563;
  /** Has the instance setup wizard been completed, until it is the wizard is shown at `/` instead of the usual page */
  setupComplete: boolean = false;

  /** The one-time token printed to the console which must be provided to the setup wizard, only present while the instance is not set up. */
  #setupToken: string | undefined;

  /** @returns true if the token matches, the token can only be used while the instance has not been setup */
  verifySetupToken(token: string): boolean {
    if (this.setupComplete || this.#setupToken === undefined) return false;

    const expected = Buffer.from(this.#setupToken);
    const given = Buffer.from(token.trim());

    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  async completeSetup() {
    this.setupComplete = true;
    this.#setupToken = undefined;
    await this.saveConfiguration();
    this.log.success("Instance setup complete!");
  }

  /** The databases as configured by the file, without the environment overrides, which are never written back to it. */
  #fileDatabases: ConfigurationSystem["databases"] | undefined;

  /** Environment variables always take priority over the configuration file. */
  applyEnvironmentOverrides() {
    const env = process.env;
    this.#fileDatabases = structuredClone(this.databases);
    const postgres = this.databases.postgres;
    postgres.user = env.ONLINEWORKSPACE_POSTGRES_DATABASE_USER || postgres.user;
    postgres.password =
      env.ONLINEWORKSPACE_POSTGRES_DATABASE_PASSWORD || postgres.password;
    postgres.host = env.ONLINEWORKSPACE_POSTGRES_DATABASE_HOST || postgres.host;
    postgres.port =
      Number(env.ONLINEWORKSPACE_POSTGRES_DATABASE_PORT) || postgres.port;
    postgres.database =
      env.ONLINEWORKSPACE_POSTGRES_DATABASE_NAME || postgres.database;
  }

  constructor(instance: Instance) {
    super("configuration", instance);

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
    if (
      fsExistsSync(
        path.join(
          this.instance.sys.filesystem.AUTO_INSTALL_PATH,
          "configuration.json",
        ),
      )
    ) {
      this.log.info(
        "Auto-install configuration detected. Loading configuration from auto-install.",
      );

      const autoInstallConfig = JSON.parse(
        fsReadFileSync(
          path.join(
            this.instance.sys.filesystem.AUTO_INSTALL_PATH,
            "configuration.json",
          ),
        ).toString(),
      );

      for (const key of Object.keys(autoInstallConfig)) {
        if (key in this) {
          // @ts-ignore unimportant
          this[key] = autoInstallConfig[key];
        }
      }
    }

    this.applyEnvironmentOverrides();
  }

  hasFeature(feature: WorkspacesFeatureFlags | string): boolean {
    return !!this.enabledFeatures.find((f) => f === feature);
  }

  async enableFeature(feature: WorkspacesFeatureFlags | string) {
    if (!this.enabledFeatures.includes(feature)) {
      this.enabledFeatures.push(feature);
    }

    await this.saveConfiguration();
    INSTANCE.log.system.info(`Enabled feature ${INSTANCE.log.system.emphasis(feature as string)}`);

    return true;
  }

  async disableFeature(feature: WorkspacesFeatureFlags | string) {
    this.enabledFeatures = this.enabledFeatures.filter((feat) =>
      feat !== feature
    );

    await this.saveConfiguration();
    INSTANCE.log.system.info(`Disabled feature ${INSTANCE.log.system.emphasis(feature as string)}`);

    return true;
  }

  async saveConfiguration(): Promise<boolean> {
    const CONFIGURATION_FILE_PATH = path.join(
      this.instance.sys.filesystem.FS_ROOT,
      "configuration.json",
    );

    const allowedProperties =
      (Object.keys(this) as (keyof ConfigurationSystem)[]).filter(
        (property) => {
          return typeof this[property] !== "function" &&
            property !== "instance" && property !== "id" && property !== "log";
        },
      );

    const configurationFileContents: Record<string, unknown> = {};

    for (const propertyKey of allowedProperties) {
      configurationFileContents[propertyKey] = this[propertyKey];
    }
    configurationFileContents.databases =
      this.#fileDatabases ?? this.databases;

    await fs.writeFile(
      CONFIGURATION_FILE_PATH,
      JSON.stringify(configurationFileContents, null, 2),
    );

    return true;
  }

  override async startup(): Promise<boolean> {
    const CONFIGURATION_FILE_PATH = path.join(
      this.instance.sys.filesystem.FS_ROOT,
      "configuration.json",
    );

    const isExistingInstance = fsExistsSync(CONFIGURATION_FILE_PATH);

    if (!isExistingInstance) {
      await this.saveConfiguration();
    }

    const configurationFile = JSON.parse(
      (await fs.readFile(CONFIGURATION_FILE_PATH)).toString(),
    );

    const allowedProperties =
      (Object.keys(this) as (keyof ConfigurationSystem)[]).filter(
        (property) => {
          return typeof this[property] !== "function" &&
            property !== "instance" && property !== "id" && property !== "log";
        },
      );

    for (const propertyKey of allowedProperties) {
      if (propertyKey in configurationFile) {
        // @ts-expect-error We can ignore this as the properties which are read-only are already removed from the allowedProperties by this stage.
        this[propertyKey] = configurationFile[propertyKey];
      }
    }

    // instances which were configured before the setup wizard existed are already set up
    if (isExistingInstance && !("setupComplete" in configurationFile)) {
      this.setupComplete = true;
    }

    if (!this.setupComplete) {
      this.#setupToken = randomBytes(6).toString("hex");
      this.log.warning("This instance has not been set up yet. Open it in a browser to run the setup wizard.");
      this.log.warning(`Setup token: ${this.log.emphasis(this.#setupToken)}`);
    }

    this.applyEnvironmentOverrides();

    for (
      const feature of Object.keys(
        WorkspacesFeatureFlags,
      ) as (keyof typeof WorkspacesFeatureFlags)[]
    ) {
      this.log.info(
        `Feature ${feature} -> ${
          this.enabledFeatures.includes(WorkspacesFeatureFlags[feature])
        }`,
      );
    }

    await this.saveConfiguration()

    return true;
  }
}
