import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "./db.ts";
import { describeCamera, describeExposure, parseExif } from "./exif.ts";

export const APPLICATION_ID = "uk.ewsgit.photos";

const log = instance.log.createLogger(APPLICATION_ID);

// only what every browser can show without conversion, the viewer serves the original file
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "m4v", "mov", "webm"]);

export const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export type MediaKind = "image" | "video";

export const MAX_IMAGE_BYTES = 256 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 8 * 1024 * 1024 * 1024;
export const TRASH_RETENTION_DAYS = 30;

// bump when indexing starts to record more, older rows are then read again
const META_VERSION = 1;
const BACKFILL_LIMIT = 500;

export const extensionOf = (name: string) => path.extname(name).slice(1).toLowerCase();

export const kindOf = (name: string): MediaKind | undefined => {
  const extension = extensionOf(name);

  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  return undefined;
};

const SCREENSHOT = /(^|[/_ .-])(screen[ _-]?(shot|capture|grab|recording)|screenshots?\/)/i;

export const userRoot = (userId: number) => path.join(instance.sys.filesystem.getUserHomeDirectory(userId), "fs");
export const trashDirectory = (userId: number) => path.join(instance.sys.filesystem.getUserHomeDirectory(userId), "photos_trash");
export const thumbnailDirectory = (userId: number) => path.join(instance.sys.filesystem.getUserHomeDirectory(userId), "system", "photos", "thumbnails");
export const uploadDirectory = (userId: number) => path.join(userRoot(userId), "Photos");

export interface MediaRow {
  image_id: number;
  width: number;
  height: number;
  path: string;
  timestamp: Date;
  location: string | null;
  owner_id: number;
  media_type: MediaKind;
  size_bytes: string | number;
  favorite: boolean;
  archived: boolean;
  is_screenshot: boolean;
  description: string | null;
  camera: string | null;
  exposure: string | null;
  deleted_at: Date | null;
  version: number;
  meta_version: number;
}

/** A file name that does not exist yet in `directory`: "a.jpg" becomes "a (1).jpg", "a (2).jpg", ... */
export async function uniqueName(directory: string, name: string): Promise<string> {
  const extension = path.extname(name);
  const stem = path.basename(name, extension);

  for (let attempt = 0; attempt < 10_000; attempt++) {
    const candidate = attempt === 0 ? name : `${stem} (${attempt})${extension}`;
    if (!existsSync(path.join(directory, candidate))) return candidate;
  }

  throw new Error("could not find a free file name");
}

/** Whether `child` is `parent` itself or lies inside it. */
const isInside = (parent: string, child: string) => child === parent || child.startsWith(parent + path.sep);

/**
 * Where a row's file lives right now. Throws when it would be outside of the user's own storage,
 * which also refuses symlinks that were swapped in to point somewhere else.
 */
export async function locate(row: Pick<MediaRow, "image_id" | "path" | "owner_id" | "deleted_at">): Promise<string> {
  const root = row.deleted_at ? trashDirectory(row.owner_id) : userRoot(row.owner_id);
  const absolute = row.deleted_at ? path.join(root, `${row.image_id}.${extensionOf(row.path)}`) : path.resolve(root, row.path);

  if (!isInside(root, absolute)) throw new Error("path escapes the user's storage");

  const [real, realRoot] = await Promise.all([fs.realpath(absolute), fs.realpath(root)]);

  if (!isInside(realRoot, real)) throw new Error("path escapes the user's storage");

  return real;
}

export interface FileFacts {
  width: number;
  height: number;
  takenAt: Date;
  camera: string | null;
  exposure: string | null;
}

