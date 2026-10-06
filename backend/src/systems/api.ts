import {existsSync} from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type {Server} from "bun";
import {type Instance, InstanceStatus} from "../index.ts";
import System from "../system.ts";
import {getCookies} from "../utils/cookies.ts";
import {clientIp} from "../utils/network.ts";
import {NOTIFICATIONS_WEBSOCKET_PATH} from "./notifications.ts";

export interface Route {
    method?: string | string[];
    pattern: URLPattern;
    handler: (req: Request, params?: {
        pathname: { groups: Record<string, string | undefined> }
    }, info?: any,) => Promise<Response> | Response;
}

export function serveFile(_req: Request, filePath: string): Response {
    return new Response(Bun.file(filePath));
}

export default class ApiSystem extends System {
    routes: Route[];
    webServer!: Server<any>;
    listening: boolean = false;

    constructor(instance: Instance) {
        super("api", instance);

        const self = this;

        this.routes = [{
            method: ["GET"], pattern: new URLPattern({
                pathname: "/api/teapot",
            }) as unknown as Route["pattern"], handler() {
                return Response.json({
                    teapot: true,
                    message: "This OnlineWorkspace (Not a teapot?) sadly does not support the Hyper Text Coffee Pot Control Protocol 😢",
                }, {status: 418},) as unknown as Response;
            },
        }, {
            // public so that something outside can ping it, it says nothing which is not already visible to anyone who opens the instance
            method: ["GET", "HEAD"], pattern: new URLPattern({pathname: "/api/health"}), async handler(req) {
                const health = await self.getHealth();

                return new Response(req.method === "HEAD" ? null : JSON.stringify(health.body), {
                    status: health.httpStatus, headers: {"content-type": "application/json", "cache-control": "no-store"},
                });
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/backups/:id/download"}), async handler(req, rawParams) {
                const authorization = getCookies(req.headers).Authorization;
                const userId = authorization ? await self.instance.sys.authorization.verifySession(decodeURIComponent(authorization)) : undefined;

                if (userId === undefined) return Response.json({code: "UNAUTHORIZED", message: "invalid session"}, {status: 401});

                const user = await self.instance.sys.users.getUserById(userId);

                if (!user || !(await user.isAdministrator())) return Response.json({code: "FORBIDDEN", message: "user lacks administrator permissions"}, {status: 403});

                const id = rawParams?.pathname.groups.id ?? "";
                const backup = self.instance.sys.backup;

                if (!backup.isValidId(id) || !(await backup.get(id))) return Response.json({code: "NOT_FOUND", message: "That backup does not exist"}, {status: 404});

                self.instance.sys.audit.record({action: "backup.downloaded", actorId: userId, target: id, ip: clientIp(req)});

                return new Response(Bun.file(backup.archivePath(id)), {
                    headers: {
                        "content-type": "application/gzip",
                        "content-disposition": `attachment; filename="onlineworkspace-backup-${id}.tar.gz"`,
                        "cache-control": "no-store",
                    },
                });
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/instance/login/banner"}), handler(req) {
                return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/login/banner.png"));
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/instance/login/background"}), handler(req) {
                return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/login/background.png"));
            },
        }, {
            // public: the favicon is requested before anyone has logged in; without a custom one the default logo is used
            method: ["GET"], pattern: new URLPattern({pathname: "/api/instance/favicon"}), async handler(req) {
                const faviconPath = path.join(self.instance.sys.filesystem.FS_ROOT, "assets/favicon.png");

                if (!(await Bun.file(faviconPath).exists())) {
                    return new Response(null, {status: 302, headers: {Location: "/assets/onlineworkspace/online_workspace_logo.svg"}});
                }

                return serveFile(req, faviconPath);
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/instance/square-logo"}), async handler(req) {
                const squareLogoPath = path.join(self.instance.sys.filesystem.FS_ROOT, "assets/square_logo.png");

                if (!(await Bun.file(squareLogoPath).exists())) {
                    return new Response("Not found", {status: 404});
                }

                return serveFile(req, squareLogoPath);
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/user/:username/avatar/:size"}),
            async handler(req, rawParams, _info) {
                const params = rawParams?.pathname.groups;

                if (!params) {
                    return Response.json({
                        code: "INVALID_REQUEST", message: "missing params",
                    });
                }

                let username = params.username!;

                const size = params.size!;

                const cookies = getCookies(req.headers);

                if (!cookies.Authorization) {
                    return Response.json({
                        code: "UNAUTHORIZED", message: "missing auth cookie",
                    });
                }

                let userId: number;

                if (username === "me") {
                    const tempUserId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

                    if (tempUserId === undefined) {
                        return Response.json({
                            code: "UNAUTHORIZED", message: "invalid session",
                        });
                    }

                    userId = tempUserId
                } else {
                    userId = (await self.instance.sys.users.getUserByUsername(username))?.userId!

                    if (userId === undefined) {
                        return Response.json({
                            code: "NOT_FOUND", message: "user not found",
                        })
                    }
                }

                switch (size) {
                    case "xs":
                    case "s":
                    case "m":
                    case "l":
                    case "xl":
                    case "2xl":
                        return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, `users/${userId}/assets/avatar/${size}.webp`));
                    default:
                        return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, `users/${userId}/assets/avatar/xs.webp`));
                }
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/material-symbol/:name"}),
            async handler(req, rawParams) {
                const name = rawParams?.pathname.groups.name;

                if (!name || !/^[a-z0-9_]+$/.test(name)) {
                    return Response.json({
                        code: "INVALID_REQUEST", message: "invalid icon name",
                    }) as unknown as Response;
                }

                const iconPath = path.join(self.instance.sys.filesystem.SRC_ROOT, "../../node_modules/@material-symbols/svg-700/outlined/", `${name}.svg`);

                try {
                    return serveFile(req, await fs.realpath(iconPath));
                } catch (err) {
                    return Response.json({
                        code: "NOT_FOUND", message: "unknown icon",
                    }, {status: 404}) as unknown as Response;
                }
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/application-icon/*"}),
            async handler(req, rawParams) {
                const params = rawParams?.pathname.groups["0"];

                const cookies = getCookies(req.headers);

                if (!cookies.Authorization) {
                    return Response.json({
                        code: "UNAUTHORIZED", message: "missing auth cookie",
                    }) as unknown as Response;
                }

                const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

                if (userId === undefined) {
                    return Response.json({
                        code: "UNAUTHORIZED", message: "invalid session",
                    }) as unknown as Response;
                }

                const application = self.instance.sys.applications.availableApplications.find((a) => a.manifest?.id === params);

                if (!application) {
                    return Response.json({
                        code: "INTERNAL_ERROR", message: "Invalid application!",
                    }) as unknown as Response;
                }

                if (application.manifest?.icon?.type === "material-symbol") {
                    const applicationIconPath = path.join(self.instance.sys.filesystem.SRC_ROOT, "../../node_modules/@material-symbols/svg-700/outlined/", (application.manifest?.icon?.value + ".svg") || "");

                    try {
                        return serveFile(req, await fs.realpath(applicationIconPath));
                    } catch (err) {
                        self.log.error(`Failed to serve icon at path '${applicationIconPath}'!`)
                        return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/missing.png"))
                    }
                } else {
                    const applicationIconPath = path.join(application.path, application.manifest?.icon?.value || "");

                    try {
                        return serveFile(req, await fs.realpath(applicationIconPath));
                    } catch (err) {
                        self.log.error(`Failed to serve icon at path '${applicationIconPath}'!`)
                        return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/missing.png"))
                    }
                }
            },
        }, {
            method: ["GET"], pattern: new URLPattern({
                pathname: "/api/asset/image/:imageId/:resolution",
            }), async handler(req, rawParams) {
                const params = rawParams?.pathname.groups;

                if (!params) {
                    return Response.json({
                        code: "INVALID_REQUEST", message: "missing params",
                    }) as unknown as Response;
                }

                const image = self.instance.sys.image._internalImages.get(params.imageId as string);

                if (!image) {
                    return new Response("Invalid image") as unknown as Response;
                }

                if (!image.public) {
                    const cookies = getCookies(req.headers);

                    if (!cookies.Authorization) {
                        return Response.json({
                            code: "UNAUTHORIZED", message: "missing auth cookie",
                        }) as unknown as Response;
                    }

                    const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

                    if (userId === undefined) {
                        return Response.json({
                            code: "UNAUTHORIZED", message: "invalid session",
                        }) as unknown as Response;
                    }
                }

                const resolutionParam = params.resolution as string;

                const sourceImage = image[resolutionParam];

                if (!sourceImage) {
                    return Response.json({
                        code: "NOT_FOUND", message: "missing image",
                    }) as unknown as Response;
                }

                if (!sourceImage.path) {
                    return Response.json({
                        code: "INVALID_REQUEST", message: "missing source image path",
                    }) as unknown as Response;
                }

                if (resolutionParam === "raw") {
                    self.instance.sys.image.log.debug(`Served Image -> '${(params as {
                        imageId: string
                    }).imageId} @ ${resolutionParam}'`);
                    return serveFile(req, sourceImage.path);
                }

                const cachedFilePath = path.join(self.instance.sys.filesystem.CACHE_PATH, sourceImage.path.replaceAll(":", ""));
                const outputPath = path.join(cachedFilePath, resolutionParam);
                const hashPath = path.join(`${outputPath}.hash`);

                if (existsSync(outputPath)) {
                    const fileHash = await instance.sys.filesystem.getFileHash(sourceImage.path);
                    const cacheFileHash = await fs.readFile(hashPath, "utf8");

                    if (fileHash === cacheFileHash) {
                        self.instance.sys.image.log.info(`Served Image -> '${(params as {
                            imageId: string
                        }).imageId} @ ${resolutionParam}'`);
                        return serveFile(req, outputPath);
                    }
                }

                if (!existsSync(path.join(outputPath, ".."))) {
                    await fs.mkdir(path.join(outputPath, ".."), {recursive: true});
                }

                if (!sourceImage.resize?.dimensions) {
                    return Response.json({
                        code: "INVALID_REQUEST", message: "missing source image resize dimensions",
                    }) as unknown as Response;
                }

                const fileHash = await instance.sys.filesystem.getFileHash(sourceImage.path);
                await self.instance.sys.image.resizeImage(sourceImage.path, outputPath, sourceImage.resize!.dimensions, sourceImage.resize!);
                await fs.writeFile(hashPath, fileHash, "utf8");

                self.instance.sys.image.log.info(`Served Image -> '${(params as {
                    imageId: string
                }).imageId} @ ${resolutionParam}'`);
                return serveFile(req, outputPath);
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/asset/raw/:assetId"}),
            async handler(req, rawParams) {
                const params = rawParams?.pathname.groups;

                if (!params) {
                    return Response.json({
                        code: "INVALID_REQUEST", message: "missing params",
                    }) as unknown as Response;
                }

                const asset = self.instance.sys.filesystem._internalAssets.get(params.assetId as string);

                if (!asset) {
                    return new Response("Invalid raw asset") as unknown as Response;
                }

                if (!asset.public) {
                    const cookies = getCookies(req.headers);

                    if (!cookies.Authorization) {
                        return Response.json({
                            code: "UNAUTHORIZED", message: "missing auth cookie",
                        }) as unknown as Response;
                    }

                    const userId = await self.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!));

                    if (userId === undefined) {
                        return Response.json({
                            code: "UNAUTHORIZED", message: "invalid session",
                        }) as unknown as Response;
                    }
                }

                return serveFile(req, asset.path);
            },
        }, {
            pattern: new URLPattern({pathname: "/api/trpc/*"}), async handler(req, _params) {
                return ((await self.instance.sys.tRPC.attemptTRPCRequest(req, self.instance.sys.api.webServer)) || (Response.json({
                    notFound: true, message: "Unhandled by tRPC router",
                }, {status: 404},) as unknown as Response));
            },
        },];
    }

    async addRoute(route: Route) {
        if (this.listening) {
            await this.stop();
            this.routes.push(route);
            await this.startup();
        } else {
            this.routes.push(route);
        }

        this.log.debug(`Registered api route at ${route.pattern.pathname} for ${route.method || route.method === undefined ? "All Methods" : "Unknown Method?"}`);

        return true;
    }

    getProxyBasePath(): string {
        // noinspection HttpUrlsUsage
        return `${this.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${this.instance.sys.configuration.proxy.hostname}`;
    }

    override async startup(): Promise<boolean> {
        if (this.listening) {
            this.log.warning("Something called startup() when we were already listening for requests!");
            return false;
        }

        this.listening = true;
        const self = this;
        this.webServer = Bun.serve({
            port: this.instance.sys.configuration.apiPort,
            websocket: self.instance.sys.notifications.websocketHandler,
            async fetch(req, server) {
                const security = self.instance.sys.security;

                // things which are refused are still given the headers
                const refused = security.rateLimit(req, server) ?? security.originCheck(req);

                if (refused) return security.applyHeaders(req, refused);

                const response = await self.handleRequest(req, server);

                // a websocket which was upgraded has no response
                return response ? security.applyHeaders(req, response) : response;
            },
        });

        this.log.info(`Listening on port ${this.webServer.port}`);
        return true;
    }

    /** what the health endpoint reports, the instance is healthy once it is online and its database answers */
    async getHealth() {
        const instance = this.instance;
        const online = instance.status === InstanceStatus.Online;
        let database: "ok" | "down" | "not used" = "not used";

        if (online && instance.mode === "full") {
            try {
                await Promise.race([instance.sys.database.postgres()`SELECT 1`, new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), 2000))]);
                database = "ok";
            } catch {
                database = "down";
            }
        }

