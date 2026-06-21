import type { TRPCBuiltRouter } from "@trpc/server";
import { type FetchCreateContextFnOptions, fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class TRPCSystem extends System {
  registeredRouters: {
    basePath: string;
    router: TRPCBuiltRouter<any, any>;
    createContext: (opts: FetchCreateContextFnOptions, server: Deno.HttpServer<Deno.NetAddr>) => object;
  }[];

  constructor(instance: Instance) {
    super("trpc", instance);

    this.registeredRouters = [];
  }

  override async startup(): Promise<boolean> {
    this.log.info("Starting up...");
    return true;
  }

  private attemptTRPCRequest(req: Request, server: Deno.HttpServer<Deno.NetAddr>) {
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
        GET?: (req: Request) => Promise<Response>;
        POST?: (req: Request) => Promise<Response>;
        DELETE?: (req: Request) => Promise<Response>;
        PUT?: (req: Request) => Promise<Response>;
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
      async fetch(req: Request, server: Deno.HttpServer<Deno.NetAddr>) {
        try {
          const trpcResponse = await self.attemptTRPCRequest(req, server);
          if (trpcResponse) {
            return trpcResponse;
          } else {
            return new Response("Hello from Workspaces!");
          }
        } catch (err) {
          self.log.error(err);
          console.error(new Error("tRPC -----").stack);
          return new Response("TRPC failed");
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
