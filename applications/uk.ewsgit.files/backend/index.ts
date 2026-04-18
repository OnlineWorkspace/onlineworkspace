/// <reference path="./global.d.ts" />

import { promises as fs, existsSync as fsExists } from "node:fs";
import * as path from "node:path";
import { createTRPCContext, procedure } from "@onlineworkspace/workspace-instance/src/systems/trpcRouter.js";
import { initTRPC } from "@trpc/server";
import { octetInputParser } from "@trpc/server/http";
import { randomUUIDv7 } from "bun";
import z from "zod";

const log = instance.log.createLogger("uk.ewsgit.files");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
  // getFileGrid: procedure.input(z.object({ path: z.string(), sortBy: z.enum(["name"]) })).query(async (opt) => {
  //   const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);
  //
  //   if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
  //     // send a missing permissions notification
  //     return {
  //       type: "error" as const,
  //       message: "You cannot access this location!",
  //       icon: "folder_limited",
  //     };
  //   }
  //
  //   const THUMBNAIL_SIZE = 128;
  //
  //   const output: {
  //     name: string;
  //     path: string;
  //     icon?: string;
  //     type: "directory" | "file" | "alias";
  //   }[] = [];
  //
  //   if (!fsExists(finalPath)) {
  //     return {
  //       type: "error" as const,
  //       message: "This directory does not exist!",
  //       icon: "folder_limited",
  //     };
  //   }
  //
  //   for (const item of await fs.readdir(finalPath)) {
  //     const itemPath = path.join(finalPath, item);
  //     const isDirectory = (await fs.lstat(itemPath)).isDirectory();
  //
  //     let icon: string;
  //
  //     if (!isDirectory) {
  //       switch (instance.sys.filesystem.getFileType(itemPath)) {
  //         case "image": {
  //           icon =
  //             opt.ctx.instance.sys.configuration.backendUrl +
  //             (await instance.sys.image.serveImage(opt.ctx.userId, itemPath, {
  //               resize: {
  //                 dimensions: (dimensions) => {
  //                   let newWidth = THUMBNAIL_SIZE;
  //                   let newHeight = THUMBNAIL_SIZE;
  //
  //                   if (dimensions.width > dimensions.height) {
  //                     newWidth = THUMBNAIL_SIZE;
  //                     newHeight = Math.round((dimensions.height / dimensions.width) * THUMBNAIL_SIZE);
  //                   }
  //
  //                   if (dimensions.height > dimensions.width) {
  //                     newHeight = THUMBNAIL_SIZE;
  //                     newWidth = Math.round((dimensions.height / dimensions.width) * THUMBNAIL_SIZE);
  //                   }
  //
  //                   return {
  //                     width: newWidth,
  //                     height: newHeight,
  //                   };
  //                 },
  //               },
  //             }));
  //         }
  //       }
  //     }
  //
  //     let itemName = item;
  //     const finalItemPath = path.relative(instance.sys.filesystem.FS_ROOT, itemPath);
  //
  //     if (finalItemPath.split(itemName)[0] === "users/") {
  //       itemName += ` (${await (await instance.sys.users.getUserById(Number(itemName)))?.getUsername()})`;
  //     }
  //
  //     output.push({
  //       name: itemName,
  //       path: finalItemPath,
  //       // @ts-ignore
  //       icon: icon,
  //       type: isDirectory ? "directory" : "file",
  //     });
  //   }
  //
  //   if (output.length < 1) {
  //     return {
  //       type: "info" as const,
  //       message: "This directory is empty",
  //       icon: "folder",
  //     };
  //   }
  //
  //   return { type: "success" as const, items: output };
  // }),
  // getFileList: procedure.input(z.object({ path: z.string(), sortBy: z.enum(["name"]) })).query(async (opt) => {
  //   const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);
  //
  //   if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
  //     // send a missing permissions notification
  //     return {
  //       type: "error" as const,
  //       message: "You cannot access this location!",
  //       icon: "folder_limited",
  //     };
  //   }
  //
  //   const THUMBNAIL_SIZE = 32;
  //
  //   const output: {
  //     name: string;
  //     path: string;
  //     icon?: string;
  //     type: "directory" | "file" | "alias";
  //   }[] = [];
  //
  //   if (!fsExists(finalPath)) {
  //     return {
  //       type: "error" as const,
  //       message: "This directory does not exist!",
  //       icon: "folder_limited",
  //     };
  //   }
  //
  //   for (const item of await fs.readdir(finalPath)) {
  //     const itemPath = path.join(finalPath, item);
  //     const isDirectory = (await fs.lstat(itemPath)).isDirectory();
  //
  //     let icon: string;
  //
  //     if (!isDirectory) {
  //       switch (instance.sys.filesystem.getFileType(itemPath)) {
  //         case "image": {
  //           icon =
  //             opt.ctx.instance.sys.configuration.backendUrl +
  //             (await instance.sys.image.serveImage(opt.ctx.userId, itemPath, {
  //               resize: {
  //                 dimensions: (dimensions) => {
  //                   let newWidth = THUMBNAIL_SIZE;
  //                   let newHeight = THUMBNAIL_SIZE;
  //
  //                   if (dimensions.width > dimensions.height) {
  //                     newWidth = THUMBNAIL_SIZE;
  //                     newHeight = Math.round((dimensions.height / dimensions.width) * THUMBNAIL_SIZE);
  //                   }
  //
  //                   if (dimensions.height > dimensions.width) {
  //                     newHeight = THUMBNAIL_SIZE;
  //                     newWidth = Math.round((dimensions.height / dimensions.width) * THUMBNAIL_SIZE);
  //                   }
  //
  //                   return {
  //                     width: newWidth,
  //                     height: newHeight,
  //                   };
  //                 },
  //               },
  //             }));
  //         }
  //       }
  //     }
  //
  //     let itemName = item;
  //     const finalItemPath = path.relative(instance.sys.filesystem.FS_ROOT, itemPath);
  //
  //     if (finalItemPath.split(itemName)[0] === "users/") {
  //       itemName += ` (${await (await instance.sys.users.getUserById(Number(itemName)))?.getUsername()})`;
  //     }
  //
  //     output.push({
  //       name: itemName,
  //       path: finalItemPath,
  //       // @ts-ignore
  //       icon: icon,
  //       type: isDirectory ? "directory" : "file",
  //     });
  //   }
  //
  //   if (output.length < 1) {
  //     return {
  //       type: "info" as const,
  //       message: "This directory is empty",
  //       icon: "folder",
  //     };
  //   }
  //
  //   return { type: "success" as const, items: output };
  // }),
  // getRawFile: procedure.input(z.string()).query(async (opt) => {
  //   const finalPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input);
  //   if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
  //     return "You lack the required permissions to access this resource!";
  //   }
  //
  //   return opt.ctx.instance.sys.configuration.backendUrl + instance.sys.filesystem.serveFile(opt.ctx.userId, finalPath);
  // }),
  // batchMove: procedure.input(z.object({ path: z.string(), newPath: z.string() }).array()).mutation(async (opt) => {
  //   for (const item of opt.input) {
  //     if (item.path === item.newPath) continue;
  //     // TODO: send a failure notification
  //     if (path.join(item.newPath, "..") === "users") continue;
  //     if (path.join(item.path, "..") === "users") continue;
  //
  //     const finalPath = path.join(instance.sys.filesystem.FS_ROOT, item.path);
  //     const finalNewPath = path.join(instance.sys.filesystem.FS_ROOT, item.newPath);
  //
  //     try {
  //       if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
  //         if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalNewPath)).write) {
  //           await fs.rename(finalPath, finalNewPath);
  //         } else {
  //           // send a missing permissions notification
  //           return false;
  //         }
  //       } else {
  //         // send a missing permissions notification
  //         return false;
  //       }
  //     } catch (err) {
  //       log.error(err);
  //     }
  //   }
  // }),
  // batchCopy: procedure.input(z.object({ path: z.string(), newPath: z.string() }).array()).mutation(async (opt) => {
  //   for (const item of opt.input) {
  //     if (item.path === item.newPath) continue;
  //     // TODO: send a failure notification
  //     if (path.join(item.newPath, "..") === "users") continue;
  //     if (path.join(item.path, "..") === "users") continue;
  //
  //     const finalPath = path.join(instance.sys.filesystem.FS_ROOT, item.path);
  //     const finalNewPath = path.join(instance.sys.filesystem.FS_ROOT, item.newPath);
  //
  //     try {
  //       if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalPath)).read) {
  //         if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, finalNewPath)).write) {
  //           await fs.cp(finalPath, finalNewPath, { recursive: true });
  //         } else {
  //           // send a missing permissions notification
  //           return false;
  //         }
  //       } else {
  //         // send a missing permissions notification
  //         return false;
  //       }
  //     } catch (err) {
  //       log.error(err);
  //     }
  //   }
  //
  //   return true;
  // }),
  // batchDelete: procedure.input(z.string().array()).mutation(async (opt) => {
  //   for (const item of opt.input) {
  //     const itemPath = path.join(instance.sys.filesystem.FS_ROOT, item);
  //
  //     try {
  //       if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, itemPath)).write) {
  //         await fs.rm(itemPath, { recursive: true });
  //       } else {
  //         // send a missing permissions notification
  //         return false;
  //       }
  //     } catch (err) {
  //       log.error(err);
  //     }
  //   }
  //
  //   return true;
  // }),
  // createFile: procedure.input(z.object({ filePath: z.string() })).mutation(async (opt) => {
  //   const filePath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.filePath);
  //
  //   if (fsExists(filePath)) return false;
  //
  //   if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, filePath)).write) {
  //     await fs.writeFile(filePath, "");
  //   } else {
  //     // send a missing permissions notification
  //     return false;
  //   }
  //
  //   return true;
  // }),
  // createDirectory: procedure.input(z.object({ directoryPath: z.string() })).mutation(async (opt) => {
  //   const filePath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.directoryPath);
  //
  //   if (fsExists(filePath)) return false;
  //
  //   if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, filePath)).write) {
  //     await fs.mkdir(filePath, { recursive: true });
  //   } else {
  //     // send a missing permissions notification
  //     return false;
  //   }
  //
  //   return true;
  // }),
  // getHome: procedure.query(async (opt) => {
  //   return `/users/${opt.ctx.userId}/fs`;
  // }),
  // getPlaces: procedure.query(async (opt) => {
  //   return [
  //     {
  //       icon: "house",
  //       path: `/users/${opt.ctx.userId}/fs`,
  //       name: "Home",
  //     },
  //     {
  //       icon: "data_usage",
  //       path: `/`,
  //       name: "Root",
  //     },
  //   ];
  // }),
  // uploadFile: procedure.input(octetInputParser).mutation(async (opt) => {
  //   const uuid = randomUUIDv7();
  //   const uploadFilePath = path.join((await opt.ctx.user()).getPath(), `system/temp/${uuid}`);
  //
  //   log.info(`Uploading file ${uuid}`);
  //
  //   const fileResponse = new Response(opt.input);
  //   await fs.writeFile(uploadFilePath, await fileResponse.bytes());
  //
  //   return { id: uuid };
  // }),
  // setUploadMetadata: procedure.input(z.object({ id: z.string(), path: z.string(), lastModified: z.number() })).mutation(async (opt) => {
  //   const uploadFilePath = path.join((await opt.ctx.user()).getPath(), `system/temp/${opt.input.id}`);
  //   const actualFilePath = path.join(instance.sys.filesystem.FS_ROOT, `${opt.input.path}`);
  //   const actualFilePathParentDir = path.join(actualFilePath, "..");
  //
  //   if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, actualFilePath)).write) {
  //     return false;
  //   }
  //
  //   if (!fsExists(actualFilePathParentDir)) {
  //     await fs.mkdir(actualFilePathParentDir, { recursive: true });
  //   }
  //
  //   log.info(`Applying metadata to file (${opt.input.id}) '${actualFilePath}'`);
  //
  //   await fs.rename(uploadFilePath, actualFilePath);
  //   await fs.utimes(actualFilePath, 0, opt.input.lastModified);
  //
  //   return true;
  // }),
  userPreferences: {
    get: procedure.query(async (opt) => {
      return {
        showWelcome: false,
        homePath: `/Users/${opt.ctx.userId}/fs/`,
      };
    }),
  },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
  basePath: "/api/app/uk.ewsgit.files",
  router: router,
  createContext: createTRPCContext(instance),
});
