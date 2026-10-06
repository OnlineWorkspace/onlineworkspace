import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// the sizes a client may ask for, anything else is rounded up so the cache cannot be filled with arbitrary variants
export const THUMBNAIL_SIZES = [256, 512, 1024, 2048] as const;
export type ThumbnailSize = (typeof THUMBNAIL_SIZES)[number];

export const snapSize = (requested: number): ThumbnailSize => THUMBNAIL_SIZES.find((size) => size >= requested) ?? THUMBNAIL_SIZES[THUMBNAIL_SIZES.length - 1]!;

// decoding a huge image costs far more than it is worth for a preview
const MAX_SOURCE_BYTES = 256 * 1024 * 1024;
const MAX_CONCURRENT = 3;

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

/** Returns the path of a cached WebP preview whose longest edge is at most `size`, creating it when it is missing or older than the file. */
export async function thumbnailFor(options: { directory: string; imageId: number; version: number; source: string; size: ThumbnailSize; mtimeMs: number; bytes: number }): Promise<string> {
  const { directory, imageId, version, source, size, mtimeMs, bytes } = options;

  if (bytes > MAX_SOURCE_BYTES) throw new Error("too large to preview");

  // the id leads the name so that all previews of one item can be found again
  const output = path.join(directory, `${imageId}_${version}_${size}.webp`);

  const cached = await fs.stat(output).catch(() => undefined);
  if (cached && cached.mtimeMs >= mtimeMs) return output;

  const pending = inFlight.get(output);
  if (pending) return pending;

  const job = limited(async () => {
    await fs.mkdir(directory, { recursive: true });

    // written under another name first so that a reader never sees half a file
    const temporary = `${output}.${process.pid}.${Date.now()}.tmp`;

    await sharp(source, { failOn: "none" })
      .autoOrient()
      .resize(size, size, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(temporary);

    await fs.rename(temporary, output);

    return output;
  }).finally(() => inFlight.delete(output));

  inFlight.set(output, job);

  return job;
}
