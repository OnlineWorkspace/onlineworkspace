/// <reference path="./global.d.ts" />

import { WorkspacesEvent } from "@tcsw/workspaces-instance/src/systems/events.js";
import { BooleanApplicationSetting } from "@tcsw/workspaces-instance/src/systems/settings/applicationSetting/booleanSetting.js";
import {
  createTRPCContext,
  procedure,
} from "@tcsw/workspaces-instance/src/systems/trpcRouter.js";
import { initTRPC } from "@trpc/server";
import z from "zod";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { FaceLandmarker } from "@mediapipe/tasks-vision";

const log = instance.log.createLogger("uk.tcsw.photos");
const db = instance.sys.database.postgres();

export const t = initTRPC
  .context<ReturnType<typeof createTRPCContext>>()
  .create();

await db`CREATE TABLE IF NOT EXISTS public.uk_tcsw_photos_media (
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

await db`CREATE TABLE IF NOT EXISTS public.uk_tcsw_photos_albums (
    album_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cover_image_id INTEGER,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (cover_image_id) REFERENCES uk_tcsw_photos_media(image_id)
)`;

await db`CREATE TABLE IF NOT EXISTS public.uk_tcsw_photos_faces(
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

await db`CREATE TABLE IF NOT EXISTS public.uk_tcsw_photos_face_clusters (
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
        await db`SELECT cluster_id, name, representative_face_id FROM public.uk_tcsw_photos_face_clusters WHERE owner_id = ${opt.ctx.userId}`;

      let outputPeople: {
        clusterId: number;
        name?: string;
        representativeFace: { id: number; assetSource: string };
      }[] = [];

      for (const cluster of faceClusters) {
        const representativeFace =
          await db`SELECT x, y, width, height FROM public.uk_tcsw_photos_faces WHERE face_id = ${cluster.representative_face_id}`;
        log.info(
          `Cluster ${cluster.cluster_id} (${cluster.name}) representative face at (${representativeFace[0].x}, ${representativeFace[0].y}, ${representativeFace[0].width}, ${representativeFace[0].height})`,
        );

        let assetSource = "";
        if (representativeFace.length > 0) {
          const media =
            await db`SELECT path FROM public.uk_tcsw_photos_media WHERE image_id = (SELECT image_id FROM public.uk_tcsw_photos_faces WHERE face_id = ${cluster.representative_face_id})`;

          if (media.length > 0) {
            assetSource = await instance.sys.image.serveImage(
              opt.ctx.userId,
              media[0].path,
              {
                crop: {
                  x: representativeFace[0].x,
                  y: representativeFace[0].y,
                  width: representativeFace[0].width,
                  height: representativeFace[0].height,
                },
              },
            );
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
  basePath: "/api/app/uk.tcsw.photos",
  router: router,
  createContext: createTRPCContext(instance),
});

instance.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting(
      "uk.tcsw.photos",
      "enable_facial_recognition",
      false,
    )
      .setDisplayName("Enable Facial Recognition")
      .setDescription(
        "Allow the application to perform facial recognition on your photos. This will analyze your photos to detect faces and group them together.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting(
      "uk.tcsw.photos",
      "facial_recognition_use_gpu",
      false,
    )
      .setDisplayName("Enable GPU Acceleration for Facial Recognition")
      .setDescription(
        "Allow the application to use GPU acceleration for facial recognition. This can significantly speed up the process of analyzing photos, especially if you have a large collection. Note that this may increase resource usage on your device and requires a compatable GPU.",
      ),
  );
});

instance.sys.event.on(WorkspacesEvent.QuarterHourly, async () => {
  for (const user of await instance.sys.users.getAllUsers()) {
    const userId = user.userId;
    const userFsDir = path.join(
      instance.sys.filesystem.getUserHomeDirectory(user.userId),
      "fs",
    );

    // Find all image files in user's directory
    const imageFiles = await fs.readdir(userFsDir, {
      recursive: true,
    });

    for (const imagePath of imageFiles) {
      // Only process image files supported by sharp
      if (
        !path
          .basename(imagePath)
          .match(/\.(jpe?g|png|webp|tiff?|gif|avif|heif)$/i)
      )
        continue;
      // Check if image is already in the database
      const exists =
        await db`SELECT image_id FROM public.uk_tcsw_photos_media WHERE path = ${imagePath}`;
      if (exists.length === 0) {
        console.log(`Sharp path ${path.join(userFsDir, imagePath)}`);
        const imageMetadata = await sharp(
          path.join(userFsDir, imagePath),
        ).metadata();
        const imageFileStats = await fs.stat(path.join(userFsDir, imagePath));

        await db`INSERT INTO public.uk_tcsw_photos_media (width, height, path, timestamp, owner_id) VALUES (${imageMetadata.width}, ${imageMetadata.height}, ${imagePath}, ${imageFileStats.mtime}, ${userId})`;
      }
    }
  }

  // scan images left in queue
  const unprocessedImages =
    await db`SELECT image_id, path, owner_id, faces_detected, objects_detected
             FROM public.uk_tcsw_photos_media
             WHERE faces_detected = FALSE OR objects_detected = FALSE`;

  // create landmarker
  // const faceLandmarker = await FaceLandmarker.createFromOptions({
  //   wasmBinaryPath: path.join(instance.sys.filesystem.getApplicationSrc("uk.tcsw.photos")!, "backend/services/faceLandmarker/landmarker.wasm")
  // }, {

  // });

  for (const image of unprocessedImages) {
    // perform face detection
    if (!image.faces_detected) {
      const detectedFaces: {
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];

      // perform facial landmarking using MediaPipe.

      for (const face of detectedFaces) {
        await db`INSERT INTO public.uk_tcsw_photos_faces (image_id, x, y, width, height, owner_id) VALUES (${image.image_id}, ${face.x}, ${face.y}, ${face.width}, ${face.height}, ${image.owner_id})`;
      }

      await db`UPDATE public.uk_tcsw_photos_media SET faces_detected = TRUE WHERE image_id = ${image.image_id}`;
    }

    // perform object detection
    if (!image.objects_detected) {
      // const objects = await instance.sys.image.detectObjects(image.owner_id, image.path);
      // You may want to store objects in a separate table if needed
      // await db`UPDATE public.uk_tcsw_photos_media SET objects_detected = TRUE WHERE image_id = ${image.image_id}`;
    }
  }
});

instance.sys.event.on(WorkspacesEvent.Daily, () => {
  // remove missing images from the database
});
