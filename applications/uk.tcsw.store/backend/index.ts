/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";
import ApplicationRepository from "./repository/applicationRepository";
import LocalApplicationRepository from "./repository/localRepository";
import { DEFAULT_APPLICATIONS } from "@tcsw/workspaces-instance/src/subsystems/applications";
import { WorkspacesFeatureFlags } from "@tcsw/workspaces-instance/src/subsystems/configuration";

const log = instance.log.createLogger("uk.tcsw.store");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

let applicationRepositories: ApplicationRepository[] = [new LocalApplicationRepository()];

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
            let repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

            if (!repository) return undefined;

            let app = await repository.getApplicationSummaryById(opt.input.applicationId);

            if (!app) return undefined;

            if (app.bannerImage) {
                app.bannerImage = `${opt.ctx.rawRequest.destinationHostname}${instance.subSystems.image.serveImage(opt.ctx.userId, app.bannerImage)}`;
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
                    applications: instance.subSystems.applications.availableApplications
                        .map((app) => {
                            if (!app.manifest) return undefined;

                            let icon = { type: "icon" as "icon" | "image", value: "indeterminate_question_box" };

                            if (app.manifest?.icon) {
                                if (app.manifest.icon.type === "image") {
                                    icon = {
                                        type: "image",
                                        value: `${opt.ctx.rawRequest.destinationHostname}/api/application/${app.manifest.id}/icon/`,
                                    };
                                } else {
                                    icon = app.manifest.icon;
                                }
                            }

                            return {
                                id: app.manifest.id,
                                displayName: app.manifest.displayName || app.manifest.id,
                                version: app.manifest.version || "rolling",
                                icon: icon,
                                description: app.manifest.description || "Description not supplied",
                            };
                        })
                        .filter((a) => a !== undefined),
                    enabledApplications: instance.subSystems.applications.enabledApplications,
                    cannotDisable: instance.subSystems.configuration.hasFeature(WorkspacesFeatureFlags.ShootYourselfInTheFoot)
                        ? []
                        : DEFAULT_APPLICATIONS,
                };
            }),
        setEnabledApplications: procedure.input(z.object({ enabledApplications: z.string().array() })).mutation(async (opt) => {
            const currentlyEnabledApplications = instance.subSystems.applications.enabledApplications;

            for (const app of currentlyEnabledApplications) {
                if (opt.input.enabledApplications.includes(app)) continue;

                await instance.subSystems.applications.disableApplication(app);
            }

            for (const app of opt.input.enabledApplications) {
                if (currentlyEnabledApplications.includes(app)) continue;

                await instance.subSystems.applications.enableApplication(app);
            }

            return {
                success: true,
            };
        }),
        uninstallApplications: procedure.input(z.object({ applications: z.string().array() })).mutation(async (opt) => {
            for (const app of opt.input.applications) {
                await opt.ctx.instance.subSystems.applications.uninstallApplication(app);
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
            let repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

            if (!repository) return undefined;

            let app = await repository.getApplicationSummaryById(opt.input.applicationId);

            if (!app) return undefined;

            if (app.bannerImage) {
                app.bannerImage = `${opt.ctx.rawRequest.destinationHostname}${instance.subSystems.image.serveImage(opt.ctx.userId, app.bannerImage)}`;
            }

            return app;
        }),
    },
    app: {
        get: procedure.input(z.object({ applicationId: z.string(), repository: z.string() })).query(async (opt) => {
            let repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

            if (!repository) return undefined;

            let app = await repository.getApplicationById(opt.input.applicationId);

            if (!app) return undefined;

            if (app.icon.type === "image") {
                app.icon.value = `${opt.ctx.rawRequest.destinationHostname}${instance.subSystems.image.serveImage(opt.ctx.userId, app.icon.value)}`;
            }

            if (app.bannerImage) {
                app.bannerImage = `${opt.ctx.rawRequest.destinationHostname}${instance.subSystems.image.serveImage(opt.ctx.userId, app.bannerImage)}`;
            }

            return {
                ...app,
                isUserAdministrator: await (await opt.ctx.user())?.isAdministrator(),
                isInstalled: opt.ctx.instance.subSystems.applications.enabledApplications.includes(app.id),
            };
        }),
        install: procedure.input(z.object({ applicationId: z.string(), repository: z.string() })).mutation(async (opt) => {
            let repository = applicationRepositories.find((repo) => repo.id === opt.input.repository);

            if (!repository) return undefined;

            let app = await repository.getApplicationById(opt.input.applicationId);

            if (!app) return undefined;

            // the user must be administrator
            if (!(await (await opt.ctx.user())?.isAdministrator())) return false;

            await opt.ctx.instance.subSystems.applications.installApplication(await repository.getInstallPath(app.id));
            await opt.ctx.instance.subSystems.applications.enableApplication(app.id);

            return true;
        }),
        uninstall: procedure.input(z.object({ applicationId: z.string() })).mutation(async (opt) => {
            // the user must be administrator
            if (!(await (await opt.ctx.user())?.isAdministrator())) return false;

            await opt.ctx.instance.subSystems.applications.disableApplication(opt.input.applicationId);
            await opt.ctx.instance.subSystems.applications.uninstallApplication(opt.input.applicationId);

            return true;
        }),
    },
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.store",
    router: router,
    createContext: createTRPCContext(instance),
});
