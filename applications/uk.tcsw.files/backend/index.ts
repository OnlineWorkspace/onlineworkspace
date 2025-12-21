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
        let output: {
            name: string;
            path: string;
            icon: string;
            type: "directory" | "file";
        }[] = [];

        const finalPath = path.join(instance.subSystems.filesystem.FS_ROOT, opt.input.path);

        for (const item of await fs.readdir(finalPath)) {
            const itemPath = path.join(finalPath, item);

            let icon = "/assets/tricolor/tricolor.svg";

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
                            let newWidth = 128;
                            let newHeight = 128;

                            if (dimensions.width > dimensions.height) {
                                newWidth = 128;
                                newHeight = Math.round((dimensions.height / dimensions.width) * 128);
                            }

                            if (dimensions.height > dimensions.width) {
                                newHeight = 128;
                                newWidth = Math.round((dimensions.height / dimensions.width) * 128);
                            }

                            return {
                                width: newWidth,
                                height: newHeight,
                            };
                        });
                    }

                    icon = opt.ctx.rawRequest.destinationHostname + instance.subSystems.image.serveImage(opt.ctx.userId, resizedFilePath);
                }
            }

            output.push({
                name: item,
                path: path.relative(instance.subSystems.filesystem.FS_ROOT, itemPath),
                icon: icon,
                type: (await fs.lstat(itemPath)).isDirectory() ? "directory" : "file",
            });
        }

        return output;
    }),
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.files",
    router: router,
    createContext: createTRPCContext(instance),
});
