/// <reference path="./global.d.ts" />

import { WorkspacesEvent } from "@tcsw/workspaces-instance/src/systems/events";
import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/systems/trpcRouter";
import { initTRPC } from "@trpc/server";
import z from "zod";

const log = instance.log.createLogger("uk.tcsw.photos");
const db = instance.sys.database.postgres();

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

await db`CREATE TABLE IF NOT EXISTS tricolor_workspaces.public.uk_tcsw_photos_media (
    image_id SERIAL PRIMARY KEY,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    path TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    location TEXT,
    owner_id INTEGER NOT NULL,
    faces_detected BOOLEAN DEFAULT FALSE,
    objects_detected BOOLEAN DEFAULT FALSE
)`;

await db`CREATE TABLE IF NOT EXISTS tricolor_workspaces.public.uk_tcsw_photos_albums (
    album_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cover_image_id INTEGER,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (cover_image_id) REFERENCES uk_tcsw_photos_media(image_id)
)`;

await db`CREATE TABLE IF NOT EXISTS tricolor_workspaces.public.uk_tcsw_photos_faces(
    face_id SERIAL PRIMARY KEY,
    image_id INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    cluster_id INTEGER,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (image_id) REFERENCES uk_tcsw_photos_media(image_id)
)`;

await db`CREATE TABLE IF NOT EXISTS tricolor_workspaces.public.uk_tcsw_photos_face_clusters (
    cluster_id SERIAL PRIMARY KEY,
    name TEXT DEFAULT NULL,
    representative_face_id INTEGER,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (representative_face_id) REFERENCES uk_tcsw_photos_faces(face_id)
)`;

const router = t.router({
    search: {
        people: procedure.input(z.string()).query(async (opt) => {
            const faceClusters = await db`SELECT cluster_id, name, representative_face_id FROM tricolor_workspaces.public.uk_tcsw_photos_face_clusters WHERE owner_id = ${opt.ctx.userId}`;

            let outputPeople: { clusterId: number, name?: string, representativeFace: { id: number, assetSource: string }}[] = [];

            for (const cluster of faceClusters) {
                const representativeFace = await db`SELECT x, y, width, height FROM tricolor_workspaces.public.uk_tcsw_photos_faces WHERE face_id = ${cluster.representative_face_id}`;
                log.info(`Cluster ${cluster.cluster_id} (${cluster.name}) representative face at (${representativeFace[0].x}, ${representativeFace[0].y}, ${representativeFace[0].width}, ${representativeFace[0].height})`);

                let assetSource = "";
                if (representativeFace.length > 0) {
                    const media = await db`SELECT path FROM tricolor_workspaces.public.uk_tcsw_photos_media WHERE image_id = (SELECT image_id FROM tricolor_workspaces.public.uk_tcsw_photos_faces WHERE face_id = ${cluster.representative_face_id})`;

                    if (media.length > 0) {
                        assetSource = instance.sys.image.getCroppedImageUrl(media[0].path, representativeFace[0].x, representativeFace[0].y, representativeFace[0].width, representativeFace[0].height);
                    }

                    outputPeople.push({
                        clusterId: cluster.cluster_id,
                        name: cluster.name ?? undefined,
                        representativeFace: {
                            id: cluster.representative_face_id,
                            assetSource: assetSource,
                        },
                    });
                }
            }

            return {
                people: outputPeople,
            };
        }),
        albums: procedure.input(z.string()).query(async (opt) => {
            return {
                albums: [],
            };
        }),
        places: procedure.input(z.string()).query(async (opt) => {
            return {
                places: [],
            };
        }),
    },
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.photos",
    router: router,
    createContext: createTRPCContext(instance),
});

instance.sys.event.on(WorkspacesEvent.QuarterHourly, () => {
    // scan images left in queue
});

instance.sys.event.on(WorkspacesEvent.Daily, () => {
    // remove missing images from the database
});