        const status = !online
            ? (instance.status === InstanceStatus.Stopping ? "stopping" : "starting")
            : database === "down" ? "degraded" : instance.mode === "setup" ? "setup" : "ok";

        return {
            httpStatus: status === "ok" || status === "setup" ? 200 : 503,
            body: {
                status,
                ok: status === "ok" || status === "setup",
                version: instance.versionString,
                mode: instance.mode,
                uptimeSeconds: Math.round(process.uptime()),
                checks: {database},
                timestamp: new Date().toISOString(),
            },
        };
    }

    private async handleRequest(req: Request, server: Server<any>): Promise<Response | undefined> {
        const self = this;
        const url = new URL(req.url);

        // setup mode has no database, so only the setup procedures work
        if (self.instance.mode === "setup" && req.method !== "OPTIONS" && !url.pathname.startsWith("/api/trpc/") && url.pathname !== "/api/teapot" && url.pathname !== "/api/health") {
            return Response.json({setupRequired: true, message: "This instance is being set up"}, {status: 503});
        }

        if (url.pathname === NOTIFICATIONS_WEBSOCKET_PATH) {
            // a page on another site could otherwise open the socket with the visitor's cookie
            const origin = req.headers.get("origin");

            const originHost = (() => {
                try {
                    return origin ? new URL(origin).host : undefined;
                } catch {
                    return "invalid";
                }
            })();

            if (origin && originHost !== (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))) {
                return Response.json({code: "FORBIDDEN", message: "Cross-site requests are not allowed"}, {status: 403});
            }

            return self.instance.sys.notifications.handleUpgrade(req, server) as Promise<Response>;
        }

        for (const route of self.routes) {
            if (route.method) {
                const methods = Array.isArray(route.method) ? route.method : [route.method];
                if (!methods.includes(req.method)) continue;
            }
            const match = route.pattern.exec(url);
            if (match) {
                return route.handler(req, match);
            }
        }

        if (req.method === "OPTIONS") {
            const headers = new Headers();

            // only the instance's own pages are allowed, which is the same origin so a browser does not ask
            if (req.headers.get("origin") === self.getProxyBasePath()) headers.set("access-control-allow-origin", self.getProxyBasePath());

            headers.set("vary", "origin");
            headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE");
            headers.set("access-control-allow-headers", "content-type, authorization");
            headers.set("access-control-max-age", "86400");
            return new Response(null, {
                status: 204, headers,
            });
        }

        return Response.json({notFound: true}, {status: 404},);
    }

    override async stop(): Promise<boolean> {
        await this.webServer?.stop(true);
        this.listening = false;

        return true;
    }
}
