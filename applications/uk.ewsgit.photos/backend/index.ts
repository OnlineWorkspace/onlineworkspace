/// <reference path="./global.d.ts" />

import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { WorkspacesEvent } from "@onlineworkspace/workspace-backend/src/systems/events.ts";
import { BooleanApplicationSetting, GlobalBooleanApplicationSetting } from "@onlineworkspace/workspace-backend/src/systems/settings/applicationSetting/booleanSetting.ts";
import { createOnlineWorkspaceTRPCContext, procedure } from "@onlineworkspace/workspace-backend/src/systems/trpc/coreRouter.ts";
import { getCookies } from "@onlineworkspace/workspace-backend/src/utils/cookies.ts";
import { initTRPC, TRPCError } from "@trpc/server";
import sharp from "sharp";
import z from "zod";
import { db, ensureSchema } from "./lib/db.ts";
import {
  APPLICATION_ID,
  cleanLibrary,
  dropThumbnails,
  extensionOf,
  indexFile,
  kindOf,
  locate,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MIME_TYPES,
  type MediaRow,
  purgeMedia,
  scanUser,
  thumbnailDirectory,
  trashDirectory,
  uniqueName,
  uploadDirectory,
  userRoot,
} from "./lib/library.ts";
import { PAGE_HEADERS, renderSharedItems, renderUnavailablePage, type SharedItem } from "./lib/sharePage.ts";
import { snapSize, thumbnailFor } from "./lib/thumbnails.ts";

const log = instance.log.createLogger(APPLICATION_ID);

export const t = initTRPC.context<ReturnType<typeof createOnlineWorkspaceTRPCContext>>().create();

await ensureSchema();

// ---------- shapes sent to the web app ----------

export interface MediaItem {
  id: number;
  width: number;
  height: number;
  // milliseconds since the epoch
  takenAt: number;
  kind: "image" | "video";
  favorite: boolean;
  // changes whenever the file's content does, used to bust caches
  version: number;
}

const toItem = (row: MediaRow): MediaItem => ({
  id: row.image_id,
  width: row.width,
  height: row.height,
  takenAt: new Date(row.timestamp).getTime(),
  kind: row.media_type,
  favorite: row.favorite,
  version: row.version,
});

const LIST_LIMIT = 50_000;
const MEMORY_MINIMUM_ITEMS = 4;
const MEMORY_LIMIT = 60;
const SYNC_INTERVAL_MS = 30_000;

const idInput = z.number().int().positive();
const idsInput = idInput.array().min(1).max(5000);
const nameInput = z.string().trim().min(1).max(120);

