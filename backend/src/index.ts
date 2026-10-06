// https://github.com/cah4a/trpc-bun-adapter/blob/main/src/createBunHttpHandler.ts TODO: patch this and merge into the instance package
import Log, { LogMessageStyle } from "./log.ts";
import type System from "./system.ts";
import type { Sys } from "./system.ts";
import ApiSystem from "./systems/api.ts";
import ApplicationsSystem from "./systems/applications.ts";
import AuthorizationSystem from "./systems/authorization.ts";
import ConfigurationSystem from "./systems/configuration.ts";
import ConsoleCommandsSystem from "./systems/consoleCommands.ts";
import DatabaseSystem from "./systems/database.ts";
import { testPostgresConnection } from "./systems/databaseCheck.ts";
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
import AuthenticationSystem from "./systems/authentication.ts";
import UploadSystem from "./systems/upload.ts";
import AuditSystem from "./systems/audit.ts";
import UpdatesSystem from "./systems/updates.ts";
import BackupSystem from "./systems/backup.ts";
import SecuritySystem from "./systems/security.ts";

export enum InstanceStatus {
  Online,
  Offline,
  StartingUp,
  Stopping,
}

/**
 * - `setup` only runs what the setup wizard needs to get as far as configuring the database
 * - `full` runs every system
 * - `auto` picks one of the above on startup, `setup` when the instance is not set up and the database cannot be used
 */
export type InstanceMode = "auto" | "setup" | "full";

class Instance {
  sys: Sys;
  log: Log;
  status: InstanceStatus;
  mode: InstanceMode;

  versionString: string = "Pre-Alpha 0.1.0";

  /** systems handed over from the instance this one replaced, they keep running and are not started again */
  private adopted: Set<System> = new Set();

  /**
   * @param previous the instance being replaced by a restart, its log, console and web frontend carry over
   */
  constructor(mode: InstanceMode = "auto", previous?: Instance) {
    this.mode = mode;
    // the log takes over the global console so there can only ever be one
    this.log = previous?.log ?? new Log(this);
    this.log.instance = this;

    // @ts-ignore Don't know, don't care
    this.sys = {};

    // the systems everything else needs, these are also what decides the mode
    this.sys.event = new EventSystem(this);
    this.sys.filesystem = new FilesystemSystem(this);
    this.sys.configuration = new ConfigurationSystem(this);

    if (previous) {
      this.adoptSystem(previous.sys.terminal);
      this.adoptSystem(previous.sys.webFrontend);
    }

    this.status = InstanceStatus.Offline;

    if (!previous) {
      process.on("SIGINT", async () => {
        await (globalThis as unknown as { INSTANCE: Instance }).INSTANCE.shutdown("Console Admin Ctrl+C");
      });
    }
  }

  private adoptSystem(system: System) {
    system.instance = this;
    this.adopted.add(system);
    this.sys[system.id === "web_frontend" ? "webFrontend" : system.id] = system;
  }

  /** Creates the systems for a mode, the order is the order they start up in. */
  private createSystems(mode: "setup" | "full") {
    const adopted = (id: string) => [...this.adopted].find((s) => s.id === id);
    const full = mode === "full";

    this.sys.security = new SecuritySystem(this);
    if (full) this.sys.database = new DatabaseSystem(this);
    this.sys.notifications = new NotificationsSystem(this);
    this.sys.consoleCommands = new ConsoleCommandsSystem(this);
    if (full) {
      this.sys.users = new UsersSystem(this);
      this.sys.authorization = new AuthorizationSystem(this);
      this.sys.audit = new AuditSystem(this);
      this.sys.authentication = new AuthenticationSystem(this);
      this.sys.applications = new ApplicationsSystem(this);
    }
    this.sys.tRPC = new TRPCSystem(this);
    if (full) {
      this.sys.image = new ImageSystem(this);
      this.sys.settings = new SettingsSystem(this);
    }
    this.sys.webFrontend ??= (adopted("web_frontend") as WebFrontendSystem) ?? new WebFrontendSystem(this);
    if (full) {
      this.sys.email = new EmailSystem(this);
      this.sys.reverseProxy = new ReverseProxySystem(this);
    }
    this.sys.terminal ??= (adopted("terminal") as TerminalUISystem) ?? new TerminalUISystem(this);
    this.sys.api = new ApiSystem(this);
    if (full) this.sys.upload = new UploadSystem(this);
    if (full) this.sys.backup = new BackupSystem(this);
    if (full) this.sys.updates = new UpdatesSystem(this);
  }

  private async startSystem(sys: System) {
    if (this.adopted.has(sys)) return;

    const subSystemState = await sys.startup();

    if (subSystemState) {
      this.log.system.success(`System '${sys.id}' startup complete!`);
    } else {
      this.log.system.error(`System '${sys.id}' startup failed!`);
    }
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
      await this.startSystem(sys);
    }

    if (this.mode === "auto") {
      // an instance which has not been set up yet is allowed to have no usable database, setting it up is part of the wizard
      const database = this.sys.configuration.setupComplete ? undefined : await testPostgresConnection(this.sys.configuration.databases.postgres);
      this.mode = database && !database.ok ? "setup" : "full";

      if (this.mode === "setup") this.log.system.warning(`The database cannot be used (${database && !database.ok ? database.error : "unknown"}), starting in setup mode.`);
    }

    const startedSystems = new Set(Object.values(this.sys));
    this.createSystems(this.mode as "setup" | "full");

    for (const sys of Object.values(this.sys)) {
      if (!startedSystems.has(sys)) await this.startSystem(sys);
    }

    if (this.mode === "full") {
      // a frontend which was started in setup mode is missing the applications
      await this.sys.webFrontend.applicationsReady();

      this.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
        this.sys.settings.registerApplicationSetting(
          new StringListApplicationSetting("core", "quick_shortcuts", this.sys.configuration.defaultQuickShortcuts).setDisplayName("Quick Shortcuts"),
        );
      });

      this.sys.event.invoke(WorkspacesEvent.BeforeStartupComplete);
    }

    this.log.system.info(`Startup complete (${this.mode} mode)`);
    this.status = InstanceStatus.Online;

    // last, so it is the last thing in the console rather than scrolling away behind the startup messages
    this.sys.configuration.printSetupToken();

    this.sys.event.invoke(WorkspacesEvent.StartupComplete)

    return this;
  }

  /**
   * Stops this instance's systems and starts a new instance in its place, within the same process.
   * The console and the web frontend keep running throughout.
   */
  async restart(mode: Exclude<InstanceMode, "auto"> | "auto" = "auto") {
    this.log.system.info(`Restarting into ${mode} mode...`);
    this.status = InstanceStatus.Stopping;

    const kept = new Set<System>([this.sys.terminal, this.sys.webFrontend]);

    for (const sys of Object.values(this.sys)) {
      if (kept.has(sys)) continue;

      if (!(await sys.stop())) this.log.system.error(`System '${sys.id}' shutdown failed! (The restart will still continue)`);
    }

    this.status = InstanceStatus.Offline;

    const next = new Instance(mode, this);
    // @ts-ignore - this does exist and is defined in globals.d.ts
    global.INSTANCE = next;
    // the console stops the process with whichever instance is current
    next.sys.event.on(WorkspacesEvent.BeforeShutdown, () => next.sys.terminal.stop());

    await next.startup();

    return next;
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
// @ts-ignore - this does exist and is defined in globals.d.ts
global.INSTANCE = INSTANCE;
export default INSTANCE;

await INSTANCE.startup();
