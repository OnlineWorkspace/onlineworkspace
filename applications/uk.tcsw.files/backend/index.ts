/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/systems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";
import * as path from "node:path";
import { promises as fs } from "fs";

const log = instance.log.createLogger("uk.tcsw.files");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
    getFileGrid: procedure.input(z.object({ path: z.string(), sortBy: z.enum(["name"]) })).query(async (opt) => {
        const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

        if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
            // send a missing permissions notification
            return {
                type: "error" as const,
                message: "You cannot access this location!",
                icon: "folder_limited",
            };
        }

        const THUMBNAIL_SIZE = 128;

        let output: {
            name: string;
            path: string;
            icon?: string;
            type: "directory" | "file" | "alias";
        }[] = [];

        if (!(await fs.exists(finalPath))) {
            return {
                type: "error" as const,
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
                                                (dimensions.height / dimensions.width) * THUMBNAIL_SIZE,
                                            );
                                        }

                                        if (dimensions.height > dimensions.width) {
                                            newHeight = THUMBNAIL_SIZE;
                                            newWidth = Math.round(
                                                (dimensions.height / dimensions.width) * THUMBNAIL_SIZE,
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
                type: "info" as const,
                message: "This directory is empty",
                icon: "folder",
            };
        }

        return { type: "success" as const, items: output };
    }),
    getFileList: procedure.input(z.object({ path: z.string(), sortBy: z.enum(["name"]) })).query(async (opt) => {
        const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

        if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
            // send a missing permissions notification
            return {
                type: "error" as const,
                message: "You cannot access this location!",
                icon: "folder_limited",
            };
        }

        const THUMBNAIL_SIZE = 32;

        let output: {
            name: string;
            path: string;
            icon?: string;
            type: "directory" | "file" | "alias";
        }[] = [];

        if (!(await fs.exists(finalPath))) {
            return {
                type: "error" as const,
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
                                                (dimensions.height / dimensions.width) * THUMBNAIL_SIZE,
                                            );
                                        }

                                        if (dimensions.height > dimensions.width) {
                                            newHeight = THUMBNAIL_SIZE;
                                            newWidth = Math.round(
                                                (dimensions.height / dimensions.width) * THUMBNAIL_SIZE,
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
                type: "info" as const,
                message: "This directory is empty",
                icon: "folder",
            };
        }

        return { type: "success" as const, items: output };
    }),
    getRawFile: procedure.input(z.string()).query(async (opt) => {
        const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input);
        if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
            return "You lack the required permissions to access this resource!";
        }

        return opt.ctx.rawRequest.destinationHostname + instance.sys.filesystem.serveFile(opt.ctx.userId, finalPath);
    }),
    batchMove: procedure.input(z.object({ path: z.string(), newPath: z.string() }).array()).mutation(async (opt) => {
        for (const item of opt.input) {
            if (item.path === item.newPath) continue;
            // TODO: send a failure notification
            if (path.join(item.newPath, "..") === "users") continue;
            if (path.join(item.path, "..") === "users") continue;

            const finalPath = path.join(instance.sys.filesystem.FS_ROOT, item.path);
            const finalNewPath = path.join(instance.sys.filesystem.FS_ROOT, item.newPath);

            try {
                if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
                    if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalNewPath)).write) {
                        await fs.rename(finalPath, finalNewPath);
                    } else {
                        // send a missing permissions notification
                        return false;
                    }
                } else {
                    // send a missing permissions notification
                    return false;
                }
            } catch (err) {
                log.error(err);
            }
        }
    }),
    batchCopy: procedure.input(z.object({ path: z.string(), newPath: z.string() }).array()).mutation(async (opt) => {
        for (const item of opt.input) {
            if (item.path === item.newPath) continue;
            // TODO: send a failure notification
            if (path.join(item.newPath, "..") === "users") continue;
            if (path.join(item.path, "..") === "users") continue;

            const finalPath = path.join(instance.sys.filesystem.FS_ROOT, item.path);
            const finalNewPath = path.join(instance.sys.filesystem.FS_ROOT, item.newPath);

            try {
                if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
                    if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalNewPath)).write) {
                        await fs.cp(finalPath, finalNewPath, { recursive: true });
                    } else {
                        // send a missing permissions notification
                        return false;
                    }
                } else {
                    // send a missing permissions notification
                    return false;
                }
            } catch (err) {
                log.error(err);
            }
        }

        return true;
    }),
    batchDelete: procedure.input(z.string().array()).mutation(async (opt) => {
        for (const item of opt.input) {
            const itemPath = path.join(instance.sys.filesystem.FS_ROOT, item);

            try {
                if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, itemPath)).write) {
                    await fs.rm(itemPath, { recursive: true });
                } else {
                    // send a missing permissions notification
                    return false;
                }
            } catch (err) {
                log.error(err);
            }
        }

        return true;
    }),
    createFile: procedure.input(z.object({ filePath: z.string() })).mutation(async (opt) => {
        const filePath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.filePath);

        if (await fs.exists(filePath)) return false;

        if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, filePath)).write) {
            await fs.writeFile(filePath, "");
        } else {
            // send a missing permissions notification
            return false;
        }

        return true;
    }),
    createDirectory: procedure.input(z.object({ directoryPath: z.string() })).mutation(async (opt) => {
        const filePath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.directoryPath);

        if (await fs.exists(filePath)) return false;

        if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, filePath)).write) {
            await fs.mkdir(filePath, { recursive: true });
        } else {
            // send a missing permissions notification
            return false;
        }

        return true;
    }),
    getHome: procedure.query(async (opt) => {
        return `/users/${opt.ctx.userId}`;
    }),
    getPlaces: procedure.query(async (opt) => {
        return [
            {
                icon: "house",
                path: `/users/${opt.ctx.userId}`,
                name: "Home",
            },
            {
                icon: "data_usage",
                path: `/`,
                name: "Root",
            },
        ];
    }),
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.files",
    router: router,
    createContext: createTRPCContext(instance),
});
