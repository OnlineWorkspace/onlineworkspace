/// <reference path="./global.d.ts" />

import { WorkspacesEvent } from "@tcsw/workspaces-instance/src/systems/events.js";
import { BooleanApplicationSetting } from "@tcsw/workspaces-instance/src/systems/settings/applicationSetting/booleanSetting.js";
import { StringListApplicationSetting } from "@tcsw/workspaces-instance/src/systems/settings/applicationSetting/stringListSetting.js";
import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/systems/trpcRouter.js";
import { initTRPC } from "@trpc/server";
import fs from "fs/promises";
import path from "path";
import z from "zod";

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
            const db = instance.sys.database.postgres();

            const { forename, surname, username } = (
              await db`SELECT forename, surname, username FROM public.users WHERE id = ${opt.ctx.userId}`
            )?.[0] || {
              forename: "Unknown",
              surname: "",
              username: "@unknown",
            };

            return {
              displayName: `${forename} ${surname}`,
              username: username,
              avatar: `${opt.ctx.rawRequest.destinationHostname}/api/user/me/avatar/m`,
            };
          }),
        avatar: procedure.output(z.string()).query(async (opt) => {
          return `${opt.ctx.rawRequest.destinationHostname}/api/user/me/avatar/2xl`;
        }),
      },
    },
    getWidgets: procedure.output(z.string().array()).query(async (opt) => {
      return await opt.ctx.instance.sys.settings.getUserApplicationSetting<StringListApplicationSetting>(
        opt.ctx.userId,
        "uk.tcsw.dashboard",
        "widgets",
      );
    }),
    welcomeMessage: procedure
      .input(z.number())
      .output(z.string().or(z.undefined()))
      .query(async (opt) => {
        if (
          await opt.ctx.instance.sys.settings.getUserApplicationSetting<BooleanApplicationSetting>(
            opt.ctx.userId,
            "uk.tcsw.dashboard",
            "show_greeting",
          )
        ) {
          const date = new Date(opt.input);
          const hours = date.getHours();
          const forename =
            (await (await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId))?.getForename()) ||
            "Anonymous";

          // Early bird 5am - 7am
          if (hours >= 5 && hours < 7) {
            return `Hello early bird, ${forename}!`;
          }
          // Good Morning 7am - 12pm
          if (hours >= 7 && hours < 12) {
            return `Good Morning, ${forename}!`;
          }
          // Good Afternoon 12pm - 5pm
          if (hours >= 12 && hours < 17) {
            return `Good Afternoon, ${forename}!`;
          }
          // Good Evening 5pm - 10pm
          if (hours >= 17 && hours < 22) {
            return `Good Evening, ${forename}!`;
          }
          // Good Night 10pm - 12am
          if (hours >= 22 || hours < 0) {
            return `Good Night, ${forename}!`;
          }
          // Night owl 12am - 5am
          if (hours >= 0 && hours < 5) {
            return `Hello night owl, ${forename}!`;
          }

          return `Hiya, ${forename}!`;
        }

        return undefined;
      }),
    contentBackground: procedure.output(z.boolean()).query(async (opt) => {
      return await opt.ctx.instance.sys.settings.getUserApplicationSetting<BooleanApplicationSetting>(
        opt.ctx.userId,
        "uk.tcsw.dashboard",
        "content_background",
      );
    }),
    showEditButton: procedure.output(z.boolean()).query(async (opt) => {
      return await opt.ctx.instance.sys.settings.getUserApplicationSetting<BooleanApplicationSetting>(
        opt.ctx.userId,
        "uk.tcsw.dashboard",
        "show_edit_button",
      );
    }),
    getWallpaperOptions: procedure
      .output(
        z.object({
          fit: z.string(),
          position: z.tuple([z.string(), z.string()]).or(z.tuple([z.string()])),
        }),
      )
      .query(async (opt) => {
        const wallpaperPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");

        if (await fs.exists(path.join(wallpaperPath, "config.json"))) {
          const options = JSON.parse(
            (await fs.readFile(path.join(wallpaperPath, "config.json"))).toString(),
          );

          options.position = options.position.split(" ");

          return options;
        } else {
          return {
            fit: "cover",
            position: ["center"],
          };
        }
      }),
    getWallpaper: procedure
      .input(z.object({ width: z.number(), height: z.number() }))
      .query(async (opt) => {
        const wallpapersRootPath = path.join((await opt.ctx.user()).getPath(), "assets/wallpapers");
        const rawWallpaperPath = path.join(wallpapersRootPath, "current.png");
        const resizedWallpapersPath = path.join(wallpapersRootPath, "resized");
        const requiredResizedWallpaperPath = path.join(
          resizedWallpapersPath,
          `${opt.input.width}x${opt.input.height}.png`,
        );

        if (!(await fs.exists(rawWallpaperPath))) {
          return undefined;
        }

        if (!(await fs.exists(requiredResizedWallpaperPath))) {
          const options = await (async () => {
            if (await fs.exists(path.join(wallpapersRootPath, "config.json"))) {
              const options = JSON.parse(
                (await fs.readFile(path.join(wallpapersRootPath, "config.json"))).toString(),
              );

              options.position = options.position.split(" ");
              return options;
            } else {
              return { fit: "cover", position: "center" };
            }
          })();

          await instance.sys.image.resizeImage(
            rawWallpaperPath,
            requiredResizedWallpaperPath,
            {
              width: opt.input.width,
              height: opt.input.height,
            },
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
          (await opt.ctx.instance.sys.image.serveImage(
            opt.ctx.userId,
            requiredResizedWallpaperPath,
          ))
        );
      }),
  },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
  basePath: "/app/uk.tcsw.dashboard",
  router: router,
  createContext: createTRPCContext(instance),
});

instance.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting("uk.tcsw.dashboard", "show_greeting", true)
      .setDisplayName("Show Greeting")
      .setDescription(
        "Should a greeting message be shown on the dashboard welcoming the user. The message will include the user's forename if available.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting("uk.tcsw.dashboard", "content_background", true)
      .setDisplayName("Show Content Background")
      .setDescription(
        "Should a background be shown behind the dashboard content to improve readability when using certain wallpapers.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new StringListApplicationSetting("uk.tcsw.dashboard", "widgets", ["user.profile"])
      .setDisplayName("Enabled Widgets")
      .setDescription(
        "A list of widget IDs that should be enabled on the dashboard. Widget IDs are not yet documented, but can be found in the source code of this application.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting("uk.tcsw.dashboard", "show_edit_button", true)
      .setDisplayName("Show Edit Button on Dashboard")
      .setDescription(
        "Should the edit button be displayed on the dashboard to allow quick navigation to this settings page.",
      ),
  );
});
