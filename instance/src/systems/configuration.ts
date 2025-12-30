import type { Instance } from "../index.js";
import System from "../system.js";
import path from "path";
import { promises as fs } from "fs";

export enum WorkspacesFeatureFlags {
    SlashCommands = "slash_commands",
    ShootYourselfInTheFoot = "shoot_yourself_in_the_foot",
}

export const FEATURE_FLAG_DESCRIPTIONS = {
    [WorkspacesFeatureFlags.ShootYourselfInTheFoot]:
        "Allow administrators to alter settings / configuration options which may cause the instance to malfunction. (Only enable this if you are sure you know what you are doing!)",
};

export default class ConfigurationSystem extends System {
    isDevMode: boolean = true;
    databases: {
        postgres: {
            user: string;
            password: string;
            host: string;
            port: number;
        };
    };
    // http://localhost:3563
    backendUrl: string;
    // http://localhost:5173
    webUrl: string;
    enabledFeatures: (WorkspacesFeatureFlags | string)[];
    signupRequirements: {
        email: boolean;
        twoFactorAuthentication: boolean;
    };
    displayName: string;
    mailserver: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };

    constructor(instance: Instance) {
        super("configuration", instance);

        this.enabledFeatures = [WorkspacesFeatureFlags.SlashCommands];
        this.databases = {
            postgres: {
                // TODO: actually set these values
                user: "postgres",
                password: "postgres",
                host: "localhost",
                port: 5432,
            },
        };
        this.backendUrl = "http://localhost:3563";
        this.webUrl = "http://localhost:5173";
        this.signupRequirements = {
            email: false,
            twoFactorAuthentication: false,
        };
        this.displayName = "Tricolor Workspaces";
        this.mailserver = {
            host: "smtp.example.com",
            port: 587,
            secure: true,
            auth: {
                user: "user",
                pass: "password",
            },
        };

        return this;
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
        const CONFIGURATION_FILE_PATH = path.join(
            this.instance.sys.filesystem.FS_ROOT,
            "configuration.json",
        );

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
                    mailserver: this.mailserver,
                },
                null,
                2,
            ),
        );

        return true;
    }

    async startup(): Promise<boolean> {
        const CONFIGURATION_FILE_PATH = path.join(
            this.instance.sys.filesystem.FS_ROOT,
            "configuration.json",
        );

        if (!(await fs.exists(CONFIGURATION_FILE_PATH))) {
            await this.saveConfiguration();
        }

        const configurationFile = JSON.parse(
            (await fs.readFile(CONFIGURATION_FILE_PATH)).toString(),
        );

        if (configurationFile.enabledFeatures)
            this.enabledFeatures = configurationFile.enabledFeatures;
        if (configurationFile.databases) this.databases = configurationFile.databases;
        if (configurationFile.backendUrl) this.backendUrl = configurationFile.backendUrl;
        if (configurationFile.webUrl) this.webUrl = configurationFile.webUrl;
        if (configurationFile.signupRequirements)
            this.signupRequirements = configurationFile.signupRequirements;
        if (configurationFile.displayName) this.displayName = configurationFile.displayName;
        if (configurationFile.mailserver) this.mailserver = configurationFile.mailserver;

        for (const feature of Object.keys(WorkspacesFeatureFlags)) {
            this.log.info(
                // @ts-ignore
                `Feature ${feature} -> ${this.enabledFeatures.includes(WorkspacesFeatureFlags[feature])}`,
            );
        }

        return true;
    }
}
