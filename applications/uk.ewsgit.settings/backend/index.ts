/// <reference path="./global.d.ts" />

import { existsSync as fsExistsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { AuthorizedDeviceType, SESSION_VALID_TERM_MS } from "@onlineworkspace/workspace-instance/src/systems/authorization.js";
import { FEATURE_FLAG_DESCRIPTIONS, WorkspacesFeatureFlags } from "@onlineworkspace/workspace-instance/src/systems/configuration.js";
import { WorkspacesNotificationPriority } from "@onlineworkspace/workspace-instance/src/systems/notifications.js";
import { GlobalApplicationSetting } from "@onlineworkspace/workspace-instance/src/systems/settings/applicationSetting/applicationSetting.js";
import { adminProcedure, createTRPCContext, procedure } from "@onlineworkspace/workspace-instance/src/systems/trpcRouter.js";
import { initTRPC, TRPCError } from "@trpc/server";
import { octetInputParser } from "@trpc/server/http";
import sharp from "sharp";
import z from "zod";

const log = instance.log.createLogger("uk.ewsgit.settings");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const router = t.router({
  overview: {
    user: {
      fullName: procedure.output(z.string()).query(async (opt) => {
        const fullName = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.getFullName();

        return `${fullName?.forename} ${fullName?.surname || ""}` || "Unknown User";
      }),
      role: procedure.output(z.string()).query(async (opt) => {
        const isAdministrator = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.isAdministrator();

        return isAdministrator ? "Administrator" : "User";
      }),
      getAvatar: procedure.output(z.string()).query(async (opt) => {
        return `${opt.ctx.instance.sys.configuration.backendUrl}/api/user/me/avatar/l`;
      }),
    },
  },
  profile: {
    getName: procedure.output(z.string()).query(async (opt) => {
      const fullName = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.getFullName();

      return `${fullName?.forename} ${fullName?.surname || ""}` || "Unknown User";
    }),
    setName: procedure.input(z.string()).mutation(async (opt) => {
      const fullNameSplit = opt.input.split(" ");

      await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.setFullName(fullNameSplit.shift() || "Unknown", fullNameSplit.join(" "));

      return true;
    }),
    getUsername: procedure.output(z.string()).query(async (opt) => {
      const username = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.getUsername();

      return username || "unknown";
    }),
    setUsername: procedure.input(z.string()).mutation(async (opt) => {
      await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.setUsername(opt.input.toLowerCase());

      return true;
    }),
    getGender: procedure.output(z.string()).query(async (opt) => {
      const gender = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.getGender();

      return gender || "female";
    }),
    setGender: procedure.input(z.string()).mutation(async (opt) => {
      if (opt.input !== "male" && opt.input !== "female" && opt.input !== "other") return;

      await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.setGender(opt.input);

      return true;
    }),
    getEmail: procedure.output(z.string()).query(async (opt) => {
      const email = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.getEmail();

      return email || "unknown";
    }),
    setEmail: procedure.input(z.email()).mutation(async (opt) => {
      await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.setEmail(opt.input);

      return true;
    }),
    getBio: procedure.output(z.string()).query(async (opt) => {
      const bio = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.getBio();

      return bio || "";
    }),
    setBio: procedure.input(z.string()).mutation(async (opt) => {
      await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.setBio(opt.input);

      return true;
    }),
    getRole: procedure.output(z.string()).query(async (opt) => {
      const isAdministrator = await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.isAdministrator();

      return isAdministrator ? "Administrator" : "User";
    }),
    setProfilePicture: procedure.input(octetInputParser).mutation(async (opt) => {
      const user = await opt.ctx.user();
      const userPath = user.getPath();

      if (!userPath) return false;

      const filePath = path.join(userPath, "system/temp/avatar");

      const fileResponse = new Response(opt.input);
      await fs.writeFile(filePath, await fileResponse.bytes());

      await user.setAvatar(filePath);
      await user.generateAvatars(true);

      opt.ctx.instance.sys.notifications.send(
        user.userId,
        "uk.ewsgit.settings.profile.setProfilePicture",
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
      return `${opt.ctx.instance.sys.configuration.backendUrl}/api/user/me/avatar/l`;
    }),
  },
  authentication: {
    hasPassword: procedure.output(z.boolean()).query(async (opt) => {
      return instance.sys.authorization.hasPassword(opt.ctx.userId);
    }),
    hasTwoFactor: procedure.output(z.boolean()).query(async (opt) => {
      return await instance.sys.authorization.hasTwoFactorAuthenticationSecret(opt.ctx.userId);
    }),
    hasPasskey: procedure.output(z.boolean()).query(async (opt) => {
      return await instance.sys.authorization.hasPasskey(opt.ctx.userId);
    }),
    requestNewPasskey: procedure.mutation(async (opt) => {
      return opt.ctx.instance.sys.authorization.requestNewPasskey(opt.ctx.userId);
    }),
    registerPasskey: procedure.input(z.any()).mutation(async (opt) => {
      return opt.ctx.instance.sys.authorization.registerPasskey(opt.ctx.userId, opt.input);
    }),
    getPasskeys: procedure
      .output(
        z
          .object({
            id: z.string(),
            creationTimestamp: z.string(),
            lastUsedTimestamp: z.string(),
            deviceType: z.string(),
            usedTimes: z.string(),
          })
          .array(),
      )
      .query(async (opt) => {
        const db = instance.sys.database.postgres();

        const passkeys =
          await db`SELECT passkey_id, creation_timetamp, last_used_timestamp, device_type, counter FROM public.passkeys WHERE user_id = ${opt.ctx.userId}`;

        return passkeys.map((passkey: { passkey_id: string; creation_timetamp: Date; last_used_timestamp: Date; device_type: string; counter: string }) => {
          return {
            id: passkey.passkey_id,
            creationTimestamp: passkey.creation_timetamp.toString() || "",
            lastUsedTimestamp: passkey.last_used_timestamp.toString() || "",
            deviceType: passkey.device_type,
            usedTimes: passkey.counter,
          };
        });
      }),
    removePasskey: procedure.input(z.object({ id: z.string() })).mutation(async (opt) => {
      await instance.sys.authorization.removePasskey(opt.ctx.userId, opt.input.id);

      return { success: true };
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
            loginMethod: z.string(),
          })
          .array(),
      )
      .query(async (opt) => {
        const user = await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId);

        if (!user) return [];

        const db = instance.sys.database.postgres();

        const sessions =
          (await db`SELECT session_id, device_type, valid_until, ip_address, session_token FROM public.sessions WHERE user_id = ${user.userId}`) as {
            session_id: number;
            device_type: AuthorizedDeviceType;
            valid_until: number;
            ip_address: string;
            session_token: string;
            login_method: string;
          }[];

        const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

        if (cookieString === null) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "missing auth cookie",
          });
        }

        const parsedCookie = Bun.Cookie.parse(cookieString);

        const [_, _userId, token] = decodeURIComponent(parsedCookie.value).split(":");

        return sessions.map((s) => {
          return {
            sessionId: s.session_id,
            deviceType: s.device_type,
            firstLoginTimestamp: s.valid_until - SESSION_VALID_TERM_MS,
            ipAddress: s.ip_address,
            isCurrent: s.session_token === token,
            loginMethod: s.login_method || "Unknown",
          };
        });
      }),
    setPassword: procedure.input(z.object({ password: z.string() })).mutation(async (opt) => {
      await opt.ctx.instance.sys.authorization.setPassword(opt.ctx.userId, opt.input.password);

      return true;
    }),
    deleteSession: procedure.input(z.object({ sessionId: z.number() })).mutation(async (opt) => {
      await opt.ctx.instance.sys.authorization.endSessionById(opt.ctx.userId, opt.input.sessionId);

      return true;
    }),
  },
  instance: {
    hasFeature: procedure
      .input(z.string())
      .output(z.boolean())
      .query(async (opt) => {
        return opt.ctx.instance.sys.configuration.hasFeature(opt.input);
      }),
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
          const forename = await (await opt.ctx.instance.sys.users.getUserById(opt.input))?.getForename();

          return `${forename}`;
        }),
      setForename: adminProcedure.input(z.object({ userId: z.number(), forename: z.string() })).mutation(async (opt) => {
        await (await opt.ctx.instance.sys.users.getUserById(opt.input.userId))?.setForename(opt.input.forename);

        return true;
      }),
      getSurname: adminProcedure
        .input(z.number())
        .output(z.string())
        .query(async (opt) => {
          const surname = await (await opt.ctx.instance.sys.users.getUserById(opt.input))?.getSurname();

          return `${surname}`;
        }),
      setSurname: adminProcedure.input(z.object({ userId: z.number(), surname: z.string() })).mutation(async (opt) => {
        await (await opt.ctx.instance.sys.users.getUserById(opt.input.userId))?.setSurname(opt.input.surname);

        return true;
      }),
      getUsername: adminProcedure
        .input(z.number())
        .output(z.string())
        .query(async (opt) => {
          const username = await (await opt.ctx.instance.sys.users.getUserById(opt.input))?.getUsername();

          return username || "unknown";
        }),
      setUsername: adminProcedure.input(z.object({ userId: z.number(), username: z.string() })).mutation(async (opt) => {
        await (await opt.ctx.instance.sys.users.getUserById(opt.input.userId))?.setUsername(opt.input.username.toLowerCase());

        return true;
      }),
      getEmail: adminProcedure
        .input(z.number())
        .output(z.string())
        .query(async (opt) => {
          const email = await (await opt.ctx.instance.sys.users.getUserById(opt.input))?.getEmail();

          return email || "unknown";
        }),
      setEmail: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            email: z.email().or(z.literal("unknown")),
          }),
        )
        .mutation(async (opt) => {
          await (await opt.ctx.instance.sys.users.getUserById(opt.input.userId))?.setEmail(opt.input.email);

          return true;
        }),
      getIsAdministrator: adminProcedure
        .input(z.number())
        .output(z.boolean())
        .query(async (opt) => {
          const isAdministrator = await (await opt.ctx.instance.sys.users.getUserById(opt.input))?.isAdministrator();

          return isAdministrator || false;
        }),
      setIsAdministrator: adminProcedure.input(z.object({ userId: z.number(), administrator: z.boolean() })).mutation(async (opt) => {
        await (await opt.ctx.instance.sys.users.getUserById(opt.input.userId))?.setIsAdministrator(opt.input.administrator);

        return true;
      }),
      getIsMe: adminProcedure
        .input(z.number())
        .output(z.boolean())
        .query(async (opt) => {
          return opt.input === opt.ctx.userId;
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
      const user = await opt.ctx.user();

      if (user) {
        return await user.isAdministrator();
      }

      return false;
    }),
    createUser: procedure.input(z.object({ username: z.string(), password: z.string() })).mutation(async (opt) => {
      await opt.ctx.instance.sys.users.createUser(opt.input.username.toLowerCase(), opt.input.password);

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
      .query(async () => {
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
    setFeature: procedure.input(z.object({ id: z.string(), value: z.boolean() })).mutation(async (opt) => {
      if (opt.input.value) {
        await instance.sys.configuration.enableFeature(opt.input.id);
      } else {
        await instance.sys.configuration.disableFeature(opt.input.id);
      }

      return true;
    }),
    mailserver: {
      get: procedure
        .output(
          z
            .object({
              host: z.string(),
              port: z.number(),
              secure: z.boolean(),
              auth: z.object({
                user: z.string(),
                pass: z.string(),
              }),
            })
            .or(z.undefined()),
        )
        .query(async () => {
          const mailserverConfig = instance.sys.configuration.mailServer;

          if (!mailserverConfig) return undefined;

          return {
            host: mailserverConfig.host,
            port: mailserverConfig.port,
            secure: mailserverConfig.secure,
            auth: {
              user: mailserverConfig.auth.user,
              pass: "********",
            },
          };
        }),
    },
  },
  customization: {
    wallpaper: {
      wallpaperHistory: procedure.output(z.object({ name: z.string(), previewSrc: z.string() }).array()).query(async (opt) => {
        const wallpapersPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");

        const output: {
          name: string;
          previewSrc: string;
        }[] = [];

        for (const wallpaperName of await fs.readdir(wallpapersPath)) {
          if (wallpaperName === "current.webp" || wallpaperName === "resized" || !wallpaperName.endsWith(".webp")) continue;

          const wallpaperPath = path.join(wallpapersPath, wallpaperName);

          output.push({
            name: wallpaperName,
            previewSrc:
              opt.ctx.instance.sys.configuration.backendUrl +
              (await instance.sys.image.serveImage(opt.ctx.userId, wallpaperPath, {
                resize: {
                  dimensions: { width: 296, height: 192 },
                },
              })),
          });
        }

        return output;
      }),
      getDefaultWallpapers: procedure.output(z.object({ name: z.string(), previewSrc: z.string() }).array()).query(async (opt) => {
        const DEFAULT_WALLPAPERS_PATH = path.join(instance.sys.filesystem.SRC_ROOT, "assets/wallpapers");

        const output: {
          name: string;
          previewSrc: string;
        }[] = [];

        for (const wallpaperName of await fs.readdir(DEFAULT_WALLPAPERS_PATH)) {
          const wallpaperPath = path.join(DEFAULT_WALLPAPERS_PATH, wallpaperName);

          output.push({
            name: wallpaperName,
            previewSrc:
              opt.ctx.instance.sys.configuration.backendUrl +
              (await instance.sys.image.serveImage(opt.ctx.userId, wallpaperPath, { resize: { dimensions: { height: 140, width: 250 }, position: "centre" } })),
          });
        }

        return output;
      }),
      getCurrentWallpaper: procedure.query(async (opt) => {
        const wallpapersRootPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");
        const rawWallpaperPath = path.join(wallpapersRootPath, "current.webp");
        const resizedWallpapersPath = path.join(wallpapersRootPath, "resized");
        const requiredResizedWallpaperPath = path.join(resizedWallpapersPath, `${504}x${280}.webp`);

        if (!fsExistsSync(rawWallpaperPath)) {
          return undefined;
        }

        if (!fsExistsSync(requiredResizedWallpaperPath)) {
          const options = JSON.parse((await fs.readFile(path.join(wallpapersRootPath, "config.json"))).toString());

          await instance.sys.image.resizeImage(
            rawWallpaperPath,
            requiredResizedWallpaperPath,
            { width: 504, height: 280 },
            {
              changeFormatTo: "webp",
              fit: options?.fit,
              position: options?.position,
              background: options?.background,
            },
          );
        }

        return (
          opt.ctx.instance.sys.configuration.backendUrl +
          (await opt.ctx.instance.sys.image.serveImage(opt.ctx.userId, requiredResizedWallpaperPath, {
            isPublic: false,
            dontCachePath: true,
          }))
        );
      }),
      upload: procedure.input(octetInputParser).mutation(async (opt) => {
        const wallpapersPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");

        const wallpaperUUID = Bun.randomUUIDv7();

        // @ts-ignore
        const bytes = await opt.input.bytes();

        await sharp(bytes)
          .toFormat("webp")
          .toFile(path.join(wallpapersPath, `${wallpaperUUID}.webp`));

        log.info(
          `converted '${wallpaperUUID}' to WEBP -> '${path.relative(instance.sys.filesystem.FS_ROOT, path.join(wallpapersPath, `${wallpaperUUID}.webp`))}'`,
        );

        return `${wallpaperUUID}.webp`;
      }),
      delete: procedure.input(z.object({ name: z.string() })).mutation(async (opt) => {
        const wallpapersPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");

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
          const wallpaperPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");

          if (fsExistsSync(path.join(wallpaperPath, "config.json"))) {
            const options = JSON.parse((await fs.readFile(path.join(wallpaperPath, "config.json"))).toString());

            options.position = options.position.split(" ");

            return options;
          } else {
            return { fit: "cover", position: ["center"] };
          }
        }),
      setOptions: procedure
        .input(
          z.object({
            fit: z.string(),
            position: z.string(),
            background: z.string(),
          }),
        )
        .mutation(async (opt) => {
          const wallpaperPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");
          const resizedWallpapersPath = path.join(wallpaperPath, "resized");

          for (const resizedWallpaper of await fs.readdir(resizedWallpapersPath)) {
            await fs.rm(path.join(resizedWallpapersPath, resizedWallpaper));
          }

          const options = {
            fit: opt.input.fit,
            position: opt.input.position,
            background: opt.input.background || "#0000",
          };

          await fs.writeFile(path.join(wallpaperPath, "config.json"), JSON.stringify(options));

          return true;
        }),
      setWallpaperToCustomWallpaper: procedure.input(z.object({ name: z.string() })).mutation(async (opt) => {
        const wallpapersPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");
        const resizedWallpapersPath = path.join(wallpapersPath, "resized");

        for (const resizedWallpaper of await fs.readdir(resizedWallpapersPath)) {
          await fs.rm(path.join(resizedWallpapersPath, resizedWallpaper));
        }

        await fs.copyFile(path.join(wallpapersPath, opt.input.name.replace(".preview", "")), path.join(wallpapersPath, "current.webp"));

        return true;
      }),
      setWallpaperToDefaultWallpaper: procedure.input(z.object({ name: z.string() })).mutation(async (opt) => {
        const wallpapersPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");
        const officialWallpaperPath = path.join(instance.sys.filesystem.SRC_ROOT, "assets/wallpapers");
        const resizedWallpapersPath = path.join(wallpapersPath, "resized");

        for (const resizedWallpaper of await fs.readdir(resizedWallpapersPath)) {
          await fs.rm(path.join(resizedWallpapersPath, resizedWallpaper));
        }

        await fs.copyFile(path.join(officialWallpaperPath, opt.input.name), path.join(wallpapersPath, "current.webp"));

        return true;
      }),
    },
    colorTheme: {
      getWallpaperPixelData: procedure.output(z.number().array()).query(async (opt) => {
        const wallpaperPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers/resized", `${504}x${280}.webp`);

        const buf = (await sharp(wallpaperPath).raw().toBuffer({ resolveWithObject: true })).data;
        const newBuf = [];

        for (let i = 0; i < buf.length; i += 4) {
          newBuf.push(buf[i + 3]);
          newBuf.push(buf[i]);
          newBuf.push(buf[i + 1]);
          newBuf.push(buf[i + 2]);
        }

        return newBuf;
      }),
      setColorTheme: procedure.input(z.any()).mutation(async (opt) => {
        const db = instance.sys.database.postgres();

        if (opt.input === undefined) {
          await db`UPDATE public.users SET color_theme = NULL WHERE id = ${opt.ctx.userId}`;
          return true;
        }

        await db`UPDATE public.users SET color_theme = ${opt.input} WHERE id = ${opt.ctx.userId}`;

        return true;
      }),
    },
    quickShortcuts: {
      getSettingData: procedure
        .output(
          z.object({
            displayName: z.string(),
            defaultShortcuts: z.string().array(),
            enabledShortcuts: z.string().array().or(z.undefined()),
            shortcutMetadata: z.record(
              z.string(),
              z.object({ id: z.string(), displayName: z.string(), icon: z.object({ type: z.enum(["icon", "image"]), value: z.string() }) }),
            ),
          }),
        )
        .query(async (opt) => {
          const a = instance.sys.settings.applicationSettings.core.find((s) => s.id === "quick_shortcuts");

          if (!a) throw "The core:quick_shortcuts setting is somehow missing???";

          const enabledShortcutIds = ((await a.onValueChange(opt.ctx.userId)) as string[] | undefined) || [];
          const enabledApplications = instance.sys.applications.getEnabledApplications();

          return {
            displayName: a.displayName,
            defaultShortcuts: a.defaultValue,
            enabledShortcuts: enabledShortcutIds,
            shortcutMetadata: Object.fromEntries(
              enabledApplications
                .map((app) => {
                  let icon = {
                    type: "icon" as "icon" | "image",
                    value: "indeterminate_question_box",
                  };

                  if (app.manifest?.icon) {
                    if (app.manifest.icon.type === "image") {
                      icon = {
                        type: "image",
                        value: `${opt.ctx.instance.sys.configuration.backendUrl}/api/application/${app.manifest.id}/icon/`,
                      };
                    } else {
                      icon = {
                        type: "icon",
                        value: `${opt.ctx.instance.sys.configuration.backendUrl}/api/application/${app.manifest.id}/icon/`,
                      };
                    }
                  }

                  return [
                    app.manifest!.id,
                    {
                      id: app.manifest!.id,
                      displayName: app.manifest!.displayName,
                      icon: icon,
                    },
                  ];
                })
                .filter((a) => a !== undefined),
            ),
          };
        }),
      availableShortcuts: procedure.query(async (opt) => {
        const applications = instance.sys.applications.enabledApplications;

        const shortcuts: {
          id: string;
          displayName: string;
          icon: { type: "icon" | "image"; value: string };
        }[] = [];

        const quickShortcutsSetting = instance.sys.settings.applicationSettings.core?.find((s) => s.id === "quick_shortcuts");

        if (!quickShortcutsSetting) return [];
        const userShortcuts = (await quickShortcutsSetting.onValueChange(opt.ctx.userId)) || [];

        for (const applicationId of applications) {
          const application = instance.sys.applications.availableApplications.find((aa) => aa.manifest?.id === applicationId);

          if (!application) continue;

          if (userShortcuts.includes(applicationId)) {
            continue;
          }

          let icon = {
            type: "icon" as "icon" | "image",
            value: "indeterminate_question_box",
          };

          if (application.manifest?.icon) {
            if (application.manifest.icon.type === "image") {
              icon = {
                type: "image",
                value: `${opt.ctx.instance.sys.configuration.backendUrl}/api/application/${application.manifest.id}/icon/`,
              };
            } else {
              icon = application.manifest.icon;
            }
          }

          shortcuts.push({
            id: application.manifest?.id || applicationId,
            displayName: application.manifest?.displayName || applicationId,
            icon: icon,
          });
        }

        return shortcuts;
      }),
    },
  },
  storage: {
    usage: procedure
      .output(
        z
          .object({
            displayName: z.string(),
            percentage: z.number(),
            size: z.number(),
          })
          .array(),
      )
      .query(async (opt) => {
        async function getChildFiles(dir: string) {
          const children = await fs.readdir(dir);

          let output: {
            type: string | undefined;
            size: number;
            path: string;
          }[] = [];

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

        const files = await getChildFiles((await opt.ctx.user()).getPath());

        const categories: {
          [categoryId: string]: {
            fileCount: number;
            size: number;
            percentage: number;
          };
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

        let output: {
          displayName: string;
          percentage: number;
          size: number;
        }[] = [];

        const storageQuota = (await (await opt.ctx.user()).getQuota()) || 1;

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
  application: {
    getApplications: procedure.output(z.object({ displayName: z.string(), id: z.string() }).array()).query(async () => {
      return instance.sys.applications.enabledApplications.map((enabledApplication) => {
        return {
          displayName:
            instance.sys.applications.availableApplications.find((availableApplication) => availableApplication.manifest?.id === enabledApplication)?.manifest
              ?.displayName || `Failed to find application '${enabledApplication}'`,
          id: enabledApplication,
        };
      });
    }),
    getApplication: procedure
      .input(z.object({ id: z.string() }))
      .output(
        z.object({
          displayName: z.string(),
          icon: z.object({
            type: z.literal("icon").or(z.literal("image")),
            value: z.string(),
          }),
          settings: z
            .object({
              displayName: z.string(),
              defaultValue: z.any(),
              currentValue: z.any().or(z.undefined()),
              type: z.string(),
              id: z.string(),
              global: z.boolean(),
              description: z.string(),
            })
            .array(),
        }),
      )
      .query(async (opt) => {
        const application = instance.sys.applications.availableApplications.find((aa) => aa.manifest?.id === opt.input.id);

        if (!application) throw { error: true };

        let icon = {
          type: "icon" as "icon" | "image",
          value: "indeterminate_question_box",
        };

        if (application.manifest?.icon) {
          if (application.manifest.icon.type === "image") {
            icon = {
              type: "image",
              value: `${opt.ctx.instance.sys.configuration.backendUrl}/api/application/${application.manifest.id}/icon/`,
            };
          } else {
            icon = {
              type: "icon",
              value: `${opt.ctx.instance.sys.configuration.backendUrl}/api/application/${application.manifest.id}/icon/`,
            };
          }
        }

        const settings = (
          await Promise.all(
            instance.sys.settings.applicationSettings[opt.input.id]?.map(async (a) => {
              if (!(a instanceof GlobalApplicationSetting)) {
                if (a.hidden) return undefined;

                return {
                  displayName: a.displayName,
                  defaultValue: a.defaultValue,
                  currentValue: await a.onValueChange(opt.ctx.userId),
                  type: a.type,
                  id: a.id,
                  global: false,
                  description: a.description || "No description provided.",
                };
              }
            }) || [],
          )
        ).filter((a) => a !== undefined);

        const globalSettings = (
          await Promise.all(
            instance.sys.settings.applicationSettings[opt.input.id]?.map(async (a) => {
              if (a instanceof GlobalApplicationSetting) {
                if (a.hidden) return undefined;

                return {
                  displayName: a.displayName,
                  defaultValue: a.defaultValue,
                  currentValue: await a.onValueChange(),
                  type: a.type,
                  id: a.id,
                  global: false,
                  description: a.description || "No description provided.",
                };
              }
            }) || [],
          )
        ).filter((a) => a !== undefined);

        return {
          displayName: application?.manifest?.displayName || opt.input.id,
          icon: icon,
          settings: settings || [],
          globalSettings: globalSettings || [],
        };
      }),
    setApplicationBooleanSettingValue: procedure
      .input(
        z.object({
          applicationId: z.string(),
          id: z.string(),
          value: z.boolean(),
        }),
      )
      .mutation(async (opt) => {
        await instance.sys.settings.setUserApplicationSetting(opt.ctx.userId, opt.input.applicationId, opt.input.id, opt.input.value);

        return true;
      }),
    setApplicationStringSettingValue: procedure
      .input(
        z.object({
          applicationId: z.string(),
          id: z.string(),
          value: z.string(),
        }),
      )
      .mutation(async (opt) => {
        await instance.sys.settings.setUserApplicationSetting(opt.ctx.userId, opt.input.applicationId, opt.input.id, opt.input.value);

        return true;
      }),
    setApplicationStringListSettingValue: procedure
      .input(
        z.object({
          applicationId: z.string(),
          id: z.string(),
          value: z.string().array(),
        }),
      )
      .mutation(async (opt) => {
        await instance.sys.settings.setUserApplicationSetting(opt.ctx.userId, opt.input.applicationId, opt.input.id, opt.input.value);

        return true;
      }),
  },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
  basePath: "/api/app/uk.ewsgit.settings",
  router: router,
  createContext: createTRPCContext(instance),
});