/** `%` and `_` in a search must match themselves, not act as wildcards. */
const likePattern = (query: string) => `%${query.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;

async function ownedRows(userId: number, ids: number[]): Promise<MediaRow[]> {
  return (await db`SELECT * FROM public.uk_ewsgit_photos_media WHERE owner_id = ${userId} AND image_id IN ${db(ids)}`) as MediaRow[];
}

async function ownedRow(userId: number, id: number): Promise<MediaRow> {
  const [row] = await ownedRows(userId, [id]);

  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "That photo does not exist" });

  return row;
}

async function ownedAlbum(userId: number, albumId: number) {
  const [album] = await db`SELECT album_id, name, cover_image_id FROM public.uk_ewsgit_photos_albums WHERE album_id = ${albumId} AND owner_id = ${userId}`;

  if (!album) throw new TRPCError({ code: "NOT_FOUND", message: "That album does not exist" });

  return album as { album_id: number; name: string; cover_image_id: number | null };
}

/**
 * Facial recognition runs for a user only when the instance allows it and the user has turned it on themselves.
 * The two are reported separately so that the page can say which one is holding it back.
 */
async function facialRecognitionFor(userId: number): Promise<{ allowedByInstance: boolean; enabledByUser: boolean; enabled: boolean }> {
  const allowedByInstance = (await instance.sys.settings.applicationSettings[APPLICATION_ID]?.find((setting) => setting.id === "global_facial_recognition")?.onValueChange(userId)) === true;
  const enabledByUser = allowedByInstance && (await instance.sys.settings.getUserApplicationSetting(userId, APPLICATION_ID, "enable_facial_recognition")) === true;

  return { allowedByInstance, enabledByUser, enabled: allowedByInstance && enabledByUser };
}

const lastSync = new Map<number, number>();

const router = t.router({
  library: t.router({
    /** Looks for new files in the user's storage, at most every half minute. */
    sync: procedure.mutation(async (opt) => {
      const now = Date.now();

      if (now - (lastSync.get(opt.ctx.userId) ?? 0) < SYNC_INTERVAL_MS) return { added: 0 };

      lastSync.set(opt.ctx.userId, now);

      return { added: (await scanUser(opt.ctx.userId)).added };
    }),

    counts: procedure.query(async (opt) => {
      const [row] = await db`SELECT
          count(*) FILTER (WHERE deleted_at IS NULL AND favorite)::int AS favorites,
          count(*) FILTER (WHERE deleted_at IS NULL AND archived)::int AS archive,
          count(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS trash,
          count(*) FILTER (WHERE deleted_at IS NULL)::int AS total
        FROM public.uk_ewsgit_photos_media WHERE owner_id = ${opt.ctx.userId}`;

      return row as { favorites: number; archive: number; trash: number; total: number };
    }),
  }),

  media: t.router({
    list: procedure
      .input(
        z.object({
          scope: z.enum(["all", "favorites", "videos", "screenshots", "archive", "trash", "album", "memory", "person"]).default("all"),
          albumId: idInput.optional(),
          personId: idInput.optional(),
          memoryId: z.string().regex(/^\d{4}-\d{2}$/).optional(),
          query: z.string().trim().max(200).optional(),
          place: z.string().trim().max(200).optional(),
        }),
      )
      .query(async (opt) => {
        const { scope, albumId, personId, memoryId, query, place } = opt.input;
        const conditions = [db`m.owner_id = ${opt.ctx.userId}`];

        if (scope === "trash") {
          conditions.push(db`m.deleted_at IS NOT NULL`);
        } else {
          conditions.push(db`m.deleted_at IS NULL`);

          // archived items stay out of the timeline, but remain in albums and in search
          if (scope !== "archive" && scope !== "album" && !query) conditions.push(db`m.archived = FALSE`);
        }

        if (scope === "favorites") conditions.push(db`m.favorite = TRUE`);
        if (scope === "videos") conditions.push(db`m.media_type = 'video'`);
        if (scope === "screenshots") conditions.push(db`m.is_screenshot = TRUE`);
        if (scope === "archive") conditions.push(db`m.archived = TRUE`);

        if (scope === "album") {
          if (albumId === undefined) throw new TRPCError({ code: "BAD_REQUEST", message: "An album is required" });

          await ownedAlbum(opt.ctx.userId, albumId);
          conditions.push(db`m.image_id IN (SELECT image_id FROM public.uk_ewsgit_photos_album_media WHERE album_id = ${albumId})`);
        }

        if (scope === "person") {
          if (personId === undefined) throw new TRPCError({ code: "BAD_REQUEST", message: "A person is required" });
          if (!(await facialRecognitionFor(opt.ctx.userId)).enabled) throw new TRPCError({ code: "BAD_REQUEST", message: "Facial recognition is turned off" });

          conditions.push(db`m.image_id IN (SELECT image_id FROM public.uk_ewsgit_photos_faces WHERE cluster_id = ${personId} AND owner_id = ${opt.ctx.userId})`);
        }

        if (scope === "memory") {
          if (!memoryId) throw new TRPCError({ code: "BAD_REQUEST", message: "A memory is required" });

          conditions.push(db`to_char(m.timestamp AT TIME ZONE 'UTC', 'YYYY-MM') = ${memoryId}`);
        }

        if (place) conditions.push(db`m.location = ${place}`);

        if (query) {
          const pattern = likePattern(query);
          conditions.push(
            db`(m.path ILIKE ${pattern} OR m.description ILIKE ${pattern} OR m.location ILIKE ${pattern} OR m.camera ILIKE ${pattern})`,
          );
        }

        const clause = conditions.reduce((all, next) => db`${all} AND ${next}`);

        const rows = (await db`SELECT m.* FROM public.uk_ewsgit_photos_media m WHERE ${clause}
          ORDER BY m.timestamp DESC, m.image_id DESC LIMIT ${LIST_LIMIT}`) as MediaRow[];

        return { items: rows.map(toItem) };
      }),

    get: procedure.input(z.object({ id: idInput })).query(async (opt) => {
      const row = await ownedRow(opt.ctx.userId, opt.input.id);

      const albums = (await db`SELECT a.album_id AS id, a.name
        FROM public.uk_ewsgit_photos_album_media am
        JOIN public.uk_ewsgit_photos_albums a ON a.album_id = am.album_id
        WHERE am.image_id = ${row.image_id} AND a.owner_id = ${opt.ctx.userId}
        ORDER BY a.name`) as { id: number; name: string }[];

      return {
        ...toItem(row),
        name: path.basename(row.path),
        folder: path.dirname(row.path) === "." ? "" : path.dirname(row.path),
        size: Number(row.size_bytes),
        description: row.description ?? "",
        location: row.location,
        camera: row.camera,
        exposure: row.exposure,
        archived: row.archived,
        deleted: row.deleted_at !== null,
        albums,
      };
    }),

    setFavorite: procedure.input(z.object({ ids: idsInput, value: z.boolean() })).mutation(async (opt) => {
      await db`UPDATE public.uk_ewsgit_photos_media SET favorite = ${opt.input.value}
        WHERE owner_id = ${opt.ctx.userId} AND deleted_at IS NULL AND image_id IN ${db(opt.input.ids)}`;
    }),

    setArchived: procedure.input(z.object({ ids: idsInput, value: z.boolean() })).mutation(async (opt) => {
      await db`UPDATE public.uk_ewsgit_photos_media SET archived = ${opt.input.value}
        WHERE owner_id = ${opt.ctx.userId} AND deleted_at IS NULL AND image_id IN ${db(opt.input.ids)}`;
    }),

    setDescription: procedure.input(z.object({ id: idInput, description: z.string().max(2000) })).mutation(async (opt) => {
      const description = opt.input.description.trim();

      await db`UPDATE public.uk_ewsgit_photos_media SET description = ${description === "" ? null : description}
        WHERE owner_id = ${opt.ctx.userId} AND image_id = ${opt.input.id}`;
    }),

    setLocation: procedure.input(z.object({ ids: idsInput, location: z.string().max(200) })).mutation(async (opt) => {
      const location = opt.input.location.trim();

      await db`UPDATE public.uk_ewsgit_photos_media SET location = ${location === "" ? null : location}
        WHERE owner_id = ${opt.ctx.userId} AND deleted_at IS NULL AND image_id IN ${db(opt.input.ids)}`;
    }),

    /** Moves items to the trash. Their files go to a folder of their own, so they also disappear from the user's file listing. */
    trash: procedure.input(z.object({ ids: idsInput })).mutation(async (opt) => {
      const userId = opt.ctx.userId;
      const rows = (await ownedRows(userId, opt.input.ids)).filter((row) => row.deleted_at === null);

      await fs.mkdir(trashDirectory(userId), { recursive: true });

      let moved = 0;

      for (const row of rows) {
        try {
          const source = await locate(row);
          await fs.rename(source, path.join(trashDirectory(userId), `${row.image_id}.${extensionOf(row.path)}`));
        } catch (error) {
          // a file that is already gone has nothing left to trash
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            await purgeMedia(userId, [row]);
            continue;
          }

          log.error(`Could not move '${row.path}' to the trash`, error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not move that item to the trash" });
        }

        await db`UPDATE public.uk_ewsgit_photos_media SET deleted_at = now() WHERE image_id = ${row.image_id}`;
        moved += 1;
      }

      return { moved };
    }),

    restore: procedure.input(z.object({ ids: idsInput })).mutation(async (opt) => {
      const userId = opt.ctx.userId;
      const rows = (await ownedRows(userId, opt.input.ids)).filter((row) => row.deleted_at !== null);
      const root = userRoot(userId);

      for (const row of rows) {
        const source = path.join(trashDirectory(userId), `${row.image_id}.${extensionOf(row.path)}`);
        const directory = path.resolve(root, path.dirname(row.path));

        if (directory !== root && !directory.startsWith(root + path.sep)) continue;

        try {
          await fs.mkdir(directory, { recursive: true });

          // somebody may have put another file at the old location in the meantime
          const target = path.join(directory, await uniqueName(directory, path.basename(row.path)));
          await fs.rename(source, target);

          await db`UPDATE public.uk_ewsgit_photos_media SET deleted_at = NULL, path = ${path.relative(root, target)} WHERE image_id = ${row.image_id}`;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            await purgeMedia(userId, [row]);
            continue;
          }

          log.error(`Could not restore '${row.path}'`, error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not restore that item" });
        }
      }

      return { restored: rows.length };
    }),

    deletePermanently: procedure.input(z.object({ ids: idsInput })).mutation(async (opt) => {
      const rows = (await ownedRows(opt.ctx.userId, opt.input.ids)).filter((row) => row.deleted_at !== null);

      await purgeMedia(opt.ctx.userId, rows);

      return { deleted: rows.length };
    }),

    emptyTrash: procedure.mutation(async (opt) => {
      const rows = (await db`SELECT * FROM public.uk_ewsgit_photos_media WHERE owner_id = ${opt.ctx.userId} AND deleted_at IS NOT NULL`) as MediaRow[];

      await purgeMedia(opt.ctx.userId, rows);

      return { deleted: rows.length };
    }),

    /** Rotates and/or mirrors a photo, either as a new photo next to it or in place. */
    edit: procedure
      .input(
        z.object({
          id: idInput,
          rotate: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
          flip: z.boolean(),
          mode: z.enum(["copy", "replace"]),
        }),
      )
      .mutation(async (opt) => {
        const userId = opt.ctx.userId;
        const row = await ownedRow(userId, opt.input.id);
        const extension = extensionOf(row.path);

        if (row.deleted_at) throw new TRPCError({ code: "BAD_REQUEST", message: "Restore this photo before editing it" });
        if (row.media_type !== "image" || !["jpg", "jpeg", "png", "webp"].includes(extension)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This kind of file cannot be edited" });
        }
        if (opt.input.rotate === 0 && !opt.input.flip) throw new TRPCError({ code: "BAD_REQUEST", message: "There are no changes to save" });

        const source = await locate(row);
        const sourceStats = await fs.stat(source);

        // the rotation that is stored in the file is applied first, so that what the user saw is what gets saved
        let pipeline = sharp(source, { failOn: "none" }).autoOrient().rotate(opt.input.rotate);
        if (opt.input.flip) pipeline = pipeline.flop();

        pipeline = extension === "png" ? pipeline.png() : extension === "webp" ? pipeline.webp({ quality: 92 }) : pipeline.jpeg({ quality: 92 });

        const swapped = opt.input.rotate === 90 || opt.input.rotate === 270;
        const [width, height] = swapped ? [row.height, row.width] : [row.width, row.height];

        if (opt.input.mode === "replace") {
          const temporary = `${source}.${process.pid}.${Date.now()}.tmp`;

          await pipeline.toFile(temporary);
          await fs.utimes(temporary, sourceStats.atime, sourceStats.mtime);
          await fs.rename(temporary, source);

          const size = (await fs.stat(source)).size;

          const [updated] = await db`UPDATE public.uk_ewsgit_photos_media
            SET width = ${width}, height = ${height}, size_bytes = ${size}, version = version + 1
            WHERE image_id = ${row.image_id} RETURNING *`;

          await dropThumbnails(userId, row.image_id);

          return toItem(updated as MediaRow);
        }

        const directory = path.dirname(source);
        const stem = path.basename(row.path, path.extname(row.path));
        const name = await uniqueName(directory, `${stem} (edited).${extension}`);
        const target = path.join(directory, name);

        await pipeline.toFile(target);
        await fs.utimes(target, sourceStats.atime, sourceStats.mtime);

        const size = (await fs.stat(target)).size;
        const relative = path.relative(userRoot(userId), target);

        // the copy is the same moment, in the same place, so it keeps the original's date and details
        const [created] = await db`INSERT INTO public.uk_ewsgit_photos_media
            (width, height, path, timestamp, owner_id, media_type, size_bytes, description, location, camera, exposure, meta_version)
          VALUES (${width}, ${height}, ${relative}, ${row.timestamp}, ${userId}, 'image', ${size}, ${row.description}, ${row.location}, ${row.camera}, ${row.exposure}, ${row.meta_version})
          RETURNING *`;

        await db`INSERT INTO public.uk_ewsgit_photos_album_media (album_id, image_id)
          SELECT album_id, ${(created as MediaRow).image_id} FROM public.uk_ewsgit_photos_album_media WHERE image_id = ${row.image_id}
          ON CONFLICT DO NOTHING`;

        return toItem(created as MediaRow);
      }),
  }),

  albums: t.router({
    list: procedure.query(async (opt) => {
      const rows = (await db`SELECT a.album_id AS id, a.name,
          (SELECT count(*)::int FROM public.uk_ewsgit_photos_album_media am
             JOIN public.uk_ewsgit_photos_media m ON m.image_id = am.image_id AND m.deleted_at IS NULL
             WHERE am.album_id = a.album_id) AS count,
          COALESCE(
            (SELECT c.image_id FROM public.uk_ewsgit_photos_media c WHERE c.image_id = a.cover_image_id AND c.deleted_at IS NULL),
            (SELECT m.image_id FROM public.uk_ewsgit_photos_album_media am
               JOIN public.uk_ewsgit_photos_media m ON m.image_id = am.image_id AND m.deleted_at IS NULL AND m.media_type = 'image'
               WHERE am.album_id = a.album_id ORDER BY m.timestamp DESC LIMIT 1)
          ) AS cover_id,
          GREATEST(a.created_at, COALESCE((SELECT max(am.added_at) FROM public.uk_ewsgit_photos_album_media am WHERE am.album_id = a.album_id), a.created_at)) AS updated_at
        FROM public.uk_ewsgit_photos_albums a
        WHERE a.owner_id = ${opt.ctx.userId}
        ORDER BY updated_at DESC, a.album_id DESC`) as { id: number; name: string; count: number; cover_id: number | null }[];

      const versions = new Map<number, number>();
      const coverIds = rows.flatMap((row) => (row.cover_id === null ? [] : [row.cover_id]));

      if (coverIds.length > 0) {
        for (const cover of (await db`SELECT image_id, version FROM public.uk_ewsgit_photos_media WHERE image_id IN ${db(coverIds)}`) as { image_id: number; version: number }[]) {
          versions.set(cover.image_id, cover.version);
        }
      }

      return {
        albums: rows.map((row) => ({
          id: row.id,
          name: row.name,
          count: row.count,
          cover: row.cover_id === null ? null : { id: row.cover_id, version: versions.get(row.cover_id) ?? 0 },
        })),
      };
    }),

    get: procedure.input(z.object({ id: idInput })).query(async (opt) => {
      const album = await ownedAlbum(opt.ctx.userId, opt.input.id);

      return { id: album.album_id, name: album.name };
    }),

    create: procedure.input(z.object({ name: nameInput, ids: idsInput.optional() })).mutation(async (opt) => {
      const [album] = await db`INSERT INTO public.uk_ewsgit_photos_albums (name, owner_id) VALUES (${opt.input.name}, ${opt.ctx.userId}) RETURNING album_id`;
      const albumId = (album as { album_id: number }).album_id;

      if (opt.input.ids) {
        await db`INSERT INTO public.uk_ewsgit_photos_album_media (album_id, image_id)
          SELECT ${albumId}, image_id FROM public.uk_ewsgit_photos_media
          WHERE owner_id = ${opt.ctx.userId} AND deleted_at IS NULL AND image_id IN ${db(opt.input.ids)}
          ON CONFLICT DO NOTHING`;
      }

      return { id: albumId };
    }),

    rename: procedure.input(z.object({ id: idInput, name: nameInput })).mutation(async (opt) => {
      await ownedAlbum(opt.ctx.userId, opt.input.id);
      await db`UPDATE public.uk_ewsgit_photos_albums SET name = ${opt.input.name} WHERE album_id = ${opt.input.id}`;
    }),

    /** Deletes the album only, the photos in it stay in the library. */
    delete: procedure.input(z.object({ id: idInput })).mutation(async (opt) => {
      await ownedAlbum(opt.ctx.userId, opt.input.id);
      await db`DELETE FROM public.uk_ewsgit_photos_albums WHERE album_id = ${opt.input.id}`;
    }),

    addMedia: procedure.input(z.object({ id: idInput, ids: idsInput })).mutation(async (opt) => {
      await ownedAlbum(opt.ctx.userId, opt.input.id);

      await db`INSERT INTO public.uk_ewsgit_photos_album_media (album_id, image_id)
        SELECT ${opt.input.id}, image_id FROM public.uk_ewsgit_photos_media
        WHERE owner_id = ${opt.ctx.userId} AND deleted_at IS NULL AND image_id IN ${db(opt.input.ids)}
        ON CONFLICT DO NOTHING`;
    }),

    removeMedia: procedure.input(z.object({ id: idInput, ids: idsInput })).mutation(async (opt) => {
      await ownedAlbum(opt.ctx.userId, opt.input.id);

      await db`DELETE FROM public.uk_ewsgit_photos_album_media WHERE album_id = ${opt.input.id} AND image_id IN ${db(opt.input.ids)}`;
      await db`UPDATE public.uk_ewsgit_photos_albums SET cover_image_id = NULL WHERE album_id = ${opt.input.id} AND cover_image_id IN ${db(opt.input.ids)}`;
    }),

    setCover: procedure.input(z.object({ id: idInput, imageId: idInput })).mutation(async (opt) => {
      await ownedAlbum(opt.ctx.userId, opt.input.id);

      const updated = await db`UPDATE public.uk_ewsgit_photos_albums SET cover_image_id = ${opt.input.imageId}
        WHERE album_id = ${opt.input.id}
          AND EXISTS (SELECT 1 FROM public.uk_ewsgit_photos_album_media WHERE album_id = ${opt.input.id} AND image_id = ${opt.input.imageId})
        RETURNING album_id`;

      if (updated.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "That photo is not in this album" });
    }),
  }),

  places: procedure.query(async (opt) => {
    const rows = (await db`SELECT location AS name, count(*)::int AS count
      FROM public.uk_ewsgit_photos_media
      WHERE owner_id = ${opt.ctx.userId} AND deleted_at IS NULL AND location IS NOT NULL
      GROUP BY location ORDER BY count(*) DESC, location`) as { name: string; count: number }[];

    return { places: rows };
  }),

  memories: procedure.query(async (opt) => {
    // only whole months that are over, each with enough in it to be worth looking back at
    const rows = (await db`SELECT g.id, g.count, g.place, c.image_id AS cover_id, c.version AS cover_version
      FROM (
        SELECT to_char(m.timestamp AT TIME ZONE 'UTC', 'YYYY-MM') AS id, count(*)::int AS count, mode() WITHIN GROUP (ORDER BY m.location) AS place
        FROM public.uk_ewsgit_photos_media m
        WHERE m.owner_id = ${opt.ctx.userId} AND m.deleted_at IS NULL AND m.archived = FALSE
          AND m.timestamp < (date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
        GROUP BY 1 HAVING count(*) >= ${MEMORY_MINIMUM_ITEMS}
      ) g
      JOIN LATERAL (
        SELECT c.image_id, c.version FROM public.uk_ewsgit_photos_media c
        WHERE c.owner_id = ${opt.ctx.userId} AND c.deleted_at IS NULL AND c.archived = FALSE AND c.media_type = 'image'
          AND to_char(c.timestamp AT TIME ZONE 'UTC', 'YYYY-MM') = g.id
        ORDER BY c.favorite DESC, c.timestamp DESC LIMIT 1
      ) c ON TRUE
      ORDER BY g.id DESC LIMIT ${MEMORY_LIMIT}`) as { id: string; count: number; place: string | null; cover_id: number; cover_version: number }[];

    return {
      memories: rows.map((row) => ({ id: row.id, count: row.count, place: row.place, cover: { id: row.cover_id, version: row.cover_version } })),
    };
  }),

  shares: t.router({
    list: procedure.query(async (opt) => {
      const rows = (await db`SELECT s.share_id AS id, s.token, s.created_at, s.album_id, s.image_id,
          a.name AS album_name,
          COALESCE(
            (SELECT c.image_id FROM public.uk_ewsgit_photos_media c WHERE c.image_id = a.cover_image_id AND c.deleted_at IS NULL),
            (SELECT m.image_id FROM public.uk_ewsgit_photos_album_media am
               JOIN public.uk_ewsgit_photos_media m ON m.image_id = am.image_id AND m.deleted_at IS NULL AND m.media_type = 'image'
               WHERE am.album_id = s.album_id ORDER BY m.timestamp DESC LIMIT 1),
            s.image_id
          ) AS cover_id,
          (SELECT count(*)::int FROM public.uk_ewsgit_photos_album_media am
             JOIN public.uk_ewsgit_photos_media m ON m.image_id = am.image_id AND m.deleted_at IS NULL
             WHERE am.album_id = s.album_id) AS count,
          i.path AS image_path
        FROM public.uk_ewsgit_photos_shares s
        LEFT JOIN public.uk_ewsgit_photos_albums a ON a.album_id = s.album_id
        LEFT JOIN public.uk_ewsgit_photos_media i ON i.image_id = s.image_id
        WHERE s.owner_id = ${opt.ctx.userId}
        ORDER BY s.created_at DESC`) as {
        id: number;
        token: string;
        created_at: Date;
        album_id: number | null;
        image_id: number | null;
        album_name: string | null;
        cover_id: number | null;
        count: number | null;
        image_path: string | null;
      }[];

      const versions = new Map<number, number>();
      const coverIds = rows.flatMap((row) => (row.cover_id === null ? [] : [row.cover_id]));

      if (coverIds.length > 0) {
        for (const cover of (await db`SELECT image_id, version FROM public.uk_ewsgit_photos_media WHERE image_id IN ${db(coverIds)}`) as { image_id: number; version: number }[]) {
          versions.set(cover.image_id, cover.version);
        }
      }

      return {
        shares: rows.map((row) => ({
          id: row.id,
          token: row.token,
          createdAt: new Date(row.created_at).getTime(),
          kind: row.album_id === null ? ("photo" as const) : ("album" as const),
          albumId: row.album_id,
          imageId: row.image_id,
          title: row.album_id === null ? path.basename(row.image_path ?? "Photo") : (row.album_name ?? "Album"),
          count: row.album_id === null ? 1 : (row.count ?? 0),
          cover: row.cover_id === null ? null : { id: row.cover_id, version: versions.get(row.cover_id) ?? 0 },
        })),
      };
    }),

    /** Creates a link for an album or a photo, or returns the one that already exists. */
    create: procedure
      .input(z.object({ albumId: idInput.optional(), imageId: idInput.optional() }).refine((value) => (value.albumId === undefined) !== (value.imageId === undefined), "Share either an album or a photo"))
      .mutation(async (opt) => {
        const userId = opt.ctx.userId;

        if (opt.input.albumId !== undefined) await ownedAlbum(userId, opt.input.albumId);
        else {
          const row = await ownedRow(userId, opt.input.imageId!);
          if (row.deleted_at) throw new TRPCError({ code: "BAD_REQUEST", message: "A photo in the trash cannot be shared" });
        }

        const [existing] =
          opt.input.albumId !== undefined
            ? await db`SELECT share_id AS id, token FROM public.uk_ewsgit_photos_shares WHERE owner_id = ${userId} AND album_id = ${opt.input.albumId}`
            : await db`SELECT share_id AS id, token FROM public.uk_ewsgit_photos_shares WHERE owner_id = ${userId} AND image_id = ${opt.input.imageId!}`;

        if (existing) return existing as { id: number; token: string };

        const token = randomBytes(24).toString("base64url");
        const [created] = await db`INSERT INTO public.uk_ewsgit_photos_shares (token, owner_id, album_id, image_id)
          VALUES (${token}, ${userId}, ${opt.input.albumId ?? null}, ${opt.input.imageId ?? null}) RETURNING share_id AS id, token`;

        return created as { id: number; token: string };
      }),

    revoke: procedure.input(z.object({ id: idInput })).mutation(async (opt) => {
      await db`DELETE FROM public.uk_ewsgit_photos_shares WHERE share_id = ${opt.input.id} AND owner_id = ${opt.ctx.userId}`;
    }),
  }),

  faces: t.router({
    status: procedure.query(async (opt) => facialRecognitionFor(opt.ctx.userId)),

    list: procedure.query(async (opt) => {
      if (!(await facialRecognitionFor(opt.ctx.userId)).enabled) return { people: [] };

      const rows = (await db`SELECT c.cluster_id AS id, c.name, c.representative_face_id AS face_id,
          (SELECT count(DISTINCT f.image_id)::int FROM public.uk_ewsgit_photos_faces f
             JOIN public.uk_ewsgit_photos_media m ON m.image_id = f.image_id AND m.deleted_at IS NULL
             WHERE f.cluster_id = c.cluster_id) AS count
        FROM public.uk_ewsgit_photos_face_clusters c
        WHERE c.owner_id = ${opt.ctx.userId} AND c.representative_face_id IS NOT NULL
        ORDER BY count DESC, c.cluster_id`) as { id: number; name: string | null; face_id: number; count: number }[];

      return { people: rows.filter((row) => row.count > 0).map((row) => ({ id: row.id, name: row.name, faceId: row.face_id, count: row.count })) };
    }),

    get: procedure.input(z.object({ id: idInput })).query(async (opt) => {
      if (!(await facialRecognitionFor(opt.ctx.userId)).enabled) throw new TRPCError({ code: "NOT_FOUND", message: "Facial recognition is turned off" });

      const [row] = await db`SELECT cluster_id AS id, name FROM public.uk_ewsgit_photos_face_clusters WHERE cluster_id = ${opt.input.id} AND owner_id = ${opt.ctx.userId}`;

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "That person does not exist" });

      return row as { id: number; name: string | null };
    }),

    rename: procedure.input(z.object({ id: idInput, name: z.string().trim().max(120) })).mutation(async (opt) => {
      if (!(await facialRecognitionFor(opt.ctx.userId)).enabled) throw new TRPCError({ code: "BAD_REQUEST", message: "Facial recognition is turned off" });

      await db`UPDATE public.uk_ewsgit_photos_face_clusters SET name = ${opt.input.name === "" ? null : opt.input.name}
        WHERE cluster_id = ${opt.input.id} AND owner_id = ${opt.ctx.userId}`;
    }),
  }),

  search: t.router({
    people: procedure.input(z.string()).query(async (opt) => {
      const faceClusters =
        await db`SELECT cluster_id, name, representative_face_id FROM public.uk_ewsgit_photos_face_clusters WHERE owner_id = ${opt.ctx.userId}`;

      const outputPeople: {
        clusterId: number;
        name?: string;
        representativeFace: { id: number; assetSource: string };
      }[] = [];

      for (const cluster of faceClusters) {
        const representativeFace = await db`SELECT x, y, width, height FROM public.uk_ewsgit_photos_faces WHERE face_id = ${cluster.representative_face_id}`;

        if (representativeFace.length === 0) continue;

        log.info(
          `Cluster ${cluster.cluster_id} (${cluster.name}) representative face at (${representativeFace[0].x}, ${representativeFace[0].y}, ${representativeFace[0].width}, ${representativeFace[0].height})`,
        );

        let assetSource = "";
        const media =
          await db`SELECT path FROM public.uk_ewsgit_photos_media WHERE image_id = (SELECT image_id FROM public.uk_ewsgit_photos_faces WHERE face_id = ${cluster.representative_face_id})`;

        if (media.length > 0) {
          assetSource = await instance.sys.image.serveImage(opt.ctx.userId, path.join(userRoot(opt.ctx.userId), media[0].path), {
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

      return {
        people: outputPeople,
      };
    }),
  }),
});

export type TRPCRouter = typeof router;

instance.sys.tRPC.registerTRPCRouter(router, `/api/app/${APPLICATION_ID}`);

// ---------- files over HTTP ----------
// Previews, originals and uploads are streamed, which tRPC's JSON transport cannot do.

const unauthorized = () => Response.json({ code: "UNAUTHORIZED", message: "invalid session" }, { status: 401 });
const notFound = () => Response.json({ code: "NOT_FOUND", message: "That item does not exist" }, { status: 404 });

async function sessionUserId(req: Request): Promise<number | undefined> {
  const authorization = getCookies(req.headers).Authorization;

  return authorization ? ((await instance.sys.authorization.verifySession(decodeURIComponent(authorization))) ?? undefined) : undefined;
}

const attachment = (name: string) => `attachment; filename="${name.replace(/[^\x20-\x7e]|["\\]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`;

async function findRow(userId: number, id: number): Promise<MediaRow | undefined> {
  if (!Number.isInteger(id) || id < 1) return undefined;

  return ((await db`SELECT * FROM public.uk_ewsgit_photos_media WHERE image_id = ${id} AND owner_id = ${userId}`) as MediaRow[])[0];
}

/** Sends a file, honouring byte ranges so that videos can be scrubbed. */
async function sendFile(req: Request, absolute: string, row: MediaRow, options: { download: boolean; cache: string }): Promise<Response> {
  const stats = await fs.stat(absolute);
  const size = stats.size;
  const extension = extensionOf(row.path);
  const etag = `"${row.version}-${size}-${Math.floor(stats.mtimeMs)}"`;

  const headers: Record<string, string> = {
    "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    ETag: etag,
    "Cache-Control": options.cache,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Disposition": options.download ? attachment(path.basename(row.path)) : "inline",
  };

  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

  const file = Bun.file(absolute);
  const range = req.headers.get("range");

  if (!range) return new Response(file, { headers: { ...headers, "Content-Length": String(size) } });

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start = 0;
  let end = size - 1;

  if (match && (match[1] !== "" || match[2] !== "")) {
    if (match[1] === "") {
      // "the last N bytes"
      start = Math.max(0, size - Number(match[2]));
    } else {
      start = Number(match[1]);
      if (match[2] !== "") end = Math.min(end, Number(match[2]));
    }
  }

  if (!match || (match[1] === "" && match[2] === "") || start > end || start >= size) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  return new Response(file.slice(start, end + 1), {
    status: 206,
    headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
  });
}

async function sendThumbnail(req: Request, row: MediaRow, requestedSize: number, cache: string): Promise<Response> {
  if (row.media_type !== "image") return Response.json({ code: "UNSUPPORTED", message: "no preview for this type" }, { status: 415 });

  try {
    const source = await locate(row);
    const stats = await fs.stat(source);
    const size = snapSize(requestedSize || 512);
    const etag = `"${row.version}-${stats.mtimeMs}-${size}"`;
    const headers = { "Cache-Control": cache, ETag: etag, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" };

    if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

    const output = await thumbnailFor({
      directory: thumbnailDirectory(row.owner_id),
      imageId: row.image_id,
      version: row.version,
      source,
      size,
      mtimeMs: stats.mtimeMs,
      bytes: stats.size,
    });

    return new Response(Bun.file(output), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch (error) {
    log.warning(`thumbnail failed for item ${row.image_id}`, error);
    return Response.json({ code: "UNSUPPORTED", message: "no preview for this file" }, { status: 415 });
  }
}

const OWNER_CACHE = "private, max-age=86400";
const SHARE_CACHE = "no-store";

// GET /api/uk.ewsgit.photos/media/:id/thumbnail?size=<pixels>&v=<version>
instance.sys.api.addRoute({
  method: "GET",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/media/:id/thumbnail` }),
  async handler(req, params) {
    const userId = await sessionUserId(req);
    if (userId === undefined) return unauthorized();

    const row = await findRow(userId, Number(params?.pathname.groups.id));
    if (!row) return notFound();

    return sendThumbnail(req, row, Number(new URL(req.url).searchParams.get("size")), OWNER_CACHE);
  },
});

