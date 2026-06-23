// https://github.com/cah4a/trpc-bun-adapter/blob/main/src/createBunHttpHandler.ts TODO: patch this and merge into the instance package
import Log, { LogMessageStyle } from "./log.ts";
import type { Sys } from "./system.ts";
import ApiSystem from "./systems/api.ts";
import ApplicationsSystem from "./systems/applications.ts";
import AuthorizationSystem from "./systems/authorization.ts";
import ConfigurationSystem from "./systems/configuration.ts";
import ConsoleCommandsSystem from "./systems/consoleCommands.ts";
import DatabaseSystem from "./systems/database.ts";
import EmailSystem from "./systems/email.ts";
import EventSystem, { WorkspacesEvent } from "./systems/events.ts";
import FilesystemSystem from "./systems/filesystem.ts";
import ImageSystem from "./systems/image.ts";
import NotificationsSystem from "./systems/notifications.ts";
import ReverseProxySystem from "./systems/reverseProxy.ts";
import { StringListApplicationSetting } from "./systems/settings/applicationSetting/stringListSetting.ts";
import SettingsSystem from "./systems/settings.ts";
import TerminalUISystem from "./systems/terminal.ts";
import TRPCSystem from "./systems/trpc.ts";
import UsersSystem from "./systems/users.ts";
import WebFrontendSystem from "./systems/webFrontend.ts";

export enum InstanceStatus {
  Online,
  Offline,
  StartingUp,
  Stopping,
}

class Instance {
  sys: Sys;
  log: Log;
  status: InstanceStatus;

  versionString: string = "Pre-Alpha 0.1.0";

  constructor() {
    this.log = new Log(this);

    // @ts-ignore Don't know, don't care
    this.sys = {};

    this.sys.event = new EventSystem(this);
    this.sys.filesystem = new FilesystemSystem(this);
    this.sys.configuration = new ConfigurationSystem(this);
    this.sys.database = new DatabaseSystem(this);
    this.sys.notifications = new NotificationsSystem(this);
    this.sys.consoleCommands = new ConsoleCommandsSystem(this);
    this.sys.users = new UsersSystem(this);
    this.sys.authorization = new AuthorizationSystem(this);
    this.sys.applications = new ApplicationsSystem(this);
    this.sys.tRPC = new TRPCSystem(this);
    this.sys.image = new ImageSystem(this);
    this.sys.settings = new SettingsSystem(this);
    this.sys.webFrontend = new WebFrontendSystem(this);
    this.sys.email = new EmailSystem(this);
    this.sys.reverseProxy = new ReverseProxySystem(this);
    this.sys.terminal = new TerminalUISystem(this);
    this.sys.api = new ApiSystem(this);

    this.status = InstanceStatus.Offline;

    Deno.addSignalListener("SIGINT", async () => {
      await this.shutdown("Console Admin Ctrl+C");
    });
  }

  async startup() {
    const BRANDING_MESSAGE = `Online Workspace © 2026 Ewsgit <https://ewsgit.uk>`;
    this.log.system.info(`${LogMessageStyle.CUSTOM}242,106,141,255${LogMessageStyle.END_CUSTOM}${"─".repeat(BRANDING_MESSAGE.length + 2)}`);
    this.log.system.info(` ${BRANDING_MESSAGE}`);
    this.log.system.info(`${LogMessageStyle.CUSTOM}242,106,141,255${LogMessageStyle.END_CUSTOM}${"─".repeat(BRANDING_MESSAGE.length + 2)}`);
    this.log.system.info(`Starting up...`);

    if (this.status !== InstanceStatus.Offline) {
      this.log.system.info("Cannot stop");
      return this;
    }

    for (const sys of Object.values(this.sys)) {
      const subSystemState = await sys.startup();

      if (subSystemState) {
        this.log.system.success(`System '${sys.id}' startup complete!`);
      } else {
        this.log.system.error(`System '${sys.id}' startup failed!`);
      }
    }

    this.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
      this.sys.settings.registerApplicationSetting(
        new StringListApplicationSetting("core", "quick_shortcuts", this.sys.configuration.defaultQuickShortcuts).setDisplayName("Quick Shortcuts"),
      );
    });

    this.sys.event.invoke(WorkspacesEvent.BeforeStartupComplete);

    this.log.system.info("Startup complete");
    this.status = InstanceStatus.Online;

    this.sys.event.invoke(WorkspacesEvent.StartupComplete)

    return this;
  }

  async promptForRestart(reason: string): Promise<this> {
    this.log.system.warning(`Hey Server Admin, THE INSTANCE HAS BEEN PROMPTED FOR RESTART DUE TO '${reason}' please restart when possible.`);
    return this;
  }

  async shutdown(cause?: string) {
    this.log.system.info(`Shutting down... ${cause !== undefined ? `(Caused by: ${cause})` : ""}`);
    this.status = InstanceStatus.Stopping;

    this.sys.event.invoke(WorkspacesEvent.BeforeShutdown);

    this.status = InstanceStatus.Offline;

    for (const sys of Object.values(this.sys)) {
      const subSystemState = await sys.stop();

      if (subSystemState) {
        this.log.system.success(`System '${sys.id}' shutdown successfully!`);
      } else {
        this.log.system.error(`System '${sys.id}' shutdown failed! (Shutdown will still continue)`);
      }
    }

    this.log.system.info("Shutdown complete!\n");
    process.exit(0);
  }
}

export type { Instance };

const INSTANCE = new Instance();
global.INSTANCE = INSTANCE;
export default INSTANCE;

await INSTANCE.startup();
