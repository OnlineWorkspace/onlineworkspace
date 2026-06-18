import chalk from "chalk";
// https://github.com/cah4a/trpc-bun-adapter/blob/main/src/createBunHttpHandler.ts TODO: patch this and merge into the instance package
import Log from "./log.ts";
import type { Sys } from "./system.ts";
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
import TerminalUISystem from "./systems/terminalUI.ts";
import TRPCSystem from "./systems/trpc.ts";
import { createTRPCContext as createWorkspacesTRPCContext, workspacesRouter } from "./systems/trpcRouter.ts";
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
  webServer!: Deno.HttpServer<Deno.NetAddr>;
  status: InstanceStatus;

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
    this.sys.terminalUI = new TerminalUISystem(this);

    this.status = InstanceStatus.Offline;
  }

  async startup() {
    this.log.system.info(`=======================================================================`);
    this.log.system.info(`   ${chalk.hex("FF002E")("/XXX/")}${chalk.hex("70FF00")("/XXX/")}${chalk.hex("0066FF")("/XXX/")}`);
    this.log.system.info(
      `  ${chalk.hex("FF002E")("/XXX/")}${chalk.hex("70FF00")("/XXX/")}${chalk.hex("0066FF")("/XXX/")}  Online Workspace © 2026 Ewsgit -> https://ewsgit.uk`,
    );
    this.log.system.info(` ${chalk.hex("FF002E")("/XXX/")}${chalk.hex("70FF00")("/XXX/")}${chalk.hex("0066FF")("/XXX/")}`);
    this.log.system.info(`=======================================================================`);
    this.log.system.info(`Starting up...`);

    if (this.status !== InstanceStatus.Offline) {
      this.log.system.info("Cannot stop");
      return this;
    }

    for (const sys of Object.values(this.sys)) {
      const subSystemState = await sys.startup();

      if (subSystemState) {
        this.log.system.success(`System '${sys.id}' Startup Complete!`);
      } else {
        this.log.system.error(`System '${sys.id}' Startup Failed!`);
      }
    }

    this.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
      this.sys.settings.registerApplicationSetting(
        new StringListApplicationSetting("core", "quick_shortcuts", this.sys.configuration.defaultQuickShortcuts).setDisplayName("Quick Shortcuts"),
      );
    });

    this.sys.event.invoke(WorkspacesEvent.BeforeStartupComplete);

    // this.webServer = Deno.serve(route(, () => {})
    //   // this.sys.tRPC.serve({
    //   //   routes: {

    //   //   },
    //   //   fetch() {
    //   //     // will be executed if it's not a TRPC request
    //   //     return new Response("Unknown path");
    //   //   },
    //   //   development: this.sys.configuration.isDevMode,
    //   // }),
    // );

    this.sys.tRPC.registeredRouters.push({
      basePath: "/api/trpc",
      router: workspacesRouter,
      createContext: createWorkspacesTRPCContext(this),
    });

    // this.log.system.success(`Listening for http requests on port ${this.webServer.port}`);

    this.log.system.info("Startup complete");
    this.status = InstanceStatus.Online;

    return this;
  }

  async promptForRestart(reason: string): Promise<this> {
    this.log.system.warning(`Hey Server Admin, THE INSTANCE HAS BEEN PROMPTED FOR RESTART DUE TO '${reason}' please restart when possible.`);
    return this;
  }

  async shutdown() {
    this.status = InstanceStatus.Stopping;
    this.sys.consoleCommands.currentCommandInterface.active = true;
    this.sys.consoleCommands.currentCommandInterface.cb = () => 0;
    this.log.system.info("Shutting down...");

    this.sys.event.invoke(WorkspacesEvent.BeforeShutdown);
    this.status = InstanceStatus.Offline;

    if (process.stdout.cursorTo) {
      process.stdout.cursorTo(0, 0);
      process.stdout.clearScreenDown();
      process.stdout.cursorTo(0, 0);
    }

    process.stdout.write("Shutdown complete!\n");
    process.exit(0);
  }
}

export type { Instance };

const INSTANCE = new Instance();
export default INSTANCE;

await INSTANCE.startup();
