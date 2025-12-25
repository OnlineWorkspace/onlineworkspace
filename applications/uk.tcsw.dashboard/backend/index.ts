/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";
import path from "path";
import fs from "fs/promises";

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
                        const db = instance.subSystems.database.postgres();

                        const { forename, surname, username } = (
                            await db`SELECT forename, surname, username FROM tricolor_workspaces.public.users WHERE id = ${opt.ctx.userId}`
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
        getWallpaperOptions: procedure
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

                let options = JSON.parse(
                    (await fs.readFile(path.join(wallpaperPath, "config.json"))).toString() ||
                        JSON.stringify({ fit: "cover", position: "center" }),
                );

                options.position = options.position.split(" ");

                return options;
            }),
        getWallpaper: procedure
            .input(z.object({ width: z.number(), height: z.number() }))
            .query(async (opt) => {
                const wallpapersRootPath = path.join(
                    (await opt.ctx.user()).getPath(),
                    "assets/wallpapers",
                );
                const rawWallpaperPath = path.join(wallpapersRootPath, "current.png");
                const resizedWallpapersPath = path.join(wallpapersRootPath, "resized");
                const requiredResizedWallpaperPath = path.join(
                    resizedWallpapersPath,
                    `${opt.input.width}x${opt.input.height}.png`,
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

                    await instance.subSystems.image.resizeImage(
                        rawWallpaperPath,
                        requiredResizedWallpaperPath,
                        { width: opt.input.width, height: opt.input.height },
                        {
                            changeFormatTo: "png",
                            fit: options.fit,
                            position: options.position,
                            background: options.background,
                        },
                    );
                }

                return (
                    opt.ctx.rawRequest.destinationHostname +
                    opt.ctx.instance.subSystems.image.serveImage(
                        opt.ctx.userId,
                        requiredResizedWallpaperPath,
                    )
                );
            }),
    },
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.dashboard",
    router: router,
    createContext: createTRPCContext(instance),
});
