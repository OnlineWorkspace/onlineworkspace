import type { Sys } from "./system.js";
import Log from "./log.js";
import ConfigurationSystem from "./systems/configuration.js";
import FilesystemSystem from "./systems/filesystem.js";
import NotificationsSystem from "./systems/notifications.js";
import UsersSystem from "./systems/users.js";
import ConsoleCommandsSystem from "./systems/consoleCommands.js";
import DatabaseSystem from "./systems/database.js";
import AuthorizationSystem from "./systems/authorization.js";
// https://github.com/cah4a/trpc-bun-adapter/blob/main/src/createBunHttpHandler.ts TODO: patch this and merge into the instance package
import type { BunWSClientCtx } from "trpc-bun-adapter";
import type { AnyRouter } from "@trpc/server";
import { createTRPCContext as createWorkspacesTRPCContext, workspacesRouter } from "./systems/trpcRouter.js";
import { type BunRequest, file } from "bun";
import ApplicationsSystem from "./systems/applications.js";
import path from "path";
import TRPCSystem from "./systems/trpc.js";
import chalk from "chalk";
import ImageSystem from "./systems/image.js";
import SettingsSystem from "./systems/settings.js";
import WebFrontendSystem from "./systems/webFrontend.js";
import { promises as fs } from "fs";
import EmailSystem from "./systems/email.js";
import EventSystem, { WorkspacesEvent } from "./systems/events.js";

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
        this.sys.notifications = new NotificationsSystem(this);
        this.sys.consoleCommands = new ConsoleCommandsSystem(this);
        this.sys.database = new DatabaseSystem(this);
        this.sys.users = new UsersSystem(this);
        this.sys.authorization = new AuthorizationSystem(this);
        this.sys.applications = new ApplicationsSystem(this);
        this.sys.tRPC = new TRPCSystem(this);
        this.sys.image = new ImageSystem(this);
        this.sys.settings = new SettingsSystem(this);
        this.sys.webFrontend = new WebFrontendSystem(this);
        this.sys.email = new EmailSystem(this);

        this.status = InstanceStatus.Offline;

        return this;
    }

    async startup() {
        this.log.system.info(`--------------------------------------------------------------------------`);
        this.log.system.info(
            `   ${chalk.hex("FF002E")("/XXX/")}${chalk.hex("70FF00")("/XXX/")}${chalk.hex("0066FF")("/XXX/")}`,
        );
        this.log.system.info(
            `  ${chalk.hex("FF002E")("/XXX/")}${chalk.hex("70FF00")("/XXX/")}${chalk.hex("0066FF")("/XXX/")}  Workspaces © 2026 Tricolor Software -> https://tcsw.uk`,
        );
        this.log.system.info(
            ` ${chalk.hex("FF002E")("/XXX/")}${chalk.hex("70FF00")("/XXX/")}${chalk.hex("0066FF")("/XXX/")}`,
        );
        this.log.system.info(`--------------------------------------------------------------------------`);
        this.log.system.info(`Starting up...`);

        if (this.status !== InstanceStatus.Offline) {
            this.log.system.info("Cannot stop");
            return this;
        }

        for (const sys of Object.values(this.sys)) {
            let subSystemState = await sys.startup();

            if (subSystemState) {
                sys.log.success(`Startup Complete...`);
            } else {
                sys.log.error(`Startup Failed!`);
            }
        }

        this.sys.event.invoke(WorkspacesEvent.BeforeStartupComplete);

        const self = this;

        // @ts-ignore
        this.webServer = Bun.serve(
            this.sys.tRPC.serve({
                routes: {
                    "/api/instance/login/banner": {
                        GET: async (req: BunRequest) => {
                            return new Response(
                                file(path.join(self.sys.filesystem.FS_ROOT, "assets/login/banner.png")),
                            );
                        },
                    },
                    "/api/instance/login/background": {
                        GET: async (req: BunRequest) => {
                            return new Response(
                                file(path.join(self.sys.filesystem.FS_ROOT, "assets/login/background.png")),
                            );
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

                            let userId = await self.sys.authorization.verifySession(
                                decodeURIComponent(parsedCookie.value),
                            );

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
                                    // do nothing
                                    break;
                                default:
                                    return new Response(
                                        file(
                                            path.join(
                                                self.sys.filesystem.FS_ROOT,
                                                `users/${userId}/assets/avatar/xs.png`,
                                            ),
                                        ),
                                    );
                            }

                            return new Response(
                                file(
                                    path.join(self.sys.filesystem.FS_ROOT, `users/${userId}/assets/avatar/${size}.png`),
                                ),
                            );
                        },
                    },
                    "/api/application/:app/icon/": {
                        GET: async (req: BunRequest) => {
                            const app = (req.params as { app: string }).app;

                            const cookieString = req.headers?.get("cookie");

                            if (cookieString === null) {
                                return Response.json({
                                    code: "UNAUTHORIZED",
                                    message: "missing auth cookie",
                                });
                            }

                            const parsedCookie = Bun.Cookie.parse(cookieString);

                            let userId = await self.sys.authorization.verifySession(
                                decodeURIComponent(parsedCookie.value),
                            );

                            if (userId === undefined) {
                                return Response.json({
                                    code: "UNAUTHORIZED",
                                    message: "invalid session",
                                });
                            }

                            let application = this.sys.applications.availableApplications.find(
                                (a) => a.manifest?.id === app,
                            );

                            if (!application)
                                return Response.json({
                                    code: "INTERNAL_ERROR",
                                    message: "Invalid application!",
                                });

                            let applicationIconPath = path.join(
                                application.path,
                                application.manifest?.icon?.value || "",
                            );

                            return new Response(file(path.join(applicationIconPath)));
                        },
                    },
                    "/api/asset/image/:imageId/:resolution": {
                        GET: async (req: BunRequest) => {
                            let image = this.sys.image._internalImages.get(
                                // @ts-ignore
                                req.params["imageId"] as string,
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

                                let userId = await self.sys.authorization.verifySession(
                                    decodeURIComponent(parsedCookie.value),
                                );

                                if (userId === undefined) {
                                    return Response.json({
                                        code: "UNAUTHORIZED",
                                        message: "invalid session",
                                    });
                                }
                            }

                            // @ts-ignore
                            const resolutionParam = req.params["resolution"] as string;

                            let sourceImage = image[resolutionParam];

                            if (!sourceImage) {
                                return Response.json({
                                    code: "NOT_FOUND",
                                    message: "missing image",
                                });
                            }

                            if (resolutionParam === "raw") {
                                this.sys.image.log.info(
                                    `Served Image -> '${(req.params as { imageId: string })["imageId"]} @ ${resolutionParam}'`,
                                );
                                return new Response(file(sourceImage.path), {
                                    headers: {
                                        "Access-Control-Allow-Origin": "http://localhost:5173", // TODO: change this according to a config file
                                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                                        "Access-Control-Allow-Headers": "Content-Type, Authorization",
                                        "Access-Control-Allow-Credentials": "true",
                                    },
                                });
                            } else {
                                const outputPath = path.join(
                                    this.sys.filesystem.CACHE_PATH,
                                    sourceImage.path,
                                    resolutionParam,
                                );

                                // FIXME!: IF THE IMAGE AT THE SOURCE PATH IS REPLACED WITH ANOTHER, IT WILL CONTINUE TO SEND THE OLD IMAGE
                                if (await fs.exists(outputPath)) {
                                    this.sys.image.log.info(
                                        `Served Image -> '${(req.params as { imageId: string })["imageId"]} @ ${resolutionParam}'`,
                                    );
                                    return new Response(file(outputPath), {
                                        headers: {
                                            "Access-Control-Allow-Origin": "http://localhost:5173", // TODO: change this according to a config file
                                            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                                            "Access-Control-Allow-Headers": "Content-Type, Authorization",
                                            "Access-Control-Allow-Credentials": "true",
                                        },
                                    });
                                }

                                if (!(await fs.exists(path.join(outputPath, "..")))) {
                                    await fs.mkdir(path.join(outputPath, ".."), {
                                        recursive: true,
                                    });
                                }

                                await this.sys.image.resizeImage(
                                    sourceImage.path,
                                    outputPath,
                                    sourceImage.resize!.dimensions,
                                    sourceImage.resize!,
                                );

                                this.sys.image.log.info(
                                    `Served Image -> '${(req.params as { imageId: string })["imageId"]} @ ${resolutionParam}'`,
                                );
                                return new Response(file(outputPath), {
                                    headers: {
                                        "Access-Control-Allow-Origin": "http://localhost:5173", // TODO: change this according to a config file
                                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                                        "Access-Control-Allow-Headers": "Content-Type, Authorization",
                                        "Access-Control-Allow-Credentials": "true",
                                    },
                                });
                            }
                        },
                    },
                    "/api/asset/raw/:assetId": {
                        GET: async (req: BunRequest) => {
                            let asset = this.sys.filesystem._internalAssets.get(
                                // @ts-ignore
                                req.params["assetId"] as string,
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

                                let userId = await self.sys.authorization.verifySession(
                                    decodeURIComponent(parsedCookie.value),
                                );

                                if (userId === undefined) {
                                    return Response.json({
                                        code: "UNAUTHORIZED",
                                        message: "invalid session",
                                    });
                                }
                            }

                            return new Response(file(asset.path), {
                                headers: {
                                    "Access-Control-Allow-Origin": "http://localhost:5173", // TODO: change this according to a config file
                                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                                    "Access-Control-Allow-Credentials": "true",
                                },
                            });
                        },
                    },
                },
                fetch(_request, _server) {
                    // will be executed if it's not a TRPC request
                    return new Response("Unknown path");
                },
                development: this.sys.configuration.isDevMode,
            }),
        );

        this.sys.tRPC.registeredRouters.push({
            basePath: "/instance/workspaces/trpc",
            router: workspacesRouter,
            createContext: createWorkspacesTRPCContext(this),
        });

        this.log.system.success(`Listening for http requests on port ${this.webServer.port}`);

        this.log.system.info("Startup complete");

        return this;
    }

    async promptForRestart(reason: string): Promise<this> {
        this.log.system.warning(
            `Hey Server Admin, THE INSTANCE HAS BEEN PROMPTED FOR RESTART DUE TO '${reason}' please restart when possible.`,
        );
        return this;
    }

    async shutdown() {
        this.sys.consoleCommands.currentCommandInterface.active = true;
        this.sys.consoleCommands.currentCommandInterface.cb = () => 0;
        this.log.system.info("Shutting down...");

        if (!!process.stdout.cursorTo) {
            process.stdout.cursorTo(0, 0);
            process.stdout.clearScreenDown();
            process.stdout.cursorTo(0, 0);
        }

        const goodbye = [
            "Goodbye!",
            "Chao",
            "Salut",
            "Ciao",
            "Tschüss",
            "じゃあね",
            "拜拜",
            "Tchau",
            "Пока",
            "잘 가",
            "Hej då",
            "Doei",
            "Γεια",
            "Na razie",
            "Güle güle",
            "Adeus",
            "Tot ziens",
            "Hẹn gặp lại",
        ];

        process.stdout.write("Shutdown completed! -> ");
        process.stdout.write(goodbye[Math.floor(Math.random() * goodbye.length)]);
        process.stdout.write(" 👋\n");
        process.exit(0);
    }
}

// @ts-ignore
export type { Instance };

const INSTANCE = new Instance();
export default INSTANCE;

await INSTANCE.startup();
