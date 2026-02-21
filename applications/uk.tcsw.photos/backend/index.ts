/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/systems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";

const log = instance.log.createLogger("uk.tcsw.photos");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
    search: {
        people: procedure.input(z.string()).query(async (opt) => {
            return {
                media: [],
                people: [],
            };
        }),
        albums: procedure.input(z.string()).query(async (opt) => {
            return {
                media: [],
                albums: [],
            };
        }),
        places: procedure.input(z.string()).query(async (opt) => {
            return {
                media: [],
                places: [],
            };
        }),
    },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.photos",
    router: router,
    createContext: createTRPCContext(instance),
});
