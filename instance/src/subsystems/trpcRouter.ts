import { initTRPC, TRPCError } from "@trpc/server";
import z from "zod";
import type { Instance } from "../index.js";
import { AuthorizedDeviceType } from "./authorization.js";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { WorkspacesNotificationEventEmitterEvent, type WorkspacesNotification } from "./notifications.js";
import { on } from "node:events";
import type { Server } from "bun";

export const createTRPCContext = (instance: Instance) => (opt: FetchCreateContextFnOptions, server: Server<{}>) => {
    return {
        rawRequest: {
            req: opt.req,
            resHeaders: opt.resHeaders,
            server: server,
        },
        instance: instance,
    };
};

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create({
    sse: {
        ping: {
            // Enable periodic ping messages to keep connection alive
            enabled: true,
            // Send ping message every 2s
            intervalMs: 2_000,
        },
        client: {
            reconnectAfterInactivityMs: 3_000,
        },
    },
});

export const publicProcedure = t.procedure.use(async (opt) => {
    return opt.next({
        ctx: {
            userId: "THIS CAN ONLY BE ACCESSED FROM A NON-PUBLIC PROCEDURE",
        },
    });
});
export const procedure = t.procedure.use(async (opt) => {
    // console.log(opt.ctx.req.headers);

    /*
    if (!ctx.user?.isAdmin) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    */

    const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

    if (cookieString === null) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "missing auth cookie" });
    }

    const parsedCookie = Bun.Cookie.parse(cookieString);

    let userId = await opt.ctx.instance.subSystems.authorization.verifySession(decodeURIComponent(parsedCookie.value));

    if (userId === undefined) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "invalid session" });
    }

    return opt.next({
        ctx: {
            userId: userId,
        },
    });
});

let notifications: WorkspacesNotification[] = [];

