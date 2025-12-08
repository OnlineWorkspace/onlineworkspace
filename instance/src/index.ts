import type { SubSystems } from "./subSystems.js";
import Log from "./log.js";
import ConfigurationSubsystem from "./subsystems/configuration.js";
import FilesystemSubsystem from "./subsystems/filesystem.js";
import NotificationsSubsystem from "./subsystems/notifications.js";
import UsersSubsystem from "./subsystems/users.js";
import ConsoleCommandsSubsytem from "./subsystems/consoleCommands.js";
import DatabaseSubsystem from "./subsystems/database.js";
import AuthorizationSubsystem from "./subsystems/authorization.js";
// https://github.com/cah4a/trpc-bun-adapter/blob/main/src/createBunHttpHandler.ts TODO: patch this and merge into the instance package
import type { BunWSClientCtx } from "trpc-bun-adapter";
import type { AnyRouter } from "@trpc/server";
import { createTRPCContext as createWorkspacesTRPCContext, workspacesRouter } from "./subsystems/trpcRouter.js";
import { type BunRequest, file } from "bun";
import ApplicationsSubsystem from "./subsystems/applications.js";
import path from "path";
import TRPCSubsystem from "./subsystems/trpc.js";
import chalk from "chalk";
import ImageSubsystem from "./subsystems/image.js";
import SettingsSubsystem from "./subsystems/settings.js";

export enum InstanceStatus {
    Online,
    Offline,
    StartingUp,
    Stopping,
}

class Instance {
    subSystems: SubSystems;
    log: Log;
    webServer!: Bun.Server<BunWSClientCtx<AnyRouter>>;
    status: InstanceStatus;

    constructor() {
        this.log = new Log(this);

        // @ts-ignore Don't know, don't care
        this.subSystems = {};

        this.subSystems.configuration = new ConfigurationSubsystem(this);
        this.subSystems.filesystem = new FilesystemSubsystem(this);
        this.subSystems.notifications = new NotificationsSubsystem(this);
        this.subSystems.consoleCommands = new ConsoleCommandsSubsytem(this);
        this.subSystems.database = new DatabaseSubsystem(this);
        this.subSystems.users = new UsersSubsystem(this);
        this.subSystems.authorization = new AuthorizationSubsystem(this);
        this.subSystems.applications = new ApplicationsSubsystem(this);
        this.subSystems.tRPC = new TRPCSubsystem(this);
        this.subSystems.image = new ImageSubsystem(this);
        this.subSystems.settings = new SettingsSubsystem(this);

        this.status = InstanceStatus.Offline;

        return this;
    }

    async startup() {
        this.log.system.info(`--------------------------------------------------------------------------`);
        this.log.system.info(`   ${chalk.hex("FF002E")(/XXX/)}${chalk.hex("70FF00")(/XXX/)}${chalk.hex("0066FF")(/XXX/)}`);
        this.log.system.info(
            `  ${chalk.hex("FF002E")(/XXX/)}${chalk.hex("70FF00")(/XXX/)}${chalk.hex("0066FF")(/XXX/)}  Workspaces © 2025 Tricolor Software -> https://tcsw.uk`,
        );
        this.log.system.info(` ${chalk.hex("FF002E")(/XXX/)}${chalk.hex("70FF00")(/XXX/)}${chalk.hex("0066FF")(/XXX/)}`);
        this.log.system.info(`--------------------------------------------------------------------------`);
        this.log.system.info(`Starting up...`);

        if (this.status !== InstanceStatus.Offline) {
            this.log.system.info("Cannot stop");
            return this;
        }

        for (const sys of Object.values(this.subSystems)) {
            let subSystemState = await sys.startup();

            if (subSystemState === true) {
                sys.log.success("Startup Complete...");
            } else {
                sys.log.error("Startup Failed!");
            }
        }

        const self = this;

        // TODO: fix this at some point
        // @ts-ignore
        this.webServer = Bun.serve(
            // TODO: change this so that multiple applications can have their own tRPC on separate routes e.g: /app/uk.tcsw.dashboard/trpc
            this.subSystems.tRPC.serve({
                routes: {
                    "/api/user/me/avatar/:size": {
                        GET: async (req: BunRequest) => {
                            const size = (req.params as { size: string }).size;

                            const cookieString = req.headers?.get("cookie");

                            if (cookieString === null) {
                                throw Response.json({ code: "UNAUTHORIZED", message: "missing auth cookie" });
                            }

                            const parsedCookie = Bun.Cookie.parse(cookieString);

                            let userId = await self.subSystems.authorization.verifySession(decodeURIComponent(parsedCookie.value));

                            if (userId === undefined) {
                                throw Response.json({ code: "UNAUTHORIZED", message: "invalid session" });
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
                                        file(path.join(self.subSystems.filesystem.FS_ROOT, `users/${userId}/assets/avatar/xs.png`)),
                                    );
                            }

                            return new Response(
                                file(path.join(self.subSystems.filesystem.FS_ROOT, `users/${userId}/assets/avatar/${size}.png`)),
                            );
                        },
                    },
                    "/api/application/:app/icon/": {
                        GET: async (req: BunRequest) => {
                            const app = (req.params as { app: string }).app;

                            const cookieString = req.headers?.get("cookie");

                            if (cookieString === null) {
                                throw Response.json({ code: "UNAUTHORIZED", message: "missing auth cookie" });
                            }

                            const parsedCookie = Bun.Cookie.parse(cookieString);

                            let userId = await self.subSystems.authorization.verifySession(decodeURIComponent(parsedCookie.value));

                            if (userId === undefined) {
                                throw Response.json({ code: "UNAUTHORIZED", message: "invalid session" });
                            }

                            let application = this.subSystems.applications.availableApplications.find((a) => a.manifest?.id === app);

                            if (!application) return Response.json({ code: "INTERNAL_ERROR", message: "Invalid application!" });

                            let applicationIconPath = path.join(application.path, application.manifest?.icon?.value || "");

                            return new Response(file(path.join(applicationIconPath)));
                        },
                    },
                    "/api/asset/image/:imageId": {
                        GET: async (req: BunRequest) => {
                            // @ts-ignore
                            let image = this.subSystems.image._internalImages.get(req.params["imageId"] as string);

                            if (!image) {
                                return new Response("Invalid image");
                            }

                            if (!image.public) {
                                const cookieString = req.headers?.get("cookie");

                                if (cookieString === null) {
                                    throw Response.json({ code: "UNAUTHORIZED", message: "missing auth cookie" });
                                }

                                const parsedCookie = Bun.Cookie.parse(cookieString);

                                let userId = await self.subSystems.authorization.verifySession(decodeURIComponent(parsedCookie.value));

                                if (userId === undefined) {
                                    throw Response.json({ code: "UNAUTHORIZED", message: "invalid session" });
                                }
                            }

                            return new Response(file(image.path));
                        },
                    },
                },
                fetch(_request, _server) {
                    // will be executed if it's not a TRPC request
                    return new Response("Unknown path");
                },
                development: this.subSystems.configuration.isDevMode,
            }),
        );

        this.subSystems.tRPC.registeredRouters.push({
            basePath: "/instance/workspaces/trpc",
            router: workspacesRouter,
            createContext: createWorkspacesTRPCContext(this),
        });

        this.log.system.success(`Listening for requests on port ${this.webServer.port}`);

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
        this.subSystems.consoleCommands.currentCommandInterface.active = true;
        this.subSystems.consoleCommands.currentCommandInterface.cb = () => 0;
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
