import type { TRPCBuiltRouter } from "@trpc/server";
import {
  type FetchCreateContextFnOptions,
  fetchRequestHandler,
} from "@trpc/server/adapters/fetch";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import {
  coreOnlineWorkspaceRouter,
  createOnlineWorkspaceTRPCContext,
} from "./trpc/coreRouter.ts";

export default class TRPCSystem extends System {
  routers: {
    basePath: string;
    router: TRPCBuiltRouter<any, any>;
    createContext: (
      opts: FetchCreateContextFnOptions,
      server: Deno.HttpServer<Deno.NetAddr>,
    ) => object;
  }[];

  constructor(instance: Instance) {
    super("trpc", instance);

    this.routers = [];

    this.routers.push({
      basePath: "/api/trpc",
      router: coreOnlineWorkspaceRouter,
      createContext: createOnlineWorkspaceTRPCContext(this.instance),
    });
  }

  override async startup(): Promise<boolean> {
    super.startup();

    // TODO: add tRPC routes to apiSystem when registered here by applications

    return true;
  }

  registerTRPCRouter(
    router: TRPCBuiltRouter<any, any>,
    basePath: string,
    createContext: (
      opts: FetchCreateContextFnOptions,
      server: Deno.HttpServer<Deno.NetAddr>,
    ) => object = createOnlineWorkspaceTRPCContext(this.instance),
  ) {
    if (this.routers.find((r) => r.basePath === basePath)) {
      this.log.info(this.routers);
      throw new Error(
        `A TRPC Router has already been registered with this basePath! ${basePath}`,
      );
    }

    this.routers.push({
      basePath,
      router,
      createContext,
    });

    this.log.debug(`Registered tRPC router at ${basePath}`);

    const self = this;

    this.instance.sys.api.addRoute({
      pattern: new URLPattern({ pathname: `${basePath}/*` }),
      async handler(req) {
        return (await self.instance.sys.tRPC.attemptTRPCRequest(
          req,
          self.instance.sys.api.webServer,
        )) ||
          Response.json({
            notFound: true,
            message: "Unhandled by tRPC router",
          }, { status: 404 });
      },
    });
  }

  attemptTRPCRequest(
    req: Request,
    server: Deno.HttpServer<Deno.NetAddr>,
  ) {
    const url = new URL(req.url);

    for (const router of this.routers) {
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
}