// GET /api/uk.ewsgit.photos/media/:id/file[?download=1]
instance.sys.api.addRoute({
  method: "GET",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/media/:id/file` }),
  async handler(req, params) {
    const userId = await sessionUserId(req);
    if (userId === undefined) return unauthorized();

    const row = await findRow(userId, Number(params?.pathname.groups.id));
    if (!row) return notFound();

    try {
      return await sendFile(req, await locate(row), row, { download: new URL(req.url).searchParams.get("download") === "1", cache: OWNER_CACHE });
    } catch (error) {
      log.warning(`could not send item ${row.image_id}`, error);
      return notFound();
    }
  },
});

// GET /api/uk.ewsgit.photos/faces/:id/crop?size=<pixels> - the detected face, cut out of its photo
instance.sys.api.addRoute({
  method: "GET",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/faces/:id/crop` }),
  async handler(req, params) {
    const userId = await sessionUserId(req);
    if (userId === undefined) return unauthorized();

    const faceId = Number(params?.pathname.groups.id);
    if (!Number.isInteger(faceId) || faceId < 1 || !(await facialRecognitionFor(userId)).enabled) return notFound();

    const [face] = (await db`SELECT x, y, width, height, image_id FROM public.uk_ewsgit_photos_faces WHERE face_id = ${faceId} AND owner_id = ${userId}`) as { x: number; y: number; width: number; height: number; image_id: number }[];
    const row = face ? await findRow(userId, face.image_id) : undefined;

    if (!face || !row || row.deleted_at || row.media_type !== "image") return notFound();

    try {
      const size = Math.min(512, Math.max(32, Number(new URL(req.url).searchParams.get("size")) || 128));
      const source = await locate(row);
      const stats = await fs.stat(source);
      const etag = `"${row.version}-${stats.mtimeMs}-${faceId}-${size}"`;
      const headers = { "Cache-Control": "private, max-age=3600", ETag: etag, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" };

      if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

      // positions are in the photo as it is displayed, so the stored rotation is applied before cutting
      const oriented = await sharp(source, { failOn: "none" }).autoOrient().toBuffer({ resolveWithObject: true });
      const left = Math.max(0, Math.min(face.x, oriented.info.width - 1));
      const top = Math.max(0, Math.min(face.y, oriented.info.height - 1));
      const width = Math.max(1, Math.min(face.width, oriented.info.width - left));
      const height = Math.max(1, Math.min(face.height, oriented.info.height - top));

      const output = await sharp(oriented.data).extract({ left, top, width, height }).resize(size, size, { fit: "cover" }).webp({ quality: 80 }).toBuffer();

      return new Response(new Uint8Array(output), { headers: { ...headers, "Content-Type": "image/webp" } });
    } catch (error) {
      log.warning(`face crop failed for face ${faceId}`, error);
      return Response.json({ code: "UNSUPPORTED", message: "no preview for this face" }, { status: 415 });
    }
  },
});

