/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";

const log = instance.log.createLogger("uk.tcsw.dashboard");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
    dashboard: {
        widgets: {
            user: {
                profile: procedure
                    .output(
                        z.object({
                            displayName: z.string(),
                            username: z.string(),
                            avatar: z.string(),
                        }),
                    )
                    .query(async (opt) => {
                        const db = instance.subSystems.database.db();

                        const { forename, surname, username } = (
                            await db`SELECT forename, surname, username FROM Users WHERE id = ${opt.ctx.userId}`
                        )?.[0] || { forename: "Unknown", surname: "", username: "@unknown" };

                        return {
                            displayName: `${forename} ${surname}`,
                            username: username,
                            avatar: `${opt.ctx.rawRequest.destinationHostname}/api/user/me/avatar/m`,
                        };
                    }),
            },
        },
        welcomeMessage: procedure.output(z.string()).query(async (opt) => {
            return `Hiya, ${(await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getForename()) || "Anonymous"}!`;
        }),
    },
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.dashboard",
    router: router,
    createContext: createTRPCContext(instance),
});
