/// <reference path="./global.d.ts" />

import { WorkspacesFeatureFlags } from "@onlineworkspace/workspace-instance/src/systems/configuration.js";
import { adminProcedure, createTRPCContext, procedure } from "@onlineworkspace/workspace-instance/src/systems/trpcRouter.js";
import { initTRPC } from "@trpc/server";
import fastFolderSizeSync from "fast-folder-size/sync.js";
import fs from "fs/promises";
import z from "zod";
import type ApplicationRepository from "./repository/applicationRepository.js";
import LocalApplicationRepository from "./repository/localRepository.js";

const log = instance.log.createLogger("uk.ewsgit.store");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const applicationRepositories: ApplicationRepository[] = [new LocalApplicationRepository()];

const router = t.router({
  homepage: {
    promotedApplications: procedure.query(async (opt) => {
      let output: { applicationId: string; repository: string }[] = [];

      for (const repo of applicationRepositories) {
        output = [
          ...output,
          ...(await repo.getPromotedApplications()).map((a) => {
            return { applicationId: a, repository: repo.id };
          }),
        ];
      }

      return output;
    }),
    getPromotedApplication: procedure.input(z.object({ applicationId: z.string(), repository: z.string() })).query(async (opt) => {
      const repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

      if (!repository) return undefined;

      const app = await repository.getApplicationSummaryById(opt.input.applicationId);

      if (!app) return undefined;

      if (app.bannerImage) {
        app.bannerImage = `${opt.ctx.instance.sys.configuration.backendUrl}${await instance.sys.image.serveImage(opt.ctx.userId, app.bannerImage)}`;
      }

      return app;
    }),
  },
  manageInstalled: {
    getApplications: procedure
      .output(
        z.object({
          applications: z
            .object({
              id: z.string(),
              repository: z.string(),
              displayName: z.string(),
              version: z.string(),
              icon: z.object({
                type: z.literal("icon").or(z.literal("image")),
                value: z.string(),
              }),
              description: z.string(),
            })
            .array(),
          enabledApplications: z.string().array(),
          cannotDisable: z.string().array(),
        }),
      )
      .query(async (opt) => {
        return {
          applications: instance.sys.applications.availableApplications
            .map((app) => {
              if (!app.manifest) return undefined;

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

              return {
                id: app.manifest.id,
                displayName: app.manifest.displayName || app.manifest.id,
                version: app.manifest.version || "rolling",
                icon: icon,
                description: app.manifest.description || "Description not supplied",
                // TODO: use the actual repo not just local
                repository: "local",
              };
            })
            .filter((a) => a !== undefined),
          enabledApplications: instance.sys.applications.enabledApplications,
          cannotDisable: instance.sys.configuration.hasFeature(WorkspacesFeatureFlags.ShootYourselfInTheFoot)
            ? []
            : instance.sys.configuration.defaultApplications.map((a) => a.id),
        };
      }),
    setEnabledApplications: adminProcedure.input(z.object({ enabledApplications: z.string().array() })).mutation(async (opt) => {
      const currentlyEnabledApplications = instance.sys.applications.enabledApplications;

      for (const app of currentlyEnabledApplications) {
        if (opt.input.enabledApplications.includes(app)) continue;

        await instance.sys.applications.disableApplication(app);
      }

      for (const app of opt.input.enabledApplications) {
        if (currentlyEnabledApplications.includes(app)) continue;

        await instance.sys.applications.enableApplication(app);
      }

      return {
        success: true,
      };
    }),
    uninstallApplications: adminProcedure.input(z.object({ applications: z.string().array() })).mutation(async (opt) => {
      for (const app of opt.input.applications) {
        await opt.ctx.instance.sys.applications.uninstallApplication(app);
      }

      return {
        success: true,
      };
    }),
  },
  categories: {},
  search: {
    searchFor: procedure
      .input(z.string())
      .output(z.object({ applicationId: z.string(), repository: z.string() }).array())
      .query(async (opt) => {
        let results: { applicationId: string; repository: string }[] = [];

        for (const repo of applicationRepositories) {
          results = [
            ...results,
            ...(await repo.searchForApplicationIds(opt.input)).map((a) => {
              return { applicationId: a, repository: repo.id };
            }),
          ];
        }

        return results;
      }),
    getResult: procedure.input(z.object({ applicationId: z.string(), repository: z.string() })).query(async (opt) => {
      const repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

      if (!repository) return undefined;

      const app = await repository.getApplicationSummaryById(opt.input.applicationId);

      if (!app) return undefined;

      if (app.bannerImage) {
        app.bannerImage = `${opt.ctx.instance.sys.configuration.backendUrl}${await instance.sys.image.serveImage(opt.ctx.userId, app.bannerImage)}`;
      }

      if (app.icon) {
        app.icon.value = `${opt.ctx.instance.sys.configuration.backendUrl}${await instance.sys.image.serveImage(opt.ctx.userId, app.icon.value)}`;
      }

      return { ...app, isInstalled: instance.sys.applications.availableApplications.find((aid) => aid.manifest!.id === app.id) };
    }),
  },
  app: {
    get: procedure.input(z.object({ applicationId: z.string(), repository: z.string() })).query(async (opt) => {
      const repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

      if (!repository) return undefined;

      const app = await repository.getApplicationById(opt.input.applicationId);

      if (!app) return undefined;

      app.icon.value = `${opt.ctx.instance.sys.configuration.backendUrl}${await instance.sys.image.serveImage(opt.ctx.userId, app.icon.value)}`;

      if (app.bannerImage) {
        app.bannerImage = `${opt.ctx.instance.sys.configuration.backendUrl}${await instance.sys.image.serveImage(opt.ctx.userId, app.bannerImage)}`;
      }

      return {
        ...app,
        isUserAdministrator: await (await opt.ctx.user())?.isAdministrator(),
        canBeUninstalled: instance.sys.configuration.defaultApplications.some((a) => a.id === app.id)
          ? instance.sys.configuration.hasFeature(WorkspacesFeatureFlags.ShootYourselfInTheFoot)
          : true,
        isInstalled: opt.ctx.instance.sys.applications.enabledApplications.includes(app.id),
        installSize: repository instanceof LocalApplicationRepository ? fastFolderSizeSync(await repository.getSourcePath(app.id)) : -1,
        graphicsAcceleration: app.graphicsAcceleration,
      };
    }),
    install: adminProcedure.input(z.object({ applicationId: z.string(), repository: z.string() })).mutation(async (opt) => {
      const repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

      if (!repository) return undefined;

      const app = await repository.getApplicationById(opt.input.applicationId);

      if (!app) return undefined;

      // the user must be administrator
      if (!(await (await opt.ctx.user())?.isAdministrator())) return false;

      await opt.ctx.instance.sys.applications.installApplication(await repository.getInstallURI(app.id));
      await opt.ctx.instance.sys.applications.enableApplication(app.id);

      return true;
    }),
    uninstall: adminProcedure.input(z.object({ applicationId: z.string() })).mutation(async (opt) => {
      // the user must be administrator
      if (!(await (await opt.ctx.user())?.isAdministrator())) return false;
      // the application must not be protected if ShootYourselfInTheFoot is enabled
      if (instance.sys.configuration.defaultApplications.some((a) => a.id === opt.input.applicationId)) {
        if (!instance.sys.configuration.hasFeature(WorkspacesFeatureFlags.ShootYourselfInTheFoot)) {
          return false;
        }
      }

      await opt.ctx.instance.sys.applications.disableApplication(opt.input.applicationId);
      await opt.ctx.instance.sys.applications.uninstallApplication(opt.input.applicationId);

      return true;
    }),
  },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
  basePath: "/api/app/uk.ewsgit.store",
  router: router,
  createContext: createTRPCContext(instance),
});