// POST /api/uk.ewsgit.photos/upload?name=<file name>[&lastModified=<ms>] with the file as the request body
instance.sys.api.addRoute({
  method: "POST",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/upload` }),
  async handler(req) {
    const userId = await sessionUserId(req);
    if (userId === undefined) return unauthorized();

    const url = new URL(req.url);
    const name = path.basename(url.searchParams.get("name") ?? "");
    const kind = kindOf(name);
    const lastModified = Number(url.searchParams.get("lastModified"));

    if (name === "" || name.length > 255 || name.startsWith(".") || /[\\/\0]/.test(name)) {
      return Response.json({ code: "BAD_REQUEST", message: "That is not a valid file name" }, { status: 400 });
    }

    if (!kind) return Response.json({ code: "UNSUPPORTED", message: "Only JPEG, PNG, WebP, GIF and AVIF images and MP4, MOV and WebM videos can be added" }, { status: 415 });

    // a declared size that is too large is refused before any of it is written
    if (Number(req.headers.get("content-length") ?? 0) > (kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)) {
      return Response.json({ code: "TOO_LARGE", message: "That file is too large" }, { status: 413 });
    }

    const directory = uploadDirectory(userId);
    let destination: string | undefined;

    try {
      await fs.mkdir(directory, { recursive: true });

      destination = path.join(directory, await uniqueName(directory, name));
      await Bun.write(destination, new Response(req.body));

      const when = Number.isFinite(lastModified) && lastModified > 0 && lastModified < Date.now() + 86_400_000 ? new Date(lastModified) : undefined;
      if (when) await fs.utimes(destination, new Date(), when);

      const row = await indexFile(userId, path.relative(userRoot(userId), destination), when);

      log.info(`Uploaded '${row.path}' for user ${userId}`);

      return Response.json(toItem(row));
    } catch (error) {
      // a file that could not be read as an image must not be left behind as a stray file
      if (destination) await fs.rm(destination, { force: true });

      log.warning("upload failed", error);
      return Response.json({ code: "BAD_REQUEST", message: "That file could not be read as a photo or video" }, { status: 400 });
    }
  },
});

// ---------- public links ----------
// Reachable without signing in, so every failure looks the same and only the items of the shared album or photo are ever served.

const html = (body: string, status = 200) => new Response(body, { status, headers: PAGE_HEADERS });
const unavailable = () => html(renderUnavailablePage(), 404);

async function openShare(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return undefined;

  const [share] = (await db`SELECT s.owner_id, s.album_id, s.image_id, a.name AS album_name
    FROM public.uk_ewsgit_photos_shares s
    LEFT JOIN public.uk_ewsgit_photos_albums a ON a.album_id = s.album_id
    WHERE s.token = ${token}`) as { owner_id: number; album_id: number | null; image_id: number | null; album_name: string | null }[];

  if (!share) return undefined;

  const rows = (
    share.album_id === null
      ? await db`SELECT * FROM public.uk_ewsgit_photos_media WHERE image_id = ${share.image_id} AND owner_id = ${share.owner_id} AND deleted_at IS NULL`
      : await db`SELECT m.* FROM public.uk_ewsgit_photos_album_media am
          JOIN public.uk_ewsgit_photos_media m ON m.image_id = am.image_id
          WHERE am.album_id = ${share.album_id} AND m.owner_id = ${share.owner_id} AND m.deleted_at IS NULL
          ORDER BY m.timestamp DESC, m.image_id DESC`
  ) as MediaRow[];

  return { share, rows, title: share.album_id === null ? path.basename(rows[0]?.path ?? "Photo") : (share.album_name ?? "Album") };
}

const shareBase = (token: string) => `/api/${APPLICATION_ID}/s/${token}`;

instance.sys.api.addRoute({
  method: "GET",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/s/:token` }),
  async handler(_req, params) {
    const token = params?.pathname.groups.token ?? "";
    const found = await openShare(token).catch(() => undefined);

    if (!found || found.rows.length === 0) return unavailable();

    const items: SharedItem[] = found.rows.map((row) => ({
      id: row.image_id,
      kind: row.media_type,
      name: path.basename(row.path),
      width: row.width,
      height: row.height,
      version: row.version,
    }));

    return html(renderSharedItems(shareBase(token), found.title, items));
  },
});

