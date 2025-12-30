/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/systems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";
import * as path from "node:path";
import { promises as fs } from "fs";

const log = instance.log.createLogger("uk.tcsw.files");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
    getFileGrid: procedure
        .input(z.object({ path: z.string(), sortBy: z.enum(["name"]) }))
        .query(async (opt) => {
            const THUMBNAIL_SIZE = 128;

            let output: {
                name: string;
                path: string;
                icon?: string;
                type: "directory" | "file";
            }[] = [];

            const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

            if (!(await fs.exists(finalPath))) {
                return {
                    type: "error",
                    message: "This directory does not exist!",
                    icon: "folder_limited",
                };
            }

            for (const item of await fs.readdir(finalPath)) {
                const itemPath = path.join(finalPath, item);
                const isDirectory = (await fs.lstat(itemPath)).isDirectory();

                let icon = undefined;

                if (!isDirectory) {
                    switch (instance.sys.filesystem.getFileType(itemPath)) {
                        case "image": {
                            icon =
                                opt.ctx.rawRequest.destinationHostname +
                                (await instance.sys.image.serveImage(opt.ctx.userId, itemPath, {
                                    resize: {
                                        dimensions: (dimensions) => {
                                            let newWidth = THUMBNAIL_SIZE;
                                            let newHeight = THUMBNAIL_SIZE;

                                            if (dimensions.width > dimensions.height) {
                                                newWidth = THUMBNAIL_SIZE;
                                                newHeight = Math.round(
                                                    (dimensions.height / dimensions.width) *
                                                        THUMBNAIL_SIZE,
                                                );
                                            }

                                            if (dimensions.height > dimensions.width) {
                                                newHeight = THUMBNAIL_SIZE;
                                                newWidth = Math.round(
                                                    (dimensions.height / dimensions.width) *
                                                        THUMBNAIL_SIZE,
                                                );
                                            }

                                            return {
                                                width: newWidth,
                                                height: newHeight,
                                            };
                                        },
                                    },
                                }));
                        }
                    }
                }

                let itemName = item;
                const finalItemPath = path.relative(instance.sys.filesystem.FS_ROOT, itemPath);

                if (finalItemPath.split(itemName)[0] === "users/") {
                    itemName += ` (${await (await instance.sys.users.getUserById(Number(itemName)))?.getUsername()})`;
                }

                output.push({
                    name: itemName,
                    path: finalItemPath,
                    icon: icon,
                    type: isDirectory ? "directory" : "file",
                });
            }

            if (output.length < 1) {
                return {
                    type: "info",
                    message: "This directory is empty",
                    icon: "folder",
                };
            }

            return { type: "success", items: output };
        }),
    getRawFile: procedure.input(z.string()).query(async (opt) => {
        const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input);
        return (
            opt.ctx.rawRequest.destinationHostname +
            instance.sys.filesystem.serveFile(opt.ctx.userId, finalPath)
        );
    }),
    move: procedure
        .input(z.object({ path: z.string(), newPath: z.string() }))
        .mutation(async (opt) => {
            // TODO: send a failure notification
            if (path.join(opt.input.newPath, "..") === "users") return false;
            if (path.join(opt.input.path, "..") === "users") return false;

            const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);
            const finalNewPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.newPath);

            try {
                await fs.rename(finalPath, finalNewPath);

                return true;
            } catch (err) {
                log.error(err);

                return false;
            }
        }),
    copy: procedure
        .input(z.object({ path: z.string(), newPath: z.string() }))
        .mutation(async (opt) => {
            // TODO: send a failure notification
            if (path.join(opt.input.newPath, "..") === "users") return false;
            if (path.join(opt.input.path, "..") === "users") return false;

            const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);
            const finalNewPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.newPath);

            try {
                await fs.cp(finalPath, finalNewPath, { recursive: true });

                return true;
            } catch (err) {
                log.error(err);

                return false;
            }
        }),
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.files",
    router: router,
    createContext: createTRPCContext(instance),
});
