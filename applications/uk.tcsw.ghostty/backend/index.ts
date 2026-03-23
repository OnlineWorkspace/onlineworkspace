/// <reference path="./global.d.ts" />

import {
  createTRPCContext,
  procedure,
} from "@tcsw/workspaces-instance/src/systems/trpcRouter.js";
import { initTRPC } from "@trpc/server";

const log = instance.log.createLogger("uk.tcsw.ghostty");

export const t = initTRPC
  .context<ReturnType<typeof createTRPCContext>>()
  .create();

const router = t.router({});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
  basePath: "/api/app/uk.tcsw.ghostty",
  router: router,
  createContext: createTRPCContext(instance),
});
