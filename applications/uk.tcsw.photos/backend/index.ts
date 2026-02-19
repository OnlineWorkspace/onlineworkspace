/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/system/trpcRouter";
import { initTRPC } from "@trpc/server";

const log = instance.log.createLogger("uk.tcsw.photos");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.photos",
    router: router,
    createContext: createTRPCContext(instance),
});
