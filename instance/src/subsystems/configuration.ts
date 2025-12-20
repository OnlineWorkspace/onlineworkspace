import type { Instance } from "../index.js";
import SubSystem from "../subSystems.js";

export enum WorkspacesFeatureFlags {
    SlashCommands = "slash_commands",
}

export default class ConfigurationSubsystem extends SubSystem {
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
    enabledFeatures: WorkspacesFeatureFlags[];

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
        this.backendUrl = "http://localhost:3563"
        this.webUrl = "http://localhost:5173"

        return this;
    }

    hasFeature(feature: WorkspacesFeatureFlags | string): boolean {
        return !!this.enabledFeatures.find((f) => f === feature);
    }

    async startup(): Promise<boolean> {
        for (const feature in WorkspacesFeatureFlags) {
            this.log.info(`Feature '${feature}' -> ${this.enabledFeatures.includes(feature as WorkspacesFeatureFlags)}`);
        }

        return true;
    }
}
