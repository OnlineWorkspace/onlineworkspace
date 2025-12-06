/// <reference path="./global.d.ts" />

import { WorkspacesNotificationPriority } from "@tcsw/workspaces-instance/src/subsystems/notifications";
import { AuthorizedDeviceType, SESSION_VALID_TERM_MS } from "@tcsw/workspaces-instance/src/subsystems/authorization";
import { adminProcedure, createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
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
        hasTwoFactor: procedure.output(z.boolean()).query(async (opt) => {
            // TODO: implement this
            return false;
        }),
        hasPasskey: procedure.output(z.boolean()).query(async (opt) => {
            // TODO: implement this
            return false;
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
        setPassword: procedure.input(z.object({password: z.string()})).mutation(async (opt) => {
            await opt.ctx.instance.subSystems.authorization.setPassword(opt.ctx.userId, opt.input.password)

            return true;
        }),
    },
    instance: {
        getUsers: adminProcedure.output(z.number().array()).query(async (_opt) => {
            const users = await instance.subSystems.users.getAllUsers();

            return users.map((u) => u.userId);
        }),
        getUser: adminProcedure
            .input(z.object({ userId: z.number() }))
            .output(
                z
                    .object({
                        id: z.number(),
                        username: z.string(),
                        fullName: z.object({ forename: z.string().optional(), surname: z.string().optional() }),
                        email: z.string().optional(),
                        isAdministrator: z.boolean(),
                    })
                    .or(z.undefined()),
            )
            .query(async (opt) => {
                const u = await instance.subSystems.users.getUserById(opt.input.userId);

                if (!u) return undefined;

                return {
                    id: u.userId,
                    username: (await u.getUsername()) || "unknown",
                    fullName: await u.getFullName(),
                    email: await u.getEmail(),
                    isAdministrator: (await u.isAdministrator()) || false,
                };
            }),
        user: {
            getForename: adminProcedure
                .input(z.number())
                .output(z.string())
                .query(async (opt) => {
                    const forename = await (await opt.ctx.instance.subSystems.users.getUserById(opt.input))?.getForename();

                    return `${forename}`;
                }),
            setForename: adminProcedure.input(z.object({ userId: z.number(), forename: z.string() })).mutation(async (opt) => {
                await (await opt.ctx.instance.subSystems.users.getUserById(opt.input.userId))?.setForename(opt.input.forename);

                return true;
            }),
            getSurname: adminProcedure
                .input(z.number())
                .output(z.string())
                .query(async (opt) => {
                    const surname = await (await opt.ctx.instance.subSystems.users.getUserById(opt.input))?.getSurname();

                    return `${surname}`;
                }),
            setSurname: adminProcedure.input(z.object({ userId: z.number(), surname: z.string() })).mutation(async (opt) => {
                await (await opt.ctx.instance.subSystems.users.getUserById(opt.input.userId))?.setSurname(opt.input.surname);

                return true;
            }),
            getUsername: adminProcedure
                .input(z.number())
                .output(z.string())
                .query(async (opt) => {
                    const username = await (await opt.ctx.instance.subSystems.users.getUserById(opt.input))?.getUsername();

                    return username || "unknown";
                }),
            setUsername: adminProcedure.input(z.object({ userId: z.number(), username: z.string() })).mutation(async (opt) => {
                await (await opt.ctx.instance.subSystems.users.getUserById(opt.input.userId))?.setUsername(opt.input.username);

                return true;
            }),
            getEmail: adminProcedure
                .input(z.number())
                .output(z.string())
                .query(async (opt) => {
                    const email = await (await opt.ctx.instance.subSystems.users.getUserById(opt.input))?.getEmail();

                    return email || "unknown";
                }),
            setEmail: adminProcedure.input(z.object({ userId: z.number(), email: z.email() })).mutation(async (opt) => {
                await (await opt.ctx.instance.subSystems.users.getUserById(opt.input.userId))?.setEmail(opt.input.email);

                return true;
            }),
            getIsAdministrator: adminProcedure
                .input(z.number())
                .output(z.boolean())
                .query(async (opt) => {
                    const isAdministrator = await (await opt.ctx.instance.subSystems.users.getUserById(opt.input))?.isAdministrator();

                    return isAdministrator || false;
                }),
            setIsAdministrator: adminProcedure.input(z.object({ userId: z.number(), administrator: z.boolean() })).mutation(async (opt) => {
                await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.setIsAdministrator(opt.input.administrator);

                return true;
            }),
            delete: adminProcedure.input(z.object({ userId: z.number() })).mutation(async (opt) => {
                await (await opt.ctx.instance.subSystems.users.getUserById(opt.ctx.userId))?.delete();

                return true;
            }),
            boop: adminProcedure.input(z.object({ userId: z.number() })).mutation(async (opt) => {
                instance.subSystems.notifications.send(
                    opt.input.userId,
                    "commands.notify",
                    WorkspacesNotificationPriority.Important,
                    {
                        title: "Boop",
                        body: "You have been booped by an administrator!",
                        icon: "person",
                    },
                    {
                        buttons: [
                            {
                                id: "a",
                                label: "label",
                                type: "filled",
                            },
                            {
                                id: "a",
                                label: "label",
                                type: "tonal",
                            },
                        ],
                    },
                );

                return true;
            }),
        },
    },
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.settings",
    router: router,
    createContext: createTRPCContext(instance),
});