export const workspacesRouter = t.router({
    authorization: {
        signupRequirements: publicProcedure
            .output(
                z.object({
                    email: z.boolean(),
                }),
            )
            .query(async () => {
                return {
                    // TODO: change to true when an email server exists (links to emailServerStuff)
                    email: false,
                };
            }),
        signup: publicProcedure
            .input(
                z.object({
                    username: z.string(),
                    password: z.string(),
                    emailAddress: z.string(),
                    emailCode: z.string(),
                    displayName: z.string(),
                    gender: z.string(),
                    bio: z.string(),
                }),
            )
            .output(
                z.union([
                    z.object({ type: z.literal("error"), message: z.string() }),
                    z.object({ type: z.literal("success"), sessionToken: z.string(), notice: z.boolean().optional() }),
                ]),
            )
            .mutation(async (opt) => {
                // TODO: implement this (links to emailServerStuff)

                if (opt.input.emailCode !== "a")
                    return {
                        type: "error",
                        message: "The email code did not match!",
                    };

                const uid = await opt.ctx.instance.subSystems.users.createUser(opt.input.username);

                if (uid === undefined)
                    return {
                        type: "error",
                        message: "Failed to create the user",
                    };

                const user = await opt.ctx.instance.subSystems.users.getUserById(uid);

                if (user === undefined)
                    return {
                        type: "error",
                        message: "Failed to fetch the user",
                    };

                let splitDisplayName = opt.input.displayName.split(" ");
                await user.setFullName(splitDisplayName[0], splitDisplayName.slice(1).join(" "));

                await user.setEmail(opt.input.emailAddress);

                if (opt.input.gender === "male" || opt.input.gender === "female" || opt.input.gender === "other")
                    await user.setGender(opt.input.gender);

                await user.setQuota(20);

                await opt.ctx.instance.subSystems.authorization.setPassword(user.userId, opt.input.password);

                const session = await opt.ctx.instance.subSystems.authorization.createSession(
                    user.userId,
                    opt.input.password,
                    AuthorizedDeviceType.UnknownBrowser,
                    undefined,
                    opt.ctx.rawRequest.server.requestIP(opt.ctx.rawRequest.req)?.address,
                );

                if (session === undefined) {
                    return {
                        type: "error",
                        message: "Failed to create a session?",
                    };
                }

                opt.ctx.rawRequest.resHeaders.set("set-cookie", Bun.Cookie.from("Authorization", session, { secure: false }).serialize());

                return {
                    type: "success",
                    sessionToken: session,
                };
            }),
        signin: publicProcedure
            .input(z.object({ username: z.string(), password: z.string() }))
            .output(
                z.union([
                    z.object({ type: z.literal("error"), message: z.string() }),
                    z.object({ type: z.literal("success"), sessionToken: z.string() }),
                ]),
            )
            .mutation(async (opt) => {
                const user = await opt.ctx.instance.subSystems.users.getUserByUsername(opt.input.username);

                if (user === undefined)
                    return {
                        type: "error",
                        message: "Failed to find the user",
                    };

                const session = await opt.ctx.instance.subSystems.authorization.createSession(
                    user.userId,
                    opt.input.password,
                    AuthorizedDeviceType.UnknownBrowser,
                    undefined,
                    opt.ctx.rawRequest.server.requestIP(opt.ctx.rawRequest.req)?.address,
                );

                if (session === undefined) {
                    return {
                        type: "error",
                        message: "Failed to create a session?",
                    };
                }

                opt.ctx.rawRequest.resHeaders.set("set-cookie", Bun.Cookie.from("Authorization", session, { secure: false }).serialize());

                return {
                    type: "success",
                    sessionToken: session,
                };
            }),
        isAuthenticated: publicProcedure.output(z.object({ authenticated: z.boolean() })).query(async (opt) => {
            const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

            if (cookieString === null) {
                return {
                    authenticated: false,
                };
            }

            const parsedCookie = Bun.Cookie.parse(cookieString);

            let userId = await opt.ctx.instance.subSystems.authorization.verifySession(decodeURIComponent(parsedCookie.value));

            if (userId === undefined) {
                return {
                    authenticated: false,
                };
            }

            return {
                authenticated: true,
            };
        }),
        logout: procedure.output(z.object({ success: z.literal(true) })).mutation(async (opt) => {
            const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

            if (cookieString === null) {
                return {
                    success: true,
                };
            }

            const parsedCookie = Bun.Cookie.parse(cookieString);

            await opt.ctx.instance.subSystems.authorization.endSession(decodeURIComponent(parsedCookie.value));

            return {
                success: true,
            };
        }),
    },
    app: {
        navigation: {
            user: {
                name: procedure.output(z.object({ username: z.string(), forename: z.string(), surname: z.string() })).query(async (opt) => {
                    const db = opt.ctx.instance.subSystems.database.db();

                    const user = (await db`SELECT username, forename, surname FROM Users WHERE id = ${opt.ctx.userId};`)?.[0];

                    if (!user) {
                        throw new TRPCError({ code: "NOT_FOUND", cause: { message: "User does not exist" } });
                    }

                    return {
                        username: user.username || "@",
                        forename: user.forename || "Unknown",
                        surname: user.surname || "",
                    };
                }),
            },
            quickShortcuts: procedure
                .output(
                    z.array(
                        z.object({
                            location: z.object({ type: z.union([z.literal("local"), z.literal("remote")]), value: z.string() }),
                            icon: z.object({ type: z.union([z.literal("icon"), z.literal("image")]), value: z.string() }),
                            label: z.string(),
                        }),
                    ),
                )
                .query(async (opt) => {
                    let quickShortcuts = opt.ctx.instance.subSystems.applications.getEnabledApplications();

                    return quickShortcuts.map((app) => {
                        let icon: { type: "icon"; value: string } = { type: "icon", value: "indeterminate_question_box" };

                        // @ts-ignore
                        if (app.manifest?.icon) icon = app.manifest.icon;

                        return {
                            icon: icon,
                            label: app.manifest?.displayName || "Unknown",
                            location: {
                                type: "local",
                                value: `/app/${app.manifest?.id}` || "/404",
                            },
                        };
                    });
                }),
        },
        notifications: {
            listener: procedure
                // @ts-ignore
                .subscription(async function* (opt) {
                    for await (const [data] of on(
                        opt.ctx.instance.subSystems.notifications.eventEmitter,
                        WorkspacesNotificationEventEmitterEvent.SendNotification,
                        {
                            signal: opt.signal,
                        },
                    )) {
                        const notification = data as WorkspacesNotification;
                        if (notification.recipient === opt.ctx.userId) {
                            notifications.push(notification);

                            yield notification;
                        }
                    }
                }),
            respond: procedure
                .input(z.object({ uuid: z.string(), responseType: z.literal("button"), value: z.string() }))
                .output(z.object({ ok: z.boolean(), action: z.object({ type: z.literal("navigate"), value: z.string() }).optional() }))
                .mutation(async (opt) => {
                    const notification = notifications.find((n) => n.uuid === opt.input.uuid);

                    if (notification) {
                        let output;
                        if (opt.input.responseType === "button") {
                            output = notification.optionsCallbacks?.onButton(opt.input.value);
                        }

                        notifications = notifications.filter((n) => n.uuid !== notification.uuid);

                        if (output !== undefined) {
                            return { ok: true, action: output.action };
                        } else {
                            return { ok: true };
                        }
                    }

                    return { ok: false };
                }),
        },
    },
});

export type WorkspacesTRPCRouter = typeof workspacesRouter;
