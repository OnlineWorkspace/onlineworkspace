import { promises as fs, existsSync as fsExistsSync } from "node:fs";
import path from "node:path";
import type { AnyRouter } from "@trpc/server";
import { type BunRequest, file } from "bun";
import chalk from "chalk";
// https://github.com/cah4a/trpc-bun-adapter/blob/main/src/createBunHttpHandler.ts TODO: patch this and merge into the instance package
import type { BunWSClientCtx } from "trpc-bun-adapter";
import Log from "./log.js";
import type { Sys } from "./system.js";
import ApplicationsSystem from "./systems/applications.js";
import AuthorizationSystem from "./systems/authorization.js";
import ConfigurationSystem from "./systems/configuration.js";
import ConsoleCommandsSystem from "./systems/consoleCommands.js";
import DatabaseSystem from "./systems/database.js";
import EmailSystem from "./systems/email.js";
import EventSystem, { WorkspacesEvent } from "./systems/events.js";
import FilesystemSystem from "./systems/filesystem.js";
import ImageSystem from "./systems/image.js";
import NotificationsSystem from "./systems/notifications.js";
import { StringListApplicationSetting } from "./systems/settings/applicationSetting/stringListSetting.js";
import SettingsSystem from "./systems/settings.js";
import TRPCSystem from "./systems/trpc.js";
import { createTRPCContext as createWorkspacesTRPCContext, workspacesRouter } from "./systems/trpcRouter.js";
import UsersSystem from "./systems/users.js";
import WebFrontendSystem from "./systems/webFrontend.js";
import {cache} from "sharp";

export enum InstanceStatus {
  Online,
  Offline,
  StartingUp,
  Stopping,
}

