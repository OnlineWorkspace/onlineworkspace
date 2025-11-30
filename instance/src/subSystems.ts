import type { Instance } from "./index.js";
import type { Logger } from "./log.js";
import type AuthorizationSubsystem from "./subsystems/authorization.js";
import type ConfigurationSubsystem from "./subsystems/configuration.js";
import type ConsoleCommandsSubsystem from "./subsystems/consoleCommands.js";
import type FilesystemSubsystem from "./subsystems/filesystem.js";
import type NotificationsSubsystem from "./subsystems/notifications.js";
import type UsersSubsystem from "./subsystems/users.js";
import DatabaseSubsystem from "./subsystems/database.js";
import ApplicationsSubsystem from "./subsystems/applications.js";
import TRPCSubsystem from "./subsystems/trpc.js";

export type SubSystems = {
    users: UsersSubsystem;
    notifications: NotificationsSubsystem;
    filesystem: FilesystemSubsystem;
    configuration: ConfigurationSubsystem;
    consoleCommands: ConsoleCommandsSubsystem;
    authorization: AuthorizationSubsystem;
    database: DatabaseSubsystem;
    applications: ApplicationsSubsystem;
    tRPC: TRPCSubsystem;
} & { [key: string]: SubSystem };

export default abstract class SubSystem {
    instance: Instance;
    readonly log: Logger;
    readonly id: string;

    protected constructor(id: string, instance: Instance) {
        this.instance = instance;
        this.id = id;
        this.log = instance.log.createLogger(this.id);

        return this;
    }

    async startup(): Promise<boolean> {
        this.log.info("Starting up...");
        return true;
    }

    stop() {
        this.log.info(`Stopping SubSystem ${this.id}`);
        return this;
    }
}
