import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";

const log = instance.log.createLogger("uk.tcsw.settings");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
    overview: {
        user: {
            fullName: procedure.output(z.string()).query(async (opt) => {
                const fullName = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getFullName();

                return `${fullName?.forename} ${fullName?.surname || ""}` || "Unknown User";
            }),
            role: procedure.output(z.string()).query(async (opt) => {
                const isAdministrator = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.isAdministrator();

                return isAdministrator ? "Administrator" : "User";
            }),
        },
    },
    profile: {
        name: procedure.output(z.string()).query(async (opt) => {
            const fullName = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getFullName();

            return `${fullName?.forename} ${fullName?.surname || ""}` || "Unknown User";
        }),
        username: procedure.output(z.string()).query(async (opt) => {
            const username = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getUsername();

            return username || "unknown";
        }),
        gender: procedure.output(z.string()).query(async (opt) => {
            const gender = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getGender();

            return gender || "female";
        }),
        email: procedure.output(z.string()).query(async (opt) => {
            const email = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getEmail();

            return email || "unknown";
        }),
        role: procedure.output(z.string()).query(async (opt) => {
            const isAdministrator = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.isAdministrator();

            return isAdministrator ? "Administrator" : "User";
        }),
    },
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.settings",
    router: router,
    createContext: createTRPCContext(instance),
});
