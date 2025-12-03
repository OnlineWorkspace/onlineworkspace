/// <reference path="./global.d.ts" />

import { SESSION_VALID_TERM_MS } from "./node_modules/@tcsw/workspaces-instance/src/subsystems/authorization";
import { AuthorizedDeviceType } from "@tcsw/workspaces-instance/src/subsystems/authorization";
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
        getName: procedure.output(z.string()).query(async (opt) => {
            const fullName = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getFullName();

            return `${fullName?.forename} ${fullName?.surname || ""}` || "Unknown User";
        }),
        setName: procedure.input(z.string()).mutation(async (opt) => {
            let fullNameSplit = opt.input.split(" ");

            await (
                await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId)
            )?.setFullName(fullNameSplit.shift() || "Unknown", fullNameSplit.join(" "));

            return true;
        }),
        getUsername: procedure.output(z.string()).query(async (opt) => {
            const username = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getUsername();

            return username || "unknown";
        }),
        setUsername: procedure.input(z.string()).mutation(async (opt) => {
            await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.setUsername(opt.input);

            return true;
        }),
        getGender: procedure.output(z.string()).query(async (opt) => {
            const gender = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getGender();

            return gender || "female";
        }),
        setGender: procedure.input(z.string()).mutation(async (opt) => {
            if (opt.input !== "male" && opt.input !== "female" && opt.input !== "other") return;

            await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.setGender(opt.input);

            return true;
        }),
        getEmail: procedure.output(z.string()).query(async (opt) => {
            const email = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.getEmail();

            return email || "unknown";
        }),
        setEmail: procedure.input(z.email()).mutation(async (opt) => {
            await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.setEmail(opt.input);

            return true;
        }),
        getRole: procedure.output(z.string()).query(async (opt) => {
            const isAdministrator = await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.isAdministrator();

            return isAdministrator ? "Administrator" : "User";
        }),
    },
    authentication: {
        hasPassword: procedure.output(z.boolean()).query(async (opt) => {
            const user = await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId);

            if (!user) return false;

            return instance.subSystems.authorization.hasPassword(user?.userId);
        }),
        getSessions: procedure
            .output(
                z
                    .object({
                        sessionId: z.number(),
                        deviceType: z.enum(AuthorizedDeviceType),
                        firstLoginTimestamp: z.number(),
                        ipAddress: z.string(),
                    })
                    .array(),
            )
            .query(async (opt) => {
                const user = await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId);

                if (!user) return [];

                const db = instance.subSystems.database.db();

                const sessions =
                    (await db`SELECT session_id, device_type, valid_until, ip_address FROM Sessions WHERE user_id = ${user.userId}`) as {
                        session_id: number;
                        device_type: AuthorizedDeviceType;
                        valid_until: number;
                        ip_address: string;
                    }[];

                return sessions.map((s) => {
                    return {
                        sessionId: s.session_id,
                        deviceType: s.device_type,
                        firstLoginTimestamp: s.valid_until - SESSION_VALID_TERM_MS,
                        ipAddress: s.ip_address,
                    };
                });
            }),
    },
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.settings",
    router: router,
    createContext: createTRPCContext(instance),
});
