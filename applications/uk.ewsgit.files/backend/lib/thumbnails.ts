import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { extensionOf } from "./fileTypes.ts";

// formats the image decoder handles; svg is left out on purpose, it can carry scripts and external references
const SUPPORTED = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);

// the sizes a client may ask for, anything else is rounded up so the cache cannot be filled with arbitrary variants
export const THUMBNAIL_SIZES = [96, 192, 384, 768] as const;
export type ThumbnailSize = (typeof THUMBNAIL_SIZES)[number];

// decoding a huge image costs far more than it is worth for a preview
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_CONCURRENT = 3;

export const canThumbnail = (name: string) => SUPPORTED.has(extensionOf(name));

export const snapSize = (requested: number): ThumbnailSize => THUMBNAIL_SIZES.find((size) => size >= requested) ?? THUMBNAIL_SIZES[THUMBNAIL_SIZES.length - 1]!;

let running = 0;
const waiting: (() => void)[] = [];

async function limited<T>(work: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));

  running += 1;

  try {
    return await work();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

const inFlight = new Map<string, Promise<string>>();

/**
 * Returns the path of a cached WebP thumbnail for `source`, creating it when it is missing or older than the file.
 * `virtualPath` only names the cache entry, it is never used to read anything.
 */
export async function thumbnailFor(options: { cacheDirectory: string; source: string; virtualPath: string; size: ThumbnailSize; mtimeMs: number; bytes: number }): Promise<string> {
  const { cacheDirectory, source, virtualPath, size, mtimeMs, bytes } = options;

  if (bytes > MAX_SOURCE_BYTES) throw new Error("too large to preview");

  const key = createHash("sha256").update(`${virtualPath}\0${size}`).digest("hex");
  const output = path.join(cacheDirectory, `${key}.webp`);

  const cached = await fs.stat(output).catch(() => undefined);
  if (cached && cached.mtimeMs >= mtimeMs) return output;

  const pending = inFlight.get(output);
  if (pending) return pending;

  const job = limited(async () => {
    await fs.mkdir(cacheDirectory, { recursive: true });

    const image = new Bun.Image(source);
    image.resize(size, size, { withoutEnlargement: true, fit: "inside" });
    image.webp();

    // written under another name first so that a reader never sees half a file
    const temporary = `${output}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporary, await image.bytes());
    await fs.rename(temporary, output);

    return output;
  }).finally(() => inFlight.delete(output));

  inFlight.set(output, job);

  return job;
}
