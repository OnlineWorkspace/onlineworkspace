import { type BunRequest, type Server } from "bun";
import type { Instance } from "../index.js";
import System from "../system.js";
import { type TRPCBuiltRouter } from "@trpc/server";
import { createTRPCContext } from "./trpcRouter.js";
import { type FetchCreateContextFnOptions, fetchRequestHandler } from "@trpc/server/adapters/fetch";

export default class TRPCSystem extends System {
    registeredRouters: {
        basePath: string;
        router: TRPCBuiltRouter<any, any>;
        createContext: (
            opts: FetchCreateContextFnOptions,
            server: Server<ReturnType<typeof createTRPCContext>>,
        ) => object;
    }[];

    constructor(instance: Instance) {
        super("trpc", instance);

        this.registeredRouters = [];

        return this;
    }

    async startup(): Promise<boolean> {
        return true;
    }

    private attemptTRPCRequest(req: BunRequest, server: Server<ReturnType<typeof createTRPCContext>>) {
        const url = new URL(req.url);

        for (const router of this.registeredRouters) {
            if (!url.pathname.startsWith(router.basePath)) {
                continue;
            }

            return fetchRequestHandler({
                createContext: (opts) => router.createContext(opts, server),
                req,
                endpoint: router.basePath ?? "",
                router: router.router,
            });
        }

        return;
    }

    // private bunWebSocketHandler() {}

    serve(options: {
        routes: {
            [path: string]: {
                GET?: (req: BunRequest) => Promise<Response>;
                POST?: (req: BunRequest) => Promise<Response>;
                DELETE?: (req: BunRequest) => Promise<Response>;
                PUT?: (req: BunRequest) => Promise<Response>;
            };
        };
        fetch(request: any, server: any): Response;
        development: boolean;
    }) {
        const self = this;

        return {
            ...options,
            port: 3563,
            hostname: "0.0.0.0",
            async fetch(req: BunRequest, server: Server<ReturnType<typeof createTRPCContext>>) {
                let requestOriginDomain = req.headers.get("Origin");

                if (!requestOriginDomain) return new Response("Invalid request");

                if (!self.instance.sys.configuration.webUrl.includes(requestOriginDomain))
                    return new Response("Invalid request");

                if (req.method === "OPTIONS") {
                    return new Response("TricolorSoftware", {
                        headers: {
                            "Access-Control-Allow-Origin": requestOriginDomain,
                            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                            "Access-Control-Allow-Headers": "Content-Type, Authorization",
                            "Access-Control-Allow-Credentials": "true",
                        },
                    });
                }

                try {
                    let trpcResponse = await self.attemptTRPCRequest(req, server);

                    if (trpcResponse) {
                        trpcResponse.headers.set("Access-Control-Allow-Origin", requestOriginDomain);
                        trpcResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                        trpcResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                        trpcResponse.headers.set("Access-Control-Allow-Credentials", "true");
                        return trpcResponse;
                    }
                } catch (err) {
                    self.log.error(err);
                    console.error(new Error("tRPC -----").stack);
                    return new Response("TRPC failed");
                }

                try {
                    const resp = options?.fetch?.call(server, req, server);
                    resp.headers.set("Access-Control-Allow-Origin", requestOriginDomain);
                    resp.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                    resp.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
                    resp.headers.set("Access-Control-Allow-Credentials", "true");

                    return resp;
                } catch (err) {
                    self.log.error(err);
                    console.error(new Error("Generic -----").stack);
                    return new Response("Generic request error failed");
                }
            },
            onError: (...p: any[]) => {
                // Do nothing as the error is most-likely from bun.serve for tRPC contentType, (i have no clue why as everything else is working)
                if (p[0].type === "unknown") return;
                if (p[0].error.code === "UNAUTHORIZED") return;

                console.error(p[0].error);
                this.log.error("^");
            },
        };
    }
}
