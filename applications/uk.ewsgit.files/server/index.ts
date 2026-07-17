/// <reference path="./global.d.ts" />

import * as path from "node:path";
import { FileMediaType } from "@onlineworkspace/workspace-backend/src/systems/filesystem.ts";
import { type createOnlineWorkspaceTRPCContext, procedure } from "@onlineworkspace/workspace-backend/src/systems/trpc/coreRouter.ts";
import * as fs from "@std/fs";
import { initTRPC } from "@trpc/server";
import fastFolderSize from "fast-folder-size/sync.js";
import z from "zod";

const log = instance.log.createLogger("uk.ewsgit.files");

export const t = initTRPC.context<ReturnType<typeof createOnlineWorkspaceTRPCContext>>().create();

const router = t.router({
  /*   getFileGrid: procedure.input(z.object({ path: z.string(), sortBy: z.enum(["name"]) })).query(async (opt) => {
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

    const output: {
      name: string;
      path: string;
      icon?: string;
      type: "directory" | "file" | "alias";
    }[] = [];

    if (!fsExists(finalPath)) {
      return {
        type: "error" as const,
        message: "This directory does not exist!",
        icon: "folder_limited",
      };
    }

    for (const item of await fs.readdir(finalPath)) {
      const itemPath = path.join(finalPath, item);
      const isDirectory = (await fs.lstat(itemPath)).isDirectory();

      let icon: string;

      if (!isDirectory) {
        switch (instance.sys.filesystem.getFileType(itemPath)) {
          case "image": {
            icon =
              opt.ctx.instance.sys.configuration.backendUrl +
              (await instance.sys.image.serveImage(opt.ctx.userId, itemPath, {
                resize: {
                  dimensions: (dimensions) => {
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
        // @ts-ignore
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

    const output: {
      name: string;
      path: string;
      icon?: string;
      type: "directory" | "file" | "alias";
    }[] = [];

    if (!fsExists(finalPath)) {
      return {
        type: "error" as const,
        message: "This directory does not exist!",
        icon: "folder_limited",
      };
    }

    for (const item of await fs.readdir(finalPath)) {
      const itemPath = path.join(finalPath, item);
      const isDirectory = (await fs.lstat(itemPath)).isDirectory();

      let icon: string;

      if (!isDirectory) {
        switch (instance.sys.filesystem.getFileType(itemPath)) {
          case "image": {
            icon =
              opt.ctx.instance.sys.configuration.backendUrl +
              (await instance.sys.image.serveImage(opt.ctx.userId, itemPath, {
                resize: {
                  dimensions: (dimensions) => {
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
        // @ts-ignore
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

    return opt.ctx.instance.sys.configuration.backendUrl + instance.sys.filesystem.serveFile(opt.ctx.userId, finalPath);
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

    if (fsExists(filePath)) return false;

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

    if (fsExists(filePath)) return false;

    if ((await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, filePath)).write) {
      await fs.mkdir(filePath, { recursive: true });
    } else {
      // send a missing permissions notification
      return false;
    }

    return true;
  }),
  getHome: procedure.query(async (opt) => {
    return `/users/${opt.ctx.userId}/fs`;
  }),
  getPlaces: procedure.query(async (opt) => {
    return [
      {
        icon: "house",
        path: `/users/${opt.ctx.userId}/fs`,
        name: "Home",
      },
      {
        icon: "data_usage",
        path: `/`,
        name: "Root",
      },
    ];
  }),
  uploadFile: procedure.input(octetInputParser).mutation(async (opt) => {
    const uuid = randomUUIDv7();
    const uploadFilePath = path.join((await opt.ctx.user()).getPath(), `system/temp/${uuid}`);

    log.info(`Uploading file ${uuid}`);

    const fileResponse = new Response(opt.input);
    await fs.writeFile(uploadFilePath, await fileResponse.bytes());

    return { id: uuid };
  }),
  setUploadMetadata: procedure.input(z.object({ id: z.string(), path: z.string(), lastModified: z.number() })).mutation(async (opt) => {
    const uploadFilePath = path.join((await opt.ctx.user()).getPath(), `system/temp/${opt.input.id}`);
    const actualFilePath = path.join(instance.sys.filesystem.FS_ROOT, `${opt.input.path}`);
    const actualFilePathParentDir = path.join(actualFilePath, "..");

    if (!(await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, actualFilePath)).write) {
      return false;
    }

    if (!fsExists(actualFilePathParentDir)) {
      await fs.mkdir(actualFilePathParentDir, { recursive: true });
    }

    log.info(`Applying metadata to file (${opt.input.id}) '${actualFilePath}'`);

    await fs.rename(uploadFilePath, actualFilePath);
    await fs.utimes(actualFilePath, 0, opt.input.lastModified);

    return true;
  }), */
  userPreferences: {
    get: procedure.query(async (opt) => {
      return {
        showWelcome: false,
        homePath: `remote:/users/${opt.ctx.userId}/fs`,
        pinnedDirectories: [`remote:/users/${opt.ctx.userId}/fs/Photos`, `remote:/users/${opt.ctx.userId}/fs/Documents`],
      };
    }),
  },
  readDirectory: procedure
    .input(z.object({ path: z.string() }))
    .output(
      z
        .object({ items: z.undefined(), status: z.enum(["missing_permission", "invalid_path"]) })
        .or(z.object({ items: z.string().array(), status: z.literal("ok") })),
    )
    .query(async (opt) => {
      const resolvedPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

      log.info(`Read Directory requested by user ${opt.ctx.userId} ${resolvedPath}`);
      const userPermissions = await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, resolvedPath);

      if (!userPermissions.read) {
        return { status: "missing_permission" as const };
      }

      try {
        const directories: Deno.DirEntry[] = [];
        const files: Deno.DirEntry[] = [];

        for await (const entry of Deno.readDir(resolvedPath)) {
          if (entry.isDirectory) {
            directories.push(entry);
          }
          if (entry.isFile) {
            files.push(entry);
          }
        }

        directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

        return { items: [...directories.map((d) => d.name), ...files.map((f) => f.name)], status: "ok" };
      } catch (_) {
        return { status: "invalid_path" as const };
      }
    }),
  view: {
    getEntry: procedure
      .input(z.object({ path: z.string(), thumbnailSize: z.number().optional() }))
      .output(
        z
          .object({
            status: z.literal("ok"),
            data: z.object({
              path: z.string(),
              type: z.enum(["file", "directory", "link"]),
              thumbnail: z.string().optional(),
              shared: z.boolean().optional(),
              size: z.number().optional(),
              hidden: z.boolean().optional(),
              createdAt: z.number().optional(),
              modifiedAt: z.number().optional(),
            }),
          })
          .or(z.object({ status: z.enum(["missing_permission", "invalid_path"]) })),
      )
      .query(async (opt) => {
        const resolvedPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

        log.info(`View entry requested by user ${opt.ctx.userId} ${resolvedPath}`);
        const userPermissions = await instance.sys.filesystem.getUserPermissions(opt.ctx.userId, resolvedPath);

        if (!userPermissions.read) {
          return {
            status: "missing_permission" as const,
          };
        }

        try {
          const itemStats = await Deno.lstat(resolvedPath);

          return {
            status: "ok" as const,
            data: {
              path: opt.input.path,
              type: itemStats.isSymlink ? "link" : itemStats.isDirectory ? "directory" : itemStats.isFile ? "file" : "file",
              // TODO: implement sharing first
              shared: false,
              size: itemStats.size,
              thumbnail:
                opt.input.thumbnailSize !== undefined && itemStats.isFile
                  ? instance.sys.filesystem.getFileType(opt.input.path) === FileMediaType.Image
                    ? await instance.sys.image.serveImage(opt.ctx.userId, resolvedPath, {
                        resize: {
                          fit: "cover",
                          position: "centre",
                          dimensions: { width: opt.input.thumbnailSize, height: Math.floor((opt.input.thumbnailSize / 16) * 9) },
                          changeFormatTo: "webp",
                        },
                      })
                    : undefined
                  : undefined,
              hidden: path.basename(opt.input.path).startsWith("."),
              createdAt: itemStats.ctime?.getMilliseconds(),
              modifiedAt: itemStats.atime?.getMilliseconds(),
            },
          };
        } catch (_) {
          return {
            status: "invalid_path" as const,
          };
        }
      }),
    getGalleryItem: procedure.input(z.object({ path: z.string().or(z.undefined()), height: z.number() })).query(async (opt) => {
      let dimensions: { width: number; height: number } = { width: 0, height: 0 };

      if (opt.input.path === undefined) {
        return { image: "/assets/generic_background.svg", dimensions };
      }

      const resolvedPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

      return {
        image:
          instance.sys.filesystem.getFileType(opt.input.path) === FileMediaType.Image
            ? await instance.sys.image.serveImage(opt.ctx.userId, resolvedPath, {
                resize: {
                  fit: "cover",
                  position: "centre",
                  dimensions: ({ width: fileWidth, height: fileHeight }) => {
                    dimensions = { width: fileWidth, height: fileHeight };

                    return { width: Math.floor((fileWidth / fileHeight) * opt.input.height), height: opt.input.height };
                  },
                  changeFormatTo: "webp",
                },
              })
            : undefined,
        dimensions,
      };
    }),
  },
  quota: procedure.output(z.object({ currentUsage: z.number(), maximum: z.number() })).query(async (opt) => {
    const quotaMax = (await (await opt.ctx.user()).getQuota()) || 8589934592;

    return {
      maximum: Number(quotaMax),
      currentUsage: fastFolderSize((await opt.ctx.user()).getPath()) || -1,
    };
  }),
  previewDialog: {
    get: procedure.input(z.object({ path: z.string() })).query(async (opt) => {
      const resolvedPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

      const pathStat = await Deno.lstat(resolvedPath);

      const fileType = !pathStat.isDirectory ? instance.sys.filesystem.getFileType(resolvedPath) : "directory";

      let imageDimensions: { width: number; height: number } = { width: 0, height: 0 };

      return {
        status: "ok" as const,
        data: {
          assets:
            fileType === FileMediaType.Image
              ? {
                  original: await instance.sys.image.serveImage(opt.ctx.userId, resolvedPath),
                  small: await instance.sys.image.serveImage(opt.ctx.userId, resolvedPath, {
                    resize: {
                      dimensions: (original) => {
                        imageDimensions = original;

                        return { width: 1024, height: Math.floor((original.height / original.width) * 1024) };
                      },
                    },
                  }),
                }
              : undefined,
          metadata: {
            size: pathStat.size,
            type: pathStat.isSymlink ? "link" : pathStat.isDirectory ? "directory" : pathStat.isFile ? "file" : "file",
            itemCount: pathStat.isDirectory ? Deno.readDirSync(resolvedPath).toArray().length : undefined,
            pixelate: imageDimensions.width !== 0 && imageDimensions.height !== 0 && imageDimensions.width < 640 && imageDimensions.height < 640,
          },
        },
      };
    }),
  },
  create: {
    directory: procedure.input(z.object({ path: z.string() })).mutation(async (opt) => {
      const resolvedPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);

      try {
        await Deno.mkdir(resolvedPath, { recursive: true });

        return {
          status: "ok" as const,
        };
      } catch (err) {
        log.error("dir creation error", err);

        return {
          status: "already_exists" as const,
        };
      }
    }),
    file: procedure.input(z.object({ path: z.string(), template: z.string().or(z.undefined()) })).mutation(async (opt) => {
      const resolvedPath = path.join(instance.sys.filesystem.FS_ROOT, opt.input.path);
      const FILE_TEMPLATE_PATH = path.join(instance.sys.filesystem.SYSTEM_PATH, "fs_template_files");
      let templateContents = "";

      if (opt.input.template !== undefined) {
        const templateFilePath = path.join(FILE_TEMPLATE_PATH, opt.input.template);
        if (await fs.exists(templateFilePath)) {
          const textDecoder = new TextDecoder();
          templateContents = textDecoder.decode(await Deno.readFile(templateFilePath));
        }
      }

      try {
        if (await fs.exists(resolvedPath)) {
          return { status: "already_exists" as const };
        }

        const textEncoder = new TextEncoder();

        await Deno.writeFile(resolvedPath, textEncoder.encode(templateContents));

        return {
          status: "ok" as const,
        };
      } catch (err) {
        log.error("file creation error", err);

        return {
          status: "already_exists" as const,
        };
      }
    }),
  },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registerTRPCRouter(router, "/api/app/uk.ewsgit.files");
