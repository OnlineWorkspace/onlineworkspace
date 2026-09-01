import {existsSync} from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type {Server} from "bun";
import type {Instance} from "../index.ts";
import System from "../system.ts";
import {getCookies} from "../utils/cookies.ts";

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
            method: ["GET"], pattern: new URLPattern({pathname: "/api/instance/login/banner"}), handler(req) {
                return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/login/banner.png"));
            },
        }, {
            method: ["GET"], pattern: new URLPattern({pathname: "/api/instance/login/background"}), handler(req) {
                return serveFile(req, path.join(self.instance.sys.filesystem.FS_ROOT, "assets/login/background.png"));
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
            port: this.instance.sys.configuration.apiPort, async fetch(req) {
                const url = new URL(req.url);
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
                    headers.set("access-control-allow-origin", self.instance.sys.configuration.proxy.hostname);
                    headers.set("vary", "origin");
                    headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE");
                    headers.set("access-control-allow-headers", "content-type, authorization");
                    headers.set("access-control-max-age", "86400");
                    return new Response(null, {
                        status: 204, headers,
                    });
                }

                return Response.json({notFound: true}, {status: 404},);
            },
        });

        this.log.info(`Listening on port ${this.webServer.port}`);
        return true;
    }

    override async stop(): Promise<boolean> {
        await this.webServer?.stop(true);
        this.listening = false;

        return true;
    }
}
