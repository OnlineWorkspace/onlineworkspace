import type { Instance } from "./index.js";
import type { Logger } from "./log.js";
import type ApplicationsSubsystem from "./systems/applications.js";
import type AuthorizationSubsystem from "./systems/authorization.js";
import type ConfigurationSubsystem from "./systems/configuration.js";
import type ConsoleCommandsSubsystem from "./systems/consoleCommands.js";
import type DatabaseSubsystem from "./systems/database.js";
import type EmailSystem from "./systems/email.js";
import type EventSystem from "./systems/events.js";
import type FilesystemSubsystem from "./systems/filesystem.js";
import type ImageSubsystem from "./systems/image.js";
import type NotificationsSubsystem from "./systems/notifications.js";
import type ReverseProxySystem from "./systems/reverseProxy.js";
import type SettingsSubsystem from "./systems/settings.js";
import type TRPCSubsystem from "./systems/trpc.js";
import type UsersSubsystem from "./systems/users.js";
import type WebFrontendSubsystem from "./systems/webFrontend.js";

export type Sys = {
  users: UsersSubsystem;
  notifications: NotificationsSubsystem;
  filesystem: FilesystemSubsystem;
  configuration: ConfigurationSubsystem;
  consoleCommands: ConsoleCommandsSubsystem;
  authorization: AuthorizationSubsystem;
  database: DatabaseSubsystem;
  applications: ApplicationsSubsystem;
  tRPC: TRPCSubsystem;
  image: ImageSubsystem;
  settings: SettingsSubsystem;
  webFrontend: WebFrontendSubsystem;
  email: EmailSystem;
  event: EventSystem;
  reverseProxy: ReverseProxySystem;
} & { [key: string]: System };

export default abstract class System {
  instance: Instance;
  readonly log: Logger;
  readonly id: string;

  protected constructor(id: string, instance: Instance) {
    this.instance = instance;
    this.id = id;
    this.log = instance.log.createLogger(this.id);
  }

  async startup(): Promise<boolean> {
    this.log.info("Starting up...");
    return true;
  }

  stop() {
    this.log.info(`Stopping System ${this.id}`);
    return this;
  }
}
