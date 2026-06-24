/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@onlineworkspace/workspace-backend/src/systems/trpcRouter.js";
import { initTRPC } from "@trpc/server";

const log = instance.log.createLogger("uk.ewsgit.ghostty");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({});

export type TRPCRouter = typeof router;

instance.sys.tRPC.routers.push({
  basePath: "/api/app/uk.ewsgit.ghostty",
  router: router,
  createContext: createTRPCContext(instance),
});