class Instance {
  sys: Sys;
  log: Log;
  webServer!: Bun.Server<BunWSClientCtx<AnyRouter>>;
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
        sys.log.success(`System Startup Complete!`);
      } else {
        sys.log.error(`System Startup Failed!`);
      }
    }

    this.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
      this.sys.settings.registerApplicationSetting(
        new StringListApplicationSetting("core", "quick_shortcuts", this.sys.configuration.defaultQuickShortcuts).setDisplayName("Quick Shortcuts"),
      );
    });

    this.sys.event.invoke(WorkspacesEvent.BeforeStartupComplete);

    // @ts-ignore
    this.webServer = Bun.serve(
      this.sys.tRPC.serve({
        routes: {
          "/api/instance/login/banner": {
            GET: async (_: BunRequest) => {
              return new Response(file(path.join(this.sys.filesystem.FS_ROOT, "assets/login/banner.png")));
            },
          },
          "/api/instance/login/background": {
            GET: async (_: BunRequest) => {
              return new Response(file(path.join(this.sys.filesystem.FS_ROOT, "assets/login/background.png")));
            },
          },
          "/api/user/me/avatar/:size": {
            GET: async (req: BunRequest) => {
              const size = (req.params as { size: string }).size;

              const cookieString = req.headers?.get("cookie");

              if (cookieString === null) {
                return Response.json({
                  code: "UNAUTHORIZED",
                  message: "missing auth cookie",
                });
              }

              const parsedCookie = Bun.Cookie.parse(cookieString);

              const userId = await this.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

              if (userId === undefined) {
                return Response.json({
                  code: "UNAUTHORIZED",
                  message: "invalid session",
                });
              }

              switch (size) {
                case "xs":
                case "s":
                case "m":
                case "l":
                case "xl":
                case "2xl":
                  return new Response(file(path.join(this.sys.filesystem.FS_ROOT, `users/${userId}/assets/avatar/${size}.webp`)));
                default:
                  return new Response(file(path.join(this.sys.filesystem.FS_ROOT, `users/${userId}/assets/avatar/xs.webp`)));
              }
            },
          },
          "/api/application/:app/icon/": {
            GET: async (req: BunRequest) => {
              const app = (req.params as { app: string }).app;

              const cookieString = req.headers?.get("cookie");

              if (cookieString === null) {
                this.log.system.warning("Missing auth cookie in request for application icon");

                return Response.json({
                  code: "UNAUTHORIZED",
                  message: "missing auth cookie",
                });
              }

              const parsedCookie = Bun.Cookie.parse(cookieString);

              const userId = await this.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

              if (userId === undefined) {
                this.log.system.warning("Invalid session in request for application icon");

                return Response.json({
                  code: "UNAUTHORIZED",
                  message: "invalid session",
                });
              }

              const application = this.sys.applications.availableApplications.find((a) => a.manifest?.id === app);

              if (!application)
                return Response.json({
                  code: "INTERNAL_ERROR",
                  message: "Invalid application!",
                });

              const applicationIconPath = path.join(application.path, application.manifest?.icon?.value || "");

              return new Response(file(applicationIconPath));
            },
          },
          "/api/asset/image/:imageId/:resolution": {
            GET: async (req: BunRequest) => {
              const image = this.sys.image._internalImages.get(
                // @ts-ignore
                req.params.imageId as string,
              );

              if (!image) {
                return new Response("Invalid image");
              }

              if (!image.public) {
                const cookieString = req.headers?.get("cookie");

                if (cookieString === null) {
                  return Response.json({
                    code: "UNAUTHORIZED",
                    message: "missing auth cookie",
                  });
                }

                const parsedCookie = Bun.Cookie.parse(cookieString);

                const userId = await this.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

                if (userId === undefined) {
                  return Response.json({
                    code: "UNAUTHORIZED",
                    message: "invalid session",
                  });
                }
              }

              // @ts-ignore
              const resolutionParam = req.params.resolution as string;

              const sourceImage = image[resolutionParam];

              if (!sourceImage) {
                return Response.json({
                  code: "NOT_FOUND",
                  message: "missing image",
                });
              }

              if (resolutionParam === "raw") {
                this.sys.image.log.info(`Served Image -> '${(req.params as { imageId: string }).imageId} @ ${resolutionParam}'`);
                return new Response(file(sourceImage.path));
              } else {
                const cachedFilePath = path.join(this.sys.filesystem.CACHE_PATH, sourceImage.path.replaceAll(":", ""))
                const outputPath = path.join(cachedFilePath, resolutionParam);
                const hashPath = path.join(`${outputPath}.hash`)

                if (fsExistsSync(outputPath)) {
                  const fileHash = Bun.hash.rapidhash(await fs.readFile(sourceImage.path)).toString()
                  const cacheFileHash = (await fs.readFile(hashPath)).toString()

                  if (fileHash === cacheFileHash) {
                    this.sys.image.log.info(`Served Image -> '${(req.params as { imageId: string }).imageId} @ ${resolutionParam}'`);
                    return new Response(file(outputPath));
                  }
                }

                if (!fsExistsSync(path.join(outputPath, ".."))) {
                  await fs.mkdir(path.join(outputPath, ".."), {
                    recursive: true,
                  });
                }

                const fileHash = Bun.hash.rapidhash(await fs.readFile(sourceImage.path)).toString()
                await this.sys.image.resizeImage(sourceImage.path, outputPath, sourceImage.resize!.dimensions, sourceImage.resize!);
                await fs.writeFile(hashPath, fileHash)

                this.sys.image.log.info(`Served Image -> '${(req.params as { imageId: string }).imageId} @ ${resolutionParam}'`);
                return new Response(file(outputPath));
              }
            },
          },
          "/api/asset/raw/:assetId": {
            GET: async (req: BunRequest) => {
              const asset = this.sys.filesystem._internalAssets.get(
                // @ts-ignore
                req.params.assetId as string,
              );

              if (!asset) {
                return new Response("Invalid raw asset");
              }

              if (!asset.public) {
                const cookieString = req.headers?.get("cookie");

                if (cookieString === null) {
                  return Response.json({
                    code: "UNAUTHORIZED",
                    message: "missing auth cookie",
                  });
                }

                const parsedCookie = Bun.Cookie.parse(cookieString);

                const userId = await this.sys.authorization.verifySession(decodeURIComponent(parsedCookie.value));

                if (userId === undefined) {
                  return Response.json({
                    code: "UNAUTHORIZED",
                    message: "invalid session",
                  });
                }
              }

              return new Response(file(asset.path));
            },
          },
        },
        fetch() {
          // will be executed if it's not a TRPC request
          return new Response("Unknown path");
        },
        development: this.sys.configuration.isDevMode,
      }),
    );

    this.sys.tRPC.registeredRouters.push({
      basePath: "/api/trpc",
      router: workspacesRouter,
      createContext: createWorkspacesTRPCContext(this),
    });

    this.log.system.success(`Listening for http requests on port ${this.webServer.port}`);

    this.log.system.info("Startup complete");
    this.status = InstanceStatus.Online

    return this;
  }

  async promptForRestart(reason: string): Promise<this> {
    this.log.system.warning(`Hey Server Admin, THE INSTANCE HAS BEEN PROMPTED FOR RESTART DUE TO '${reason}' please restart when possible.`);
    return this;
  }

  async shutdown() {
    this.status = InstanceStatus.Stopping
    this.sys.consoleCommands.currentCommandInterface.active = true;
    this.sys.consoleCommands.currentCommandInterface.cb = () => 0;
    this.log.system.info("Shutting down...");

    this.sys.event.invoke(WorkspacesEvent.BeforeShutdown);
    this.status = InstanceStatus.Offline

    if (process.stdout.cursorTo) {
      process.stdout.cursorTo(0, 0);
      process.stdout.clearScreenDown();
      process.stdout.cursorTo(0, 0);
    }

    process.stdout.write("Shutdown complete!\n");
    process.exit(0);
  }
}

// @ts-ignore
export type { Instance };

const INSTANCE = new Instance();
export default INSTANCE;

await INSTANCE.startup();
