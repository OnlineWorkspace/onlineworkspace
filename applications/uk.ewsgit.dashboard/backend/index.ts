/// <reference path="./global.d.ts" />

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { WorkspacesEvent } from "@onlineworkspace/workspace-backend/src/systems/events.ts";
import { BooleanApplicationSetting } from "@onlineworkspace/workspace-backend/src/systems/settings/applicationSetting/booleanSetting.ts";
import { StringListApplicationSetting } from "@onlineworkspace/workspace-backend/src/systems/settings/applicationSetting/stringListSetting.ts";
import { StringApplicationSetting } from "@onlineworkspace/workspace-backend/src/systems/settings/applicationSetting/stringSetting.ts";
import {
  createOnlineWorkspaceTRPCContext,
  procedure,
} from "@onlineworkspace/workspace-backend/src/systems/trpc/coreRouter.ts";
import { initTRPC } from "@trpc/server";
import z from "zod";

const log = instance.log.createLogger("uk.ewsgit.dashboard");

export const t = initTRPC.context<
  ReturnType<typeof createOnlineWorkspaceTRPCContext>
>().create();

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

            const { display_name, username } =
              (await db`SELECT display_name, username FROM public.users WHERE id = ${opt.ctx.userId}`)
                ?.[0] || {
                display_name: "Unknown",
                username: "@unknown",
              };

            return {
              displayName: display_name || username,
              username: username,
              avatar: `${
                opt.ctx.instance.sys.configuration.proxy.secure
                  ? "https://"
                  : "http://"
              }${opt.ctx.instance.sys.configuration.proxy.hostname}/api/user/me/avatar/m`,
            };
          }),
        // `size` is the avatar resolution to serve, so the widget can ask for one that matches how large it's displayed
        avatar: procedure
          .input(z.enum(["xs", "s", "m", "l", "xl", "2xl"]).default("2xl"))
          .output(z.string())
          .query(async (opt) => {
            return `${
              opt.ctx.instance.sys.configuration.proxy.secure
                ? "https://"
                : "http://"
            }${opt.ctx.instance.sys.configuration.proxy.hostname}/api/user/me/avatar/${opt.input}`;
          }),
      },
    },
    getWidgets: procedure.output(z.string().array()).query(async (opt) => {
      return await opt.ctx.instance.sys.settings.getUserApplicationSetting<
        StringListApplicationSetting
      >(opt.ctx.userId, "uk.ewsgit.dashboard", "widgets");
    }),
    setWidgets: procedure.input(z.string().array().max(64)).mutation(async (opt) => {
      return await opt.ctx.instance.sys.settings.setUserApplicationSetting(opt.ctx.userId, "uk.ewsgit.dashboard", "widgets", opt.input);
    }),
    getWelcomeMessage: procedure
      .input(z.number())
      .output(z.string().or(z.undefined()))
      .query(async (opt) => {
        if (
          await opt.ctx.instance.sys.settings.getUserApplicationSetting<
            BooleanApplicationSetting
          >(opt.ctx.userId, "uk.ewsgit.dashboard", "show_greeting")
        ) {
          const date = new Date(opt.input);
          const hours = date.getHours();
          const displayName = (await (await opt.ctx.instance.sys.users.getUserById(
            opt.ctx.userId,
          ))?.getDisplayName()) || "Anonymous";
          const shouldShowTimeBasedGreeting = Math.random() < 0.5;

          if (shouldShowTimeBasedGreeting) {
            // Early bird 5am - 7am
            if (hours >= 5 && hours < 7) {
              return `Hello early bird!`;
            }
            // Good Morning 7am - 12pm
            if (hours >= 7 && hours < 12) {
              return `Good Morning, ${displayName}!`;
            }
            // Good Afternoon 12pm - 5pm
            if (hours >= 12 && hours < 17) {
              return `Good Afternoon, ${displayName}!`;
            }
            // Good Evening 5pm - 10pm
            if (hours >= 17 && hours < 22) {
              return `Good Evening, ${displayName}!`;
            }
            // Good Night 10pm - 12am
            if (hours >= 22 || hours < 0) {
              return `Good Night, ${displayName}!`;
            }
            // Night owl 12am - 5am
            if (hours >= 0 && hours < 5) {
              return `Hello night owl!`;
            }
          }

          const greetingVariants = [
            `Hiya, ${displayName}!`,
            `Hello, ${displayName}!`,
            `Welcome back, ${displayName}!`,
            `Hey there, ${displayName}!`,
            `Greetings, ${displayName}!`,
            `Howdy, ${displayName}!`,
            `Ahoy, ${displayName}!`,
            `Bonjour, ${displayName}!`,
            `Hola, ${displayName}!`,
          ];

          const randomGreetingVariantIndex = Math.floor(
            Math.random() * greetingVariants.length,
          );

          if (greetingVariants[randomGreetingVariantIndex]) {
            return greetingVariants[randomGreetingVariantIndex];
          }

          return `Hiya, ${displayName}!`;
        }

        return undefined;
      }),
    getShowContentBackground: procedure.output(z.boolean()).query(
      async (opt) => {
        return await opt.ctx.instance.sys.settings.getUserApplicationSetting<
          BooleanApplicationSetting
        >(
          opt.ctx.userId,
          "uk.ewsgit.dashboard",
          "content_background",
        );
      },
    ),
    getShowEditButton: procedure.output(z.boolean()).query(async (opt) => {
      return await opt.ctx.instance.sys.settings.getUserApplicationSetting<
        BooleanApplicationSetting
      >(
        opt.ctx.userId,
        "uk.ewsgit.dashboard",
        "show_edit_button",
      );
    }),
    getShowSearchBar: procedure.output(z.boolean()).query(async (opt) => {
      return await opt.ctx.instance.sys.settings.getUserApplicationSetting<
        BooleanApplicationSetting
      >(opt.ctx.userId, "uk.ewsgit.dashboard", "show_search_bar");
    }),
    getSearchBarSearchEngine: procedure.output(z.string()).query(
      async (opt) => {
        return await opt.ctx.instance.sys.settings.getUserApplicationSetting<
          StringApplicationSetting
        >(
          opt.ctx.userId,
          "uk.ewsgit.dashboard",
          "search_bar_search_engine",
        );
      },
    ),
    getOpenSearchInNewTab: procedure.output(z.boolean()).query(async (opt) => {
      return await opt.ctx.instance.sys.settings.getUserApplicationSetting<
        BooleanApplicationSetting
      >(
        opt.ctx.userId,
        "uk.ewsgit.dashboard",
        "open_search_in_new_tab",
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
        const wallpaperPath = path.join(
          (await opt.ctx.user()).getPath(),
          "assets/wallpapers",
        );

        if (existsSync(path.join(wallpaperPath, "config.json"))) {
          const options = JSON.parse(
            await fs.readFile(path.join(wallpaperPath, "config.json"), "utf8"),
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
    getWallpaper: procedure.input(
      z.object({ width: z.number(), height: z.number() }),
    ).query(async (opt) => {
      const wallpapersRootPath = path.join(
        (await opt.ctx.user()).getPath(),
        "assets/wallpapers",
      );
      const userWallpaperPath = path.join(wallpapersRootPath, "current.webp");
      const instanceBackgroundPath = path.join(
        instance.sys.filesystem.FS_ROOT,
        "assets/default_user_background.webp",
      );

      // users who have not chosen a wallpaper get the instance's default background, when it has one
      const usesInstanceBackground = !existsSync(userWallpaperPath);

      if (usesInstanceBackground && !existsSync(instanceBackgroundPath)) {
        return undefined;
      }

      const rawWallpaperPath = usesInstanceBackground ? instanceBackgroundPath : userWallpaperPath;
      // the modified time is part of the shared copies' name so a replaced default is never served from the cache
      const resizedWallpapersPath = usesInstanceBackground
        ? path.join(instance.sys.filesystem.FS_ROOT, "cache/default_user_background")
        : path.join(wallpapersRootPath, "resized");
      const resizedName = usesInstanceBackground
        ? `${opt.input.width}x${opt.input.height}-${Math.round((await fs.stat(instanceBackgroundPath)).mtimeMs)}.webp`
        : `${opt.input.width}x${opt.input.height}.webp`;
      const requiredResizedWallpaperPath = path.join(resizedWallpapersPath, resizedName);

      if (!existsSync(requiredResizedWallpaperPath)) {
        await fs.mkdir(resizedWallpapersPath, { recursive: true });

        const options = await (async () => {
          if (!usesInstanceBackground && existsSync(path.join(wallpapersRootPath, "config.json"))) {
            const options = JSON.parse(
              await fs.readFile(
                path.join(wallpapersRootPath, "config.json"),
                "utf8",
              ),
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
            changeFormatTo: "webp",
            fit: options.fit,
            position: options.position,
            background: options.background,
          },
        );
      }

      return await opt.ctx.instance.sys.image.serveImage(
        opt.ctx.userId,
        requiredResizedWallpaperPath
      );
    }),
  },
});

export type TRPCRouter = typeof router;
instance.sys.tRPC.registerTRPCRouter(router, "/api/app/uk.ewsgit.dashboard");

instance.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting("uk.ewsgit.dashboard", "show_greeting", true)
      .setDisplayName("Show Greeting")
      .setDescription(
        "Should a greeting message be shown on the dashboard welcoming the user. The message will include the user's display name if available.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting(
      "uk.ewsgit.dashboard",
      "content_background",
      true,
    )
      .setDisplayName("Show Content Background")
      .setDescription(
        "Should a background be shown behind the dashboard content to improve readability when using certain wallpapers.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new StringListApplicationSetting("uk.ewsgit.dashboard", "widgets", [
      "user.profile",
    ])
      .setDisplayName("Enabled Widgets")
      .setDescription(
        "A list of widget IDs that should be enabled on the dashboard. The current available widgets are: user.profile, user.avatar, weather & search",
      )
      .setHidden(true),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting(
      "uk.ewsgit.dashboard",
      "show_edit_button",
      true,
    )
      .setDisplayName("Show Edit Button on Dashboard")
      .setDescription(
        "Should the edit button be displayed on the dashboard to allow quick navigation to this settings page.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting(
      "uk.ewsgit.dashboard",
      "show_search_bar",
      false,
    )
      .setDisplayName("Show a search bar on the Dashboard")
      .setDescription(
        "Should a search bar be displayed on the dashboard to allow for quick web searches.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting(
      "uk.ewsgit.dashboard",
      "open_search_in_new_tab",
      false,
    )
      .setDisplayName("Open search results in a new tab")
      .setDescription(
        "When using the dashboard search bar, should the search results be opened in a new tab or in the current tab?",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new StringApplicationSetting(
      "uk.ewsgit.dashboard",
      "search_bar_search_engine",
      "https://duckduckgo.com/?q=%s",
    )
      .setDisplayName("Search engine for the dashboard search bar")
      .setDescription(
        "The search engine URL template for the dashboard search bar. Use %s as a placeholder for the search query. For example, https://duckduckgo.com/?q=%s",
      ),
  );
});
