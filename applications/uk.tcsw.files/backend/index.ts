/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";
import * as path from "node:path";
import { promises as fs } from "fs";

const log = instance.log.createLogger("uk.tcsw.files");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
    getFileGrid: procedure.input(z.object({ path: z.string(), sortBy: z.enum(["name"]) })).query(async (opt) => {
        const THUMBNAIL_SIZE = 128

        let output: {
            name: string;
            path: string;
            icon?: string;
            type: "directory" | "file";
        }[] = [];

        const finalPath = path.join(instance.subSystems.filesystem.FS_ROOT, opt.input.path);

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
                switch (instance.subSystems.filesystem.getFileType(itemPath)) {
                    case "image": {
                        let resizedFilePath = path.join(
                            path.join(instance.subSystems.filesystem.CACHE_PATH, opt.input.path, item, "resized_128x128.png"),
                        );

                        if (!(await fs.exists(resizedFilePath))) {
                            if (!(await fs.exists(path.join(resizedFilePath, "..")))) {
                                await fs.mkdir(path.join(resizedFilePath, ".."), { recursive: true });
                            }

                            await instance.subSystems.image.resizeImage(itemPath, resizedFilePath, (dimensions) => {
                                let newWidth = THUMBNAIL_SIZE;
                                let newHeight = THUMBNAIL_SIZE;

                                if (dimensions.width > dimensions.height) {
                                    newWidth = THUMBNAIL_SIZE;
                                    newHeight = Math.round((dimensions.height / dimensions.width) * THUMBNAIL_SIZE);
                                }

                                if (dimensions.height > dimensions.width) {
                                    newHeight = THUMBNAIL_SIZE;
                                    newWidth = Math.round((dimensions.height / dimensions.width) * THUMBNAIL_SIZE);
                                }

                                return {
                                    width: newWidth,
                                    height: newHeight,
                                };
                            });
                        }

                        icon =
                            opt.ctx.rawRequest.destinationHostname + instance.subSystems.image.serveImage(opt.ctx.userId, resizedFilePath);
                    }
                }
            }

            let itemName = item;
            const finalItemPath = path.relative(instance.subSystems.filesystem.FS_ROOT, itemPath)

            console.log(finalItemPath.split(itemName)[0]);

            if (finalItemPath.split(itemName)[0] === "users/") {
                itemName += ` (${await (await instance.subSystems.users.getUserById(Number(itemName)))?.getUsername()})`;
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
    getRawFile: procedure.input(z.string()).query(async opt => {
        const finalPath = path.join(instance.subSystems.filesystem.FS_ROOT, opt.input);
        return opt.ctx.rawRequest.destinationHostname + instance.subSystems.filesystem.serveFile(opt.ctx.userId, finalPath);
    }),
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.files",
    router: router,
    createContext: createTRPCContext(instance),
});