/** Reads dimensions (as displayed, so with the EXIF rotation applied) and camera details from an image. */
export async function readImageFacts(absolute: string, fallbackDate: Date): Promise<FileFacts> {
  const metadata = await sharp(absolute, { failOn: "none" }).metadata();
  const exif = metadata.exif ? parseExif(metadata.exif) : {};
  const orientation = metadata.orientation ?? exif.orientation ?? 1;

  let width = metadata.width ?? 0;
  let height = metadata.height ?? 0;
  if (orientation >= 5) [width, height] = [height, width];

  if (width < 1 || height < 1) throw new Error("not a readable image");

  return {
    width,
    height,
    takenAt: exif.takenAt ?? fallbackDate,
    camera: describeCamera(exif) ?? null,
    exposure: describeExposure(exif) ?? null,
  };
}

async function readFacts(absolute: string, kind: MediaKind, fallbackDate: Date): Promise<FileFacts> {
  // without a video decoder on the server only the file's own date and size are known
  if (kind === "video") return { width: 0, height: 0, takenAt: fallbackDate, camera: null, exposure: null };

  return readImageFacts(absolute, fallbackDate);
}

/** Adds a file that lives in the user's storage to the library. Returns the new row. */
export async function indexFile(userId: number, relative: string, fallbackDate?: Date): Promise<MediaRow> {
  const absolute = path.resolve(userRoot(userId), relative);
  const kind = kindOf(relative);

  if (!kind || !isInside(userRoot(userId), absolute)) throw new Error("not a supported media file");

  const stats = await fs.stat(absolute);
  const facts = await readFacts(absolute, kind, fallbackDate ?? stats.mtime);
  const screenshot = kind === "image" && SCREENSHOT.test(relative);

  const rows = await db`INSERT INTO public.uk_ewsgit_photos_media
      (width, height, path, timestamp, owner_id, media_type, size_bytes, is_screenshot, camera, exposure, meta_version)
    VALUES (${facts.width}, ${facts.height}, ${relative}, ${facts.takenAt}, ${userId}, ${kind}, ${stats.size}, ${screenshot}, ${facts.camera}, ${facts.exposure}, ${META_VERSION})
    RETURNING *`;

  return rows[0] as MediaRow;
}

const hasHiddenSegment = (relative: string) => relative.split(path.sep).some((segment) => segment.startsWith("."));

export interface ScanResult {
  added: number;
  failed: number;
}

const scans = new Map<number, Promise<ScanResult>>();

/** Looks for media that is not in the library yet. A scan that is already running is shared rather than started twice. */
export function scanUser(userId: number): Promise<ScanResult> {
  const running = scans.get(userId);
  if (running) return running;

  const scan = runScan(userId).finally(() => scans.delete(userId));
  scans.set(userId, scan);

  return scan;
}

async function runScan(userId: number): Promise<ScanResult> {
  const root = userRoot(userId);
  const result: ScanResult = { added: 0, failed: 0 };

  if (!existsSync(root)) return result;

  const entries = await fs.readdir(root, { recursive: true, withFileTypes: true }).catch(() => []);
  const known = new Set((await db`SELECT path FROM public.uk_ewsgit_photos_media WHERE owner_id = ${userId}`).map((row: { path: string }) => row.path));

  for (const entry of entries) {
    // symlinks are not followed, a link must not be a way to read files from outside of the user's storage
    if (!entry.isFile() || !kindOf(entry.name)) continue;

    const relative = path.relative(root, path.join(entry.parentPath, entry.name));

    if (known.has(relative) || hasHiddenSegment(relative)) continue;

    try {
      await indexFile(userId, relative);
      result.added += 1;
    } catch (error) {
      result.failed += 1;
      log.warning(`Could not add '${relative}' to the photo library of user ${userId}`, error);
    }
  }

  await backfill(userId);

  if (result.added > 0) log.info(`Added ${result.added} item${result.added === 1 ? "" : "s"} to the photo library of user ${userId}`);

  return result;
}

