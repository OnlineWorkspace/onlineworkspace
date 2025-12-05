/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";

const log = instance.log.createLogger("uk.tcsw.store");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

let applicationRepositories = [];

const router = t.router({
    homepage: {},
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
                                        value: `${opt.ctx.rawRequest.destinationHostname}api/application/${app.manifest.id}/icon/`,
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
                };
            }),
        setEnabledApplications: procedure.input(z.object({ enabledApplications: z.string().array() })).mutation(async (opt) => {
            const currentlyEnabledApplications = instance.subSystems.applications.enabledApplications;

            for (const app of currentlyEnabledApplications) {
                if (opt.input.enabledApplications.includes(app)) continue;

                instance.subSystems.applications.disableApplication(app);
            }

            for (const app of opt.input.enabledApplications) {
                if (currentlyEnabledApplications.includes(app)) continue;

                instance.subSystems.applications.enableApplication(app);
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
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.store",
    router: router,
    createContext: createTRPCContext(instance),
});
