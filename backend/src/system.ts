import type { Instance } from "./index.ts";
import type { Logger } from "./log.ts";
import ApiSystem from "./systems/api.ts";
import type ApplicationsSubsystem from "./systems/applications.ts";
import type AuthorizationSubsystem from "./systems/authorization.ts";
import type ConfigurationSubsystem from "./systems/configuration.ts";
import type ConsoleCommandsSubsystem from "./systems/consoleCommands.ts";
import type DatabaseSubsystem from "./systems/database.ts";
import type EmailSystem from "./systems/email.ts";
import type EventSystem from "./systems/events.ts";
import type FilesystemSubsystem from "./systems/filesystem.ts";
import type ImageSubsystem from "./systems/image.ts";
import type NotificationsSubsystem from "./systems/notifications.ts";
import type ReverseProxySystem from "./systems/reverseProxy.ts";
import type SettingsSubsystem from "./systems/settings.ts";
import type TerminalSystem from "./systems/terminal.ts";
import type TRPCSubsystem from "./systems/trpc.ts";
import type UsersSubsystem from "./systems/users.ts";
import type WebFrontendSubsystem from "./systems/webFrontend.ts";

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
  terminal: TerminalSystem;
  api: ApiSystem;
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
    return true;
  }

  stop(): this | Promise<this> {
    this.log.info(`Stopping System ${this.id}`);
    return this;
  }
}
