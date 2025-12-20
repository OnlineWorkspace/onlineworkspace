/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";

const log = instance.log.createLogger("uk.tcsw.files");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.files",
    router: router,
    createContext: createTRPCContext(instance),
});