/** Fills in what newer versions record for rows that an older version added. */
async function backfill(userId: number) {
  const stale = (await db`SELECT * FROM public.uk_ewsgit_photos_media
    WHERE owner_id = ${userId} AND meta_version < ${META_VERSION} AND deleted_at IS NULL
    LIMIT ${BACKFILL_LIMIT}`) as MediaRow[];

  for (const row of stale) {
    try {
      const absolute = await locate(row);
      const kind = kindOf(row.path) ?? "image";
      const stats = await fs.stat(absolute);
      const facts = await readFacts(absolute, kind, stats.mtime);
      const screenshot = kind === "image" && SCREENSHOT.test(row.path);

      await db`UPDATE public.uk_ewsgit_photos_media SET
          width = ${facts.width}, height = ${facts.height}, timestamp = ${facts.takenAt}, media_type = ${kind},
          size_bytes = ${stats.size}, is_screenshot = ${screenshot}, camera = ${facts.camera}, exposure = ${facts.exposure},
          meta_version = ${META_VERSION}
        WHERE image_id = ${row.image_id}`;
    } catch {
      // the file is gone or unreadable, the daily clean-up removes rows like that, until then it is left alone
      await db`UPDATE public.uk_ewsgit_photos_media SET meta_version = ${META_VERSION} WHERE image_id = ${row.image_id}`;
    }
  }
}

/** Removes cached previews of an item, they are rebuilt on demand. */
export async function dropThumbnails(userId: number, imageId: number) {
  const directory = thumbnailDirectory(userId);
  const names = await fs.readdir(directory).catch(() => [] as string[]);

  await Promise.all(names.filter((name) => name.startsWith(`${imageId}_`)).map((name) => fs.rm(path.join(directory, name), { force: true })));
}

/** Forgets items for good: their rows, their files (when they are in the trash) and everything that points at them. */
export async function purgeMedia(userId: number, rows: Pick<MediaRow, "image_id" | "path" | "owner_id" | "deleted_at">[]) {
  for (const row of rows) {
    if (row.deleted_at) await fs.rm(path.join(trashDirectory(userId), `${row.image_id}.${extensionOf(row.path)}`), { force: true });

    await dropThumbnails(userId, row.image_id);

    await db.begin(async (transaction) => {
      await transaction`UPDATE public.uk_ewsgit_photos_albums SET cover_image_id = NULL WHERE cover_image_id = ${row.image_id}`;
      await transaction`UPDATE public.uk_ewsgit_photos_face_clusters SET representative_face_id = NULL
        WHERE representative_face_id IN (SELECT face_id FROM public.uk_ewsgit_photos_faces WHERE image_id = ${row.image_id})`;
      await transaction`DELETE FROM public.uk_ewsgit_photos_faces WHERE image_id = ${row.image_id}`;
      await transaction`DELETE FROM public.uk_ewsgit_photos_media WHERE image_id = ${row.image_id} AND owner_id = ${userId}`;
    });
  }
}

/** Daily clean-up: empties trash that is past its retention and drops rows whose file was deleted outside of Photos. */
export async function cleanLibrary() {
  const expired = (await db`SELECT * FROM public.uk_ewsgit_photos_media
    WHERE deleted_at IS NOT NULL AND deleted_at < now() - ${`${TRASH_RETENTION_DAYS} days`}::interval`) as MediaRow[];

  for (const row of expired) await purgeMedia(row.owner_id, [row]);

  const live = (await db`SELECT * FROM public.uk_ewsgit_photos_media WHERE deleted_at IS NULL`) as MediaRow[];
  const missing: MediaRow[] = [];

  for (const row of live) {
    // a storage root that is not there at all (an unmounted disk, say) must never look like "everything was deleted"
    if (existsSync(userRoot(row.owner_id)) && !existsSync(path.resolve(userRoot(row.owner_id), row.path))) missing.push(row);
  }

  for (const row of missing) await purgeMedia(row.owner_id, [row]);

  if (expired.length + missing.length > 0) log.info(`Photo library clean-up removed ${expired.length} expired and ${missing.length} missing items`);
}
