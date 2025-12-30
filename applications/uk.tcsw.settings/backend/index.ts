/// <reference path="./global.d.ts" />

import { WorkspacesNotificationPriority } from "@tcsw/workspaces-instance/src/systems/notifications";
import {
    AuthorizedDeviceType,
    SESSION_VALID_TERM_MS,
} from "@tcsw/workspaces-instance/src/systems/authorization";
import {
    adminProcedure,
    createTRPCContext,
    procedure,
} from "@tcsw/workspaces-instance/src/systems/trpcRouter";
import { initTRPC, TRPCError } from "@trpc/server";
import z from "zod";
import path from "path";
import { octetInputParser } from "@trpc/server/http";
import fs from "fs/promises";
import sharp from "sharp";
import {
    FEATURE_FLAG_DESCRIPTIONS,
    WorkspacesFeatureFlags,
} from "@tcsw/workspaces-instance/src/systems/configuration";

const log = instance.log.createLogger("uk.tcsw.settings");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
    overview: {
        user: {
            fullName: procedure.output(z.string()).query(async (opt) => {
                const fullName = await (
                    await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
                )?.getFullName();

                return `${fullName?.forename} ${fullName?.surname || ""}` || "Unknown User";
            }),
            role: procedure.output(z.string()).query(async (opt) => {
                const isAdministrator = await (
                    await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
                )?.isAdministrator();

                return isAdministrator ? "Administrator" : "User";
            }),
            getAvatar: procedure.output(z.string()).query(async (opt) => {
                return `${opt.ctx.rawRequest.destinationHostname}/api/user/me/avatar/l`;
            }),
        },
    },
    profile: {
        getName: procedure.output(z.string()).query(async (opt) => {
            const fullName = await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.getFullName();

            return `${fullName?.forename} ${fullName?.surname || ""}` || "Unknown User";
        }),
        setName: procedure.input(z.string()).mutation(async (opt) => {
            let fullNameSplit = opt.input.split(" ");

            await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.setFullName(fullNameSplit.shift() || "Unknown", fullNameSplit.join(" "));

            return true;
        }),
        getUsername: procedure.output(z.string()).query(async (opt) => {
            const username = await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.getUsername();

            return username || "unknown";
        }),
        setUsername: procedure.input(z.string()).mutation(async (opt) => {
            await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.setUsername(opt.input.toLowerCase());

            return true;
        }),
        getGender: procedure.output(z.string()).query(async (opt) => {
            const gender = await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.getGender();

            return gender || "female";
        }),
        setGender: procedure.input(z.string()).mutation(async (opt) => {
            if (opt.input !== "male" && opt.input !== "female" && opt.input !== "other") return;

            await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.setGender(opt.input);

            return true;
        }),
        getEmail: procedure.output(z.string()).query(async (opt) => {
            const email = await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.getEmail();

            return email || "unknown";
        }),
        setEmail: procedure.input(z.email()).mutation(async (opt) => {
            await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.setEmail(opt.input);

            return true;
        }),
        getBio: procedure.output(z.string()).query(async (opt) => {
            const bio = await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.getBio();

            return bio || "";
        }),
        setBio: procedure.input(z.string()).mutation(async (opt) => {
            await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.setBio(opt.input);

            return true;
        }),
        getRole: procedure.output(z.string()).query(async (opt) => {
            const isAdministrator = await (
                await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId)
            )?.isAdministrator();

            return isAdministrator ? "Administrator" : "User";
        }),
        setProfilePicture: procedure.input(octetInputParser).mutation(async (opt) => {
            const data = opt.input;

            const user = await opt.ctx.user();
            const userPath = user.getPath();

            if (!userPath) return false;

            let filePath = path.join(userPath, "system/temp/avatar");

            await fs.writeFile(filePath, data);

            await user.setAvatar(filePath);
            await user.generateAvatars(true);

            opt.ctx.instance.sys.notifications.send(
                user.userId,
                "uk.tcsw.settings.profile.setProfilePicture",
                WorkspacesNotificationPriority.Normal,
                {
                    title: "Profile Picture Change",
                    body: "Your profile picture has now been changed, please refresh the page to see your new avatar!",
                    icon: "person",
                },
                {
                    buttons: [
                        {
                            id: "reload",
                            label: "Refresh",
                            type: "filled",
                        },
                    ],
                },
                {
                    onButton(optionId) {
                        if (optionId === "reload") {
                            return {
                                action: {
                                    type: "reload",
                                },
                            };
                        }
                    },
                },
            );

            return true;
        }),
        getProfilePicture: procedure.output(z.string()).query(async (opt) => {
            return `${opt.ctx.rawRequest.destinationHostname}/api/user/me/avatar/l`;
        }),
    },
    authentication: {
        hasPassword: procedure.output(z.boolean()).query(async (opt) => {
            const user = await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId);

            if (!user) return false;

            return instance.sys.authorization.hasPassword(user?.userId);
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
                        isCurrent: z.boolean(),
                    })
                    .array(),
            )
            .query(async (opt) => {
                const user = await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId);

                if (!user) return [];

                const db = instance.sys.database.postgres();

                const sessions =
                    (await db`SELECT session_id, device_type, valid_until, ip_address, session_token FROM tricolor_workspaces.public.sessions WHERE user_id = ${user.userId}`) as {
                        session_id: number;
                        device_type: AuthorizedDeviceType;
                        valid_until: number;
                        ip_address: string;
                        session_token: string;
                    }[];

                const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

                if (cookieString === null) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "missing auth cookie" });
                }

                const parsedCookie = Bun.Cookie.parse(cookieString);

                let [_, _userId, token] = decodeURIComponent(parsedCookie.value).split(":");

                return sessions.map((s) => {
                    return {
                        sessionId: s.session_id,
                        deviceType: s.device_type,
                        firstLoginTimestamp: s.valid_until - SESSION_VALID_TERM_MS,
                        ipAddress: s.ip_address,
                        isCurrent: s.session_token === token,
                    };
                });
            }),
        setPassword: procedure.input(z.object({ password: z.string() })).mutation(async (opt) => {
            await opt.ctx.instance.sys.authorization.setPassword(
                opt.ctx.userId,
                opt.input.password,
            );

            return true;
        }),
        deleteSession: procedure
            .input(z.object({ sessionId: z.number() }))
            .mutation(async (opt) => {
                await opt.ctx.instance.sys.authorization.endSessionById(
                    opt.ctx.userId,
                    opt.input.sessionId,
                );

                return true;
            }),
    },
    instance: {
        getUsers: adminProcedure.output(z.number().array()).query(async (_opt) => {
            const users = await instance.sys.users.getAllUsers();

            return users.map((u) => u.userId);
        }),
        getUser: adminProcedure
            .input(z.object({ userId: z.number() }))
            .output(
                z
                    .object({
                        id: z.number(),
                        username: z.string(),
                        fullName: z.object({
                            forename: z.string().optional(),
                            surname: z.string().optional(),
                        }),
                        email: z.string().optional(),
                        isAdministrator: z.boolean(),
                    })
                    .or(z.undefined()),
            )
            .query(async (opt) => {
                const u = await instance.sys.users.getUserById(opt.input.userId);

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
                    const forename = await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input)
                    )?.getForename();

                    return `${forename}`;
                }),
            setForename: adminProcedure
                .input(z.object({ userId: z.number(), forename: z.string() }))
                .mutation(async (opt) => {
                    await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input.userId)
                    )?.setForename(opt.input.forename);

                    return true;
                }),
            getSurname: adminProcedure
                .input(z.number())
                .output(z.string())
                .query(async (opt) => {
                    const surname = await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input)
                    )?.getSurname();

                    return `${surname}`;
                }),
            setSurname: adminProcedure
                .input(z.object({ userId: z.number(), surname: z.string() }))
                .mutation(async (opt) => {
                    await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input.userId)
                    )?.setSurname(opt.input.surname);

                    return true;
                }),
            getUsername: adminProcedure
                .input(z.number())
                .output(z.string())
                .query(async (opt) => {
                    const username = await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input)
                    )?.getUsername();

                    return username || "unknown";
                }),
            setUsername: adminProcedure
                .input(z.object({ userId: z.number(), username: z.string() }))
                .mutation(async (opt) => {
                    await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input.userId)
                    )?.setUsername(opt.input.username.toLowerCase());

                    return true;
                }),
            getEmail: adminProcedure
                .input(z.number())
                .output(z.string())
                .query(async (opt) => {
                    const email = await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input)
                    )?.getEmail();

                    return email || "unknown";
                }),
            setEmail: adminProcedure
                .input(z.object({ userId: z.number(), email: z.email() }))
                .mutation(async (opt) => {
                    await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input.userId)
                    )?.setEmail(opt.input.email);

                    return true;
                }),
            getIsAdministrator: adminProcedure
                .input(z.number())
                .output(z.boolean())
                .query(async (opt) => {
                    const isAdministrator = await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input)
                    )?.isAdministrator();

                    return isAdministrator || false;
                }),
            setIsAdministrator: adminProcedure
                .input(z.object({ userId: z.number(), administrator: z.boolean() }))
                .mutation(async (opt) => {
                    await (
                        await opt.ctx.instance.sys.users.getUserById(opt.input.userId)
                    )?.setIsAdministrator(opt.input.administrator);

                    return true;
                }),
            delete: adminProcedure.input(z.object({ userId: z.number() })).mutation(async (opt) => {
                await (await opt.ctx.instance.sys.users.getUserById(opt.input.userId))?.delete();

                return true;
            }),
            boop: adminProcedure.input(z.object({ userId: z.number() })).mutation(async (opt) => {
                instance.sys.notifications.send(
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
        isUserAdministrator: procedure.query(async (opt) => {
            let user = await opt.ctx.user();

            if (user) {
                return await user.isAdministrator();
            }

            return this;
        }),
        createUser: procedure.input(z.object({ username: z.string() })).mutation(async (opt) => {
            await opt.ctx.instance.sys.users.createUser(opt.input.username.toLowerCase());

            return true;
        }),
        getFeatures: procedure
            .output(
                z
                    .object({
                        name: z.string(),
                        id: z.string(),
                        enabled: z.boolean(),
                        description: z.string().optional(),
                    })
                    .array(),
            )
            .query(async (opt) => {
                const availableFlags = Object.keys(WorkspacesFeatureFlags);

                return availableFlags.map((f) => {
                    return {
                        name: f,
                        // @ts-ignore
                        id: WorkspacesFeatureFlags[f],
                        enabled: instance.sys.configuration.hasFeature(
                            // @ts-ignore
                            WorkspacesFeatureFlags[f],
                        ),
                        // @ts-ignore
                        description: FEATURE_FLAG_DESCRIPTIONS[WorkspacesFeatureFlags[f]],
                    };
                });
            }),
        setFeature: procedure
            .input(z.object({ id: z.string(), value: z.boolean() }))
            .mutation(async (opt) => {
                if (opt.input.value) {
                    await instance.sys.configuration.enableFeature(opt.input.id);
                } else {
                    await instance.sys.configuration.disableFeature(opt.input.id);
                }

                return true;
            }),
    },
    customization: {
        wallpaper: {
            wallpaperHistory: procedure
                .output(z.object({ name: z.string(), previewSrc: z.string() }).array())
                .query(async (opt) => {
                    const wallpapersPath = path.join(
                        (await opt.ctx.user()).getPath(),
                        "assets/wallpapers",
                    );

                    let output: {
                        name: string;
                        previewSrc: string;
                    }[] = [];

                    for (const wallpaperName of await fs.readdir(wallpapersPath)) {
                        if (
                            wallpaperName === "current.png" ||
                            wallpaperName === "resized" ||
                            !wallpaperName.endsWith(".png")
                        )
                            continue;

                        const wallpaperPath = path.join(wallpapersPath, wallpaperName);

                        output.push({
                            name: wallpaperName,
                            previewSrc:
                                opt.ctx.rawRequest.destinationHostname +
                                (await instance.sys.image.serveImage(
                                    opt.ctx.userId,
                                    wallpaperPath,
                                    {
                                        resize: {
                                            dimensions: { width: 296, height: 192 },
                                        },
                                    },
                                )),
                        });
                    }

                    return output;
                }),
            officialWallpapers: procedure
                .output(z.object({ name: z.string(), previewSrc: z.string() }).array())
                .query(async (opt) => {
                    const officialWallpapersPath = path.join(
                        instance.sys.filesystem.SRC_ROOT,
                        "assets/wallpapers",
                    );

                    let output: {
                        name: string;
                        previewSrc: string;
                    }[] = [];

                    for (const wallpaperName of await fs.readdir(officialWallpapersPath)) {
                        const wallpaperPath = path.join(officialWallpapersPath, wallpaperName);

                        output.push({
                            name: wallpaperName,
                            previewSrc:
                                opt.ctx.rawRequest.destinationHostname +
                                (await instance.sys.image.serveImage(
                                    opt.ctx.userId,
                                    wallpaperPath,
                                )),
                        });
                    }

                    return output;
                }),
            currentWallpaper: procedure.query(async (opt) => {
                const wallpapersRootPath = path.join(
                    (await opt.ctx.user()).getPath(),
                    "assets/wallpapers",
                );
                const rawWallpaperPath = path.join(wallpapersRootPath, "current.png");
                const resizedWallpapersPath = path.join(wallpapersRootPath, "resized");
                const requiredResizedWallpaperPath = path.join(
                    resizedWallpapersPath,
                    `${504}x${280}.png`,
                );

                if (!(await fs.exists(rawWallpaperPath))) {
                    return "/assets/tricolor/tricolor.svg";
                }

                if (!(await fs.exists(requiredResizedWallpaperPath))) {
                    const options = JSON.parse(
                        (
                            await fs.readFile(path.join(wallpapersRootPath, "config.json"))
                        ).toString(),
                    );

                    await instance.sys.image.resizeImage(
                        rawWallpaperPath,
                        requiredResizedWallpaperPath,
                        { width: 504, height: 280 },
                        {
                            changeFormatTo: "png",
                            fit: options?.fit,
                            position: options?.position,
                            background: options?.background,
                        },
                    );
                }

                return (
                    opt.ctx.rawRequest.destinationHostname +
                    (await opt.ctx.instance.sys.image.serveImage(
                        opt.ctx.userId,
                        requiredResizedWallpaperPath,
                        {
                            isPublic: false,
                            dontCachePath: true,
                        },
                    ))
                );
            }),
            upload: procedure.input(octetInputParser).mutation(async (opt) => {
                const wallpapersPath = path.join(
                    (await opt.ctx.user()).getPath(),
                    "assets/wallpapers",
                );

                const wallpaperUUID = Bun.randomUUIDv7();

                const bytes = await opt.input.bytes();

                await sharp(bytes)
                    .toFormat("png")
                    .toFile(path.join(wallpapersPath, `${wallpaperUUID}.png`));

                log.info(
                    `converted '${wallpaperUUID}' to PNG -> '${path.relative(instance.sys.filesystem.FS_ROOT, path.join(wallpapersPath, `${wallpaperUUID}.png`))}'`,
                );

                return wallpaperUUID + ".png";
            }),
            delete: procedure.input(z.object({ name: z.string() })).mutation(async (opt) => {
                const wallpapersPath = path.join(
                    (await opt.ctx.user()).getPath(),
                    "assets/wallpapers",
                );

                await fs.rm(path.join(wallpapersPath, opt.input.name));

                return true;
            }),
            getOptions: procedure
                .output(
                    z.object({
                        fit: z.string(),
                        position: z.tuple([z.string(), z.string()]).or(z.tuple([z.string()])),
                    }),
                )
                .query(async (opt) => {
                    const wallpaperPath = path.join(
                        (await opt.ctx.user()).getPath(),
                        "assets/wallpapers",
                    );

                    if (await fs.exists(path.join(wallpaperPath, "config.json"))) {
                        let options = JSON.parse(
                            (await fs.readFile(path.join(wallpaperPath, "config.json"))).toString(),
                        );

                        options.position = options.position.split(" ");

                        return options;
                    } else {
                        return { fit: "cover", position: ["center"] };
                    }
                }),
            setOptions: procedure
                .input(z.object({ fit: z.string(), position: z.string(), background: z.string() }))
                .mutation(async (opt) => {
                    const wallpaperPath = path.join(
                        (await opt.ctx.user()).getPath(),
                        "assets/wallpapers",
                    );
                    const resizedWallpapersPath = path.join(wallpaperPath, "resized");

                    for (const resizedWallpaper of await fs.readdir(resizedWallpapersPath)) {
                        await fs.rm(path.join(resizedWallpapersPath, resizedWallpaper));
                    }

                    const options = {
                        fit: opt.input.fit,
                        position: opt.input.position,
                        background: opt.input.background || "#0000",
                    };

                    await fs.writeFile(
                        path.join(wallpaperPath, "config.json"),
                        JSON.stringify(options),
                    );

                    return true;
                }),
            setWallpaper: procedure.input(z.object({ name: z.string() })).mutation(async (opt) => {
                const wallpaperPath = path.join(
                    (await opt.ctx.user()).getPath(),
                    "assets/wallpapers",
                );
                const resizedWallpapersPath = path.join(wallpaperPath, "resized");

                for (const resizedWallpaper of await fs.readdir(resizedWallpapersPath)) {
                    await fs.rm(path.join(resizedWallpapersPath, resizedWallpaper));
                }

                await fs.copyFile(
                    path.join(wallpaperPath, opt.input.name.replace(".preview", "")),
                    path.join(wallpaperPath, "current.png"),
                );

                return true;
            }),
            setOfficialWallpaper: procedure
                .input(z.object({ name: z.string() }))
                .mutation(async (opt) => {
                    const wallpaperPath = path.join(
                        (await opt.ctx.user()).getPath(),
                        "assets/wallpapers",
                    );
                    const officialWallpaperPath = path.join(
                        instance.sys.filesystem.SRC_ROOT,
                        "assets/wallpapers",
                    );
                    const resizedWallpapersPath = path.join(wallpaperPath, "resized");

                    for (const resizedWallpaper of await fs.readdir(resizedWallpapersPath)) {
                        await fs.rm(path.join(resizedWallpapersPath, resizedWallpaper));
                    }

                    await fs.copyFile(
                        path.join(officialWallpaperPath, opt.input.name),
                        path.join(wallpaperPath, "current.png"),
                    );

                    return true;
                }),
        },
        colorTheme: {
            wallpaperPixeldata: procedure.output(z.number().array()).query(async (opt) => {
                const wallpaperPath = path.join(
                    (await opt.ctx.user()).getPath(),
                    "assets/wallpapers/resized",
                    `${504}x${280}.png`,
                );

                let buf = (await sharp(wallpaperPath).raw().toBuffer({ resolveWithObject: true }))
                    .data;
                let newBuf = [];

                for (let i = 0; i < buf.length; i += 4) {
                    // RGBA to ARGB
                    newBuf.push(buf[i + 3]);
                    newBuf.push(buf[i]);
                    newBuf.push(buf[i + 1]);
                    newBuf.push(buf[i + 2]);
                }

                // wallpaper pixeldata in ARGB format
                return newBuf;
            }),
        },
    },
    storage: {
        usage: procedure
            .output(
                z
                    .object({ displayName: z.string(), percentage: z.number(), size: z.number() })
                    .array(),
            )
            .query(async (opt) => {
                async function getChildFiles(dir: string) {
                    const children = await fs.readdir(dir);

                    let output: { type: string | undefined; size: number; path: string }[] = [];

                    for (const child of children) {
                        const childPath = path.join(dir, child);
                        const childLstat = await fs.lstat(childPath);

                        if (childLstat.isDirectory()) {
                            output = [...output, ...(await getChildFiles(childPath))];
                        } else {
                            output.push({
                                path: childPath,
                                size: childLstat.size,
                                type: instance.sys.filesystem.getFileType(childPath),
                            });
                        }
                    }

                    return output;
                }

                let files = await getChildFiles((await opt.ctx.user()).getPath());

                let categories: {
                    [categoryId: string]: { fileCount: number; size: number; percentage: number };
                } = {};

                for (const file of files) {
                    if (file.type === undefined) {
                        file.type = "unknown";
                    }

                    if (!categories[file.type]) {
                        categories[file.type] = {
                            fileCount: 0,
                            size: 0,
                            percentage: 0,
                        };
                    }

                    categories[file.type] = {
                        fileCount: categories[file.type].fileCount + 1,
                        size: categories[file.type].size + file.size,
                        percentage: 0,
                    };
                }

                let output: { displayName: string; percentage: number; size: number }[] = [];

                let storageQuota = (await (await opt.ctx.user()).getQuota()) || 1;

                for (const categoryName of Object.keys(categories)) {
                    const category = categories[categoryName];

                    output.push({
                        displayName: categoryName,
                        percentage: Number((category.size / 1000000000 / storageQuota).toFixed(2)),
                        size: category.size / 1000000000,
                    });
                }

                output = output.sort((i, j) => i.size - j.size).reverse();

                return output;
            }),
    },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.settings",
    router: router,
    createContext: createTRPCContext(instance),
});
