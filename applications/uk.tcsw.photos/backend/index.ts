/// <reference path="./global.d.ts" />

import { WorkspacesEvent } from "@tcsw/workspaces-instance/src/systems/events.js";
import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/systems/trpcRouter.js";
import { initTRPC } from "@trpc/server";
import z from "zod";
import path from "path";
import { promises as fs } from "fs";

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
            const faceClusters =
                await db`SELECT cluster_id, name, representative_face_id FROM tricolor_workspaces.public.uk_tcsw_photos_face_clusters WHERE owner_id = ${opt.ctx.userId}`;

            let outputPeople: {
                clusterId: number;
                name?: string;
                representativeFace: { id: number; assetSource: string };
            }[] = [];

            for (const cluster of faceClusters) {
                const representativeFace =
                    await db`SELECT x, y, width, height FROM tricolor_workspaces.public.uk_tcsw_photos_faces WHERE face_id = ${cluster.representative_face_id}`;
                log.info(
                    `Cluster ${cluster.cluster_id} (${cluster.name}) representative face at (${representativeFace[0].x}, ${representativeFace[0].y}, ${representativeFace[0].width}, ${representativeFace[0].height})`,
                );

                let assetSource = "";
                if (representativeFace.length > 0) {
                    const media =
                        await db`SELECT path FROM tricolor_workspaces.public.uk_tcsw_photos_media WHERE image_id = (SELECT image_id FROM tricolor_workspaces.public.uk_tcsw_photos_faces WHERE face_id = ${cluster.representative_face_id})`;

                    if (media.length > 0) {
                        assetSource = await instance.sys.image.serveImage(opt.ctx.userId, media[0].path, {
                            crop: {
                                x: representativeFace[0].x,
                                y: representativeFace[0].y,
                                width: representativeFace[0].width,
                                height: representativeFace[0].height,
                            },
                        });
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

instance.sys.event.on(WorkspacesEvent.QuarterHourly, async () => {
    // find new images in the filesystem and add them to the queue for processing
    const usersRoot = path.join(instance.sys.filesystem.FS_ROOT, "users");
    // Get all user directories
    const userDirs = await fs.readdir(usersRoot);

    for (const userDir of userDirs) {
        const userId = parseInt(path.basename(userDir));
        if (isNaN(userId)) continue;

        // Find all image files in user's directory
        const imagesDir = path.join(userDir, "photos");
        const imageFiles = await fs.readdir(imagesDir, {
            recursive: true,
            filter: (file) => /\.(jpg|jpeg|png)$/i.test(file),
        });

        for (const imagePath of imageFiles) {
            // Check if image is already in the database
            const exists =
                await db`SELECT 1 FROM tricolor_workspaces.public.uk_tcsw_photos_media WHERE path = ${imagePath}`;
            if (exists.length === 0) {
                // Get image metadata
                const metadata = await instance.sys.image.getMetadata(imagePath);
                await db`INSERT INTO tricolor_workspaces.public.uk_tcsw_photos_media (width, height, path, timestamp, location, owner_id) VALUES (${metadata.width}, ${metadata.height}, ${imagePath}, ${metadata.timestamp}, ${metadata.location ?? null}, ${userId})`;
            }
        }
    }

    // scan images left in queue
    const unprocessedImages =
        await db`SELECT image_id, path, owner_id FROM tricolor_workspaces.public.uk_tcsw_photos_media WHERE faces_detected = FALSE OR objects_detected = FALSE`;

    for (const image of unprocessedImages) {
        // perform face detection
        if (!image.faces_detected) {
            const faces = await instance.sys.image.detectFaces(image.owner_id, image.path);
            for (const face of faces) {
                await db`INSERT INTO tricolor_workspaces.public.uk_tcsw_photos_faces (image_id, x, y, width, height, owner_id) VALUES (${image.image_id}, ${face.x}, ${face.y}, ${face.width}, ${face.height}, ${image.owner_id})`;
            }
            await db`UPDATE tricolor_workspaces.public.uk_tcsw_photos_media SET faces_detected = TRUE WHERE image_id = ${image.image_id}`;
        }

        // perform object detection
        if (!image.objects_detected) {
            const objects = await instance.sys.image.detectObjects(image.owner_id, image.path);
            // You may want to store objects in a separate table if needed
            await db`UPDATE tricolor_workspaces.public.uk_tcsw_photos_media SET objects_detected = TRUE WHERE image_id = ${image.image_id}`;
        }
    }
});

instance.sys.event.on(WorkspacesEvent.Daily, () => {
    // remove missing images from the database
});