for (const action of ["thumbnail", "file"] as const) {
  instance.sys.api.addRoute({
    method: "GET",
    pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/s/:token/:id/${action}` }),
    async handler(req, params) {
      const found = await openShare(params?.pathname.groups.token ?? "").catch(() => undefined);
      const row = found?.rows.find((candidate) => candidate.image_id === Number(params?.pathname.groups.id));

      if (!row) return unavailable();

      const query = new URL(req.url).searchParams;

      try {
        return action === "thumbnail"
          ? await sendThumbnail(req, row, Number(query.get("size")), SHARE_CACHE)
          : await sendFile(req, await locate(row), row, { download: query.get("download") === "1", cache: SHARE_CACHE });
      } catch (error) {
        log.warning(`could not send shared item ${row.image_id}`, error);
        return unavailable();
      }
    },
  });
}

// ---------- settings and background work ----------

instance.sys.event.on(WorkspacesEvent.BeforeStartupComplete, () => {
  instance.sys.settings.registerApplicationSetting(
    new GlobalBooleanApplicationSetting("uk.ewsgit.photos", "global_facial_recognition", false)
      .setDisplayName("Allow Facial Recognition")
      .setDescription(
        "Allow users of this instance to turn on facial recognition for their photos. While this is off, facial recognition does not run for anyone, whatever their own setting is.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting("uk.ewsgit.photos", "enable_facial_recognition", false)
      .setDisplayName("Enable Facial Recognition")
      .setDescription(
        "Allow the application to perform facial recognition on your photos. This will analyze your photos to detect faces and group them together.",
      ),
  );
  instance.sys.settings.registerApplicationSetting(
    new BooleanApplicationSetting("uk.ewsgit.photos", "facial_recognition_use_gpu", false)
      .setDisplayName("Enable GPU Acceleration for Facial Recognition")
      .setDescription(
        "Allow the application to use GPU acceleration for facial recognition. This can significantly speed up the process of analyzing photos, especially if you have a large collection. Note that this may increase resource usage on your device and requires a compatable GPU.",
      ),
  );
});

instance.sys.event.on(WorkspacesEvent.QuarterHourly, async () => {
  for (const user of await instance.sys.users.getAllUsers()) {
    try {
      await scanUser(user.userId);
    } catch (error) {
      log.error(`Scanning the photo library of user ${user.userId} failed`, error);
    }
  }

  // scan images left in queue
  const unprocessedImages = await db`SELECT image_id, path, owner_id, faces_detected, objects_detected
             FROM public.uk_ewsgit_photos_media
             WHERE (faces_detected = FALSE OR objects_detected = FALSE) AND deleted_at IS NULL`;

  const recognitionByUser = new Map<number, boolean>();

  for (const image of unprocessedImages) {
    if (!recognitionByUser.has(image.owner_id)) recognitionByUser.set(image.owner_id, (await facialRecognitionFor(image.owner_id)).enabled);

    // perform face detection, only for users who have it allowed and turned on; the rest stay queued for when they do
    if (!image.faces_detected && recognitionByUser.get(image.owner_id)) {
      const detectedFaces: {
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];

      // perform facial landmarking using MediaPipe.

      for (const face of detectedFaces) {
        await db`INSERT INTO public.uk_ewsgit_photos_faces (image_id, x, y, width, height, owner_id) VALUES (${image.image_id}, ${face.x}, ${face.y}, ${face.width}, ${face.height}, ${image.owner_id})`;
      }

      await db`UPDATE public.uk_ewsgit_photos_media SET faces_detected = TRUE WHERE image_id = ${image.image_id}`;
    }

    // perform object detection
    if (!image.objects_detected) {
      // const objects = await instance.sys.image.detectObjects(image.owner_id, image.path);
      // You may want to store objects in a separate table if needed
      // await db`UPDATE public.uk_ewsgit_photos_media SET objects_detected = TRUE WHERE image_id = ${image.image_id}`;
    }
  }
});

instance.sys.event.on(WorkspacesEvent.Daily, async () => {
  try {
    await cleanLibrary();
  } catch (error) {
    log.error("Photo library clean-up failed", error);
  }
});
