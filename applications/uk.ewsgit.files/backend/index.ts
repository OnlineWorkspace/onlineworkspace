/// <reference path="./global.d.ts" />

import fs from "node:fs/promises";
import path from "node:path";
import { QuotaExceededError } from "@onlineworkspace/workspace-backend/src/systems/filesystem.ts";
import { getCookies } from "@onlineworkspace/workspace-backend/src/utils/cookies.ts";
import { type createOnlineWorkspaceTRPCContext, procedure } from "@onlineworkspace/workspace-backend/src/systems/trpc/coreRouter.ts";
import { initTRPC, TRPCError } from "@trpc/server";
import z from "zod";
import { describeFileType, type FileGroup, groupOf } from "./lib/fileTypes.ts";
import ShareStore, { isExpired, parseToken, passwordAttempts, verifyPassword } from "./lib/shares.ts";
import { attachment, PAGE_HEADERS, renderBlockedPage, renderSharePage, renderUnavailablePage } from "./lib/sharePage.ts";
import { canThumbnail, snapSize, thumbnailFor } from "./lib/thumbnails.ts";
import UserData from "./lib/userData.ts";
import UserFilesystem, { type FileEntry } from "./lib/userFilesystem.ts";

const APPLICATION_ID = "uk.ewsgit.files";
const log = instance.log.createLogger(APPLICATION_ID);

export const t = initTRPC.context<ReturnType<typeof createOnlineWorkspaceTRPCContext>>().create();

export type ListedEntry = FileEntry & { starred: boolean };

const RECENT_LIMIT = 40;
const SEARCH_LIMIT = 100;
const GROUP_LIMIT = 500;
const STORAGE_CACHE_MS = 60_000;
// recent files only need a bounded look, a stat per visited file is the expensive part
const RECENT_WALK_LIMIT = 20_000;

const PLACES = [
  { id: "home", label: "Home", icon: "home", path: "/" },
  { id: "documents", label: "Documents", icon: "description", path: "/Documents" },
  { id: "downloads", label: "Downloads", icon: "download", path: "/Downloads" },
  { id: "photos", label: "Photos", icon: "image", path: "/Photos" },
  { id: "music", label: "Music", icon: "music_note", path: "/Music" },
] as const;

const pathInput = z.string().min(1).max(4096);
const pathsInput = pathInput.array().min(1).max(500);

async function userContext(user: () => Promise<{ getPath(): string }>) {
  const userDirectory = (await user()).getPath();
  const files = new UserFilesystem(userDirectory);
  await files.ensureRoot();

  return { files, directory: userDirectory, data: new UserData(userDirectory, files), shares: new ShareStore(userDirectory, files) };
}

const markStarred = (entries: FileEntry[], starred: string[]): ListedEntry[] => {
  const set = new Set(starred);
  return entries.map((entry) => ({ ...entry, starred: set.has(entry.path) }));
};

const storageCache = new Map<string, { at: number; value: Awaited<ReturnType<typeof measureStorage>> }>();

async function measureStorage(files: UserFilesystem) {
  const bytes = { images: 0, videos: 0, documents: 0, other: 0 };

  for await (const { absolute, dirent } of files.walk()) {
    if (!dirent.isFile()) continue;

    const size = (await fs.stat(absolute).catch(() => undefined))?.size ?? 0;
    const group = groupOf(describeFileType(dirent.name).category);
    bytes[group === "images" || group === "videos" || group === "documents" ? group : "other"] += size;
  }

  return { images: bytes.images, videos: bytes.videos, documents: bytes.documents, other: bytes.other };
}

const router = t.router({
  places: procedure.query(async (opt) => {
    const { files } = await userContext(opt.ctx.user);

    // only offer the well-known folders the user actually has
    const places = await Promise.all(PLACES.map(async (place) => ((await files.exists(files.resolve(place.path))) ? place : undefined)));

    return places.filter((place) => place !== undefined);
  }),

  list: procedure.input(z.object({ path: pathInput })).query(async (opt) => {
    const { files, data } = await userContext(opt.ctx.user);
    const virtualPath = files.normalise(opt.input.path);
    const entries = await files.readDirectory(files.resolve(virtualPath));

    const segments = virtualPath.split("/").filter(Boolean);

    return {
      path: virtualPath,
      breadcrumbs: [
        { name: "Home", path: "/" },
        ...segments.map((name, index) => ({ name, path: `/${segments.slice(0, index + 1).join("/")}` })),
      ],
      entries: markStarred(entries, await data.starred()),
    };
  }),

  stat: procedure.input(z.object({ path: pathInput })).query(async (opt) => {
    const { files, data } = await userContext(opt.ctx.user);
    const absolute = files.resolve(opt.input.path);

    if (!(await files.exists(absolute))) throw new TRPCError({ code: "NOT_FOUND", message: "That item does not exist" });

    return markStarred([await files.entryFor(absolute)], await data.starred())[0]!;
  }),

  search: procedure.input(z.object({ query: z.string().trim().min(1).max(256), path: pathInput.default("/") })).query(async (opt) => {
    const { files, data } = await userContext(opt.ctx.user);
    const needle = opt.input.query.toLowerCase();
    const results: FileEntry[] = [];

    for await (const { absolute, dirent } of files.walk(files.resolve(opt.input.path))) {
      if (!dirent.name.toLowerCase().includes(needle)) continue;

      const entry = await files.entryFor(absolute).catch(() => undefined);
      if (entry) results.push(entry);
      if (results.length >= SEARCH_LIMIT) break;
    }

    return markStarred(results, await data.starred());
  }),

  recent: procedure.query(async (opt) => {
    const { files, data } = await userContext(opt.ctx.user);
    const found: { absolute: string; modified: number }[] = [];

    for await (const { absolute, dirent } of files.walk(files.root, RECENT_WALK_LIMIT)) {
      if (!dirent.isFile()) continue;

      const stats = await fs.stat(absolute).catch(() => undefined);
      if (stats) found.push({ absolute, modified: stats.mtimeMs });
    }

    found.sort((a, b) => b.modified - a.modified);

    const entries = await Promise.all(found.slice(0, RECENT_LIMIT).map((f) => files.entryFor(f.absolute)));

    return markStarred(entries, await data.starred());
  }),

  group: procedure.input(z.object({ group: z.enum(["images", "videos", "audio", "documents"]) satisfies z.ZodType<FileGroup> })).query(async (opt) => {
    const { files, data } = await userContext(opt.ctx.user);
    const found: { absolute: string; modified: number }[] = [];

    for await (const { absolute, dirent } of files.walk()) {
      if (!dirent.isFile() || groupOf(describeFileType(dirent.name).category) !== opt.input.group) continue;

      const stats = await fs.stat(absolute).catch(() => undefined);
      if (stats) found.push({ absolute, modified: stats.mtimeMs });
    }

    found.sort((a, b) => b.modified - a.modified);

    const entries = await Promise.all(found.slice(0, GROUP_LIMIT).map((f) => files.entryFor(f.absolute)));

    return markStarred(entries, await data.starred());
  }),

  starred: {
    list: procedure.query(async (opt) => {
      const { files, data } = await userContext(opt.ctx.user);
      const entries: FileEntry[] = [];
      const stale: string[] = [];

      for (const starred of await data.starred()) {
        const absolute = files.resolve(starred);

        if (await files.exists(absolute)) entries.push(await files.entryFor(absolute));
        else stale.push(starred);
      }

      // forget stars whose item was removed outside of this app
      for (const missing of stale) await data.setStarred(missing, false);

      return markStarred(entries, await data.starred());
    }),
    set: procedure.input(z.object({ paths: pathsInput, starred: z.boolean() })).mutation(async (opt) => {
      const { files, data } = await userContext(opt.ctx.user);

      for (const virtualPath of opt.input.paths) {
        files.resolve(virtualPath);
        await data.setStarred(virtualPath, opt.input.starred);
      }

      return true;
    }),
  },

  storage: procedure.query(async (opt) => {
    const user = await opt.ctx.user();
    const { files } = await userContext(opt.ctx.user);

    const cached = storageCache.get(files.root);
    const breakdown = cached && Date.now() - cached.at < STORAGE_CACHE_MS ? cached.value : await measureStorage(files);
    storageCache.set(files.root, { at: Date.now(), value: breakdown });

    const quota = Number((await user.getQuota().catch(() => undefined)) ?? 0);
    const disk = await fs.statfs(files.root).catch(() => undefined);
    const used = breakdown.images + breakdown.videos + breakdown.documents + breakdown.other;

    return {
      ...breakdown,
      used,
      total: quota > 0 ? quota : disk ? Number(disk.blocks) * Number(disk.bsize) : used,
    };
  }),

  fileUrl: procedure.input(z.object({ path: pathInput })).query(async (opt) => {
    const { files } = await userContext(opt.ctx.user);
    const absolute = files.resolve(opt.input.path);

    if (!(await fs.stat(absolute).catch(() => undefined))?.isFile()) throw new TRPCError({ code: "NOT_FOUND", message: "That file does not exist" });

    return instance.sys.filesystem.serveFile(opt.ctx.userId, absolute);
  }),

  shares: {
    list: procedure.input(z.object({ path: pathInput.optional() })).query(async (opt) => {
      const { shares } = await userContext(opt.ctx.user);
      return shares.list(opt.input.path);
    }),
    create: procedure
      .input(z.object({ path: pathInput, expiresInDays: z.union([z.literal(1), z.literal(7), z.literal(30), z.null()]), password: z.string().min(4).max(128).optional() }))
      .mutation(async (opt) => {
        const { files, shares } = await userContext(opt.ctx.user);
        const { absolute } = await files.resolveFile(opt.input.path);

        const { share, secret } = await shares.create({
          path: files.normalise(opt.input.path),
          name: path.basename(absolute),
          expiresAt: opt.input.expiresInDays === null ? null : Date.now() + opt.input.expiresInDays * 86_400_000,
          password: opt.input.password,
        });

        log.info(`User ${opt.ctx.userId} shared '${share.path}'${share.hasPassword ? " (password protected)" : ""}`);

        // the secret is only ever returned here, the link cannot be shown again
        return { share, link: `/api/${APPLICATION_ID}/share/${opt.ctx.userId}.${secret}` };
      }),
    revoke: procedure.input(z.object({ id: z.string().uuid() })).mutation(async (opt) => {
      const { shares } = await userContext(opt.ctx.user);

      if (!(await shares.revoke(opt.input.id))) throw new TRPCError({ code: "NOT_FOUND", message: "That link no longer exists" });

      return true;
    }),
  },

  createFolder: procedure.input(z.object({ path: pathInput, name: z.string() })).mutation(async (opt) => {
    const { files } = await userContext(opt.ctx.user);
    files.assertValidName(opt.input.name);

    const parent = files.resolve(opt.input.path);
    const name = await files.uniqueName(parent, opt.input.name);
    await fs.mkdir(path.join(parent, name));

    return files.entryFor(path.join(parent, name));
  }),

  createFile: procedure.input(z.object({ path: pathInput, name: z.string() })).mutation(async (opt) => {
    const { files } = await userContext(opt.ctx.user);
    files.assertValidName(opt.input.name);

    const parent = files.resolve(opt.input.path);
    const name = await files.uniqueName(parent, opt.input.name);
    await fs.writeFile(path.join(parent, name), "", { flag: "wx" });

    return files.entryFor(path.join(parent, name));
  }),

  rename: procedure.input(z.object({ path: pathInput, name: z.string() })).mutation(async (opt) => {
    const { files, data, shares } = await userContext(opt.ctx.user);
    files.assertValidName(opt.input.name);

    const source = files.resolve(opt.input.path);
    if (source === files.root) throw new TRPCError({ code: "BAD_REQUEST", message: "Your home folder cannot be renamed" });

    const destination = path.join(path.dirname(source), opt.input.name);
    if (destination !== source && (await files.exists(destination))) {
      throw new TRPCError({ code: "CONFLICT", message: `"${opt.input.name}" already exists here` });
    }

    await fs.rename(source, destination);
    await data.remapStarred(files.toVirtual(source), files.toVirtual(destination));
    await shares.remap(files.toVirtual(source), files.toVirtual(destination));

    return files.entryFor(destination);
  }),

  move: procedure.input(z.object({ paths: pathsInput, destination: pathInput })).mutation(async (opt) => {
    const { files, data, shares } = await userContext(opt.ctx.user);
    const destinationDirectory = await requireDirectory(files, opt.input.destination);

    for (const virtualPath of opt.input.paths) {
      const source = files.resolve(virtualPath);
      assertNotIntoItself(source, destinationDirectory);
      if (source === files.root) throw new TRPCError({ code: "BAD_REQUEST", message: "Your home folder cannot be moved" });
      if (path.dirname(source) === destinationDirectory) continue;

      const destination = path.join(destinationDirectory, await files.uniqueName(destinationDirectory, path.basename(source)));
      await files.movePath(source, destination);
      await data.remapStarred(files.toVirtual(source), files.toVirtual(destination));
      await shares.remap(files.toVirtual(source), files.toVirtual(destination));
    }

    return true;
  }),

  copy: procedure.input(z.object({ paths: pathsInput, destination: pathInput })).mutation(async (opt) => {
    const { files } = await userContext(opt.ctx.user);
    const destinationDirectory = await requireDirectory(files, opt.input.destination);

    for (const virtualPath of opt.input.paths) {
      const source = files.resolve(virtualPath);
      assertNotIntoItself(source, destinationDirectory);

      // a copy takes up the same space again
      await instance.sys.filesystem.assertWithinQuota(opt.ctx.userId, await instance.sys.filesystem.measurePath(source)).catch((error) => {
        if (error instanceof QuotaExceededError) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "There is not enough space left in your storage quota to copy that" });
        throw error;
      });

      const destination = path.join(destinationDirectory, await files.uniqueName(destinationDirectory, path.basename(source)));
      await fs.cp(source, destination, { recursive: true, errorOnExist: true, force: false });
      instance.sys.filesystem.forgetStorageUsed(opt.ctx.userId);
    }

    return true;
  }),

  delete: procedure.input(z.object({ paths: pathsInput })).mutation(async (opt) => {
    const { data, shares } = await userContext(opt.ctx.user);

    for (const virtualPath of opt.input.paths) {
      await data.moveToTrash(virtualPath);
      // a file in the trash must not stay reachable through a link, restoring it does not bring the link back
      await shares.remap(virtualPath, undefined);
    }

    return true;
  }),

  trash: {
    list: procedure.query(async (opt) => {
      const { data } = await userContext(opt.ctx.user);
      return (await data.trash()).map((record) => ({ ...record, ...(record.kind === "file" ? describeFileType(record.name) : { extension: "", category: "directory" as const, label: "Folder" }) }));
    }),
    restore: procedure.input(z.object({ ids: z.string().array().min(1) })).mutation(async (opt) => {
      const { data } = await userContext(opt.ctx.user);

      for (const id of opt.input.ids) await data.restore(id);

      return true;
    }),
    deletePermanently: procedure.input(z.object({ ids: z.string().array().min(1) })).mutation(async (opt) => {
      const { data } = await userContext(opt.ctx.user);

      for (const id of opt.input.ids) await data.deletePermanently(id);

      return true;
    }),
    empty: procedure.mutation(async (opt) => {
      const { data } = await userContext(opt.ctx.user);
      await data.emptyTrash();
      return true;
    }),
  },
});

async function requireDirectory(files: UserFilesystem, virtualPath: string): Promise<string> {
  const absolute = files.resolve(virtualPath);

  if (!(await fs.stat(absolute).catch(() => undefined))?.isDirectory()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The destination is not a folder" });
  }

  return absolute;
}

function assertNotIntoItself(source: string, destinationDirectory: string) {
  if (destinationDirectory === source || destinationDirectory.startsWith(source + path.sep)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${path.basename(source)} cannot be put inside of itself` });
  }
}

export type TRPCRouter = typeof router;

instance.sys.tRPC.registerTRPCRouter(router, `/api/app/${APPLICATION_ID}`);

// Uploads are streamed straight to disk, which tRPC's JSON transport cannot do.
// POST /api/uk.ewsgit.files/upload?path=<directory>&name=<file name>[&lastModified=<ms>] with the file as the request body
instance.sys.api.addRoute({
  method: "POST",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/upload` }),
  async handler(req) {
    const authorization = getCookies(req.headers).Authorization;
    const userId = authorization ? await instance.sys.authorization.verifySession(decodeURIComponent(authorization)) : undefined;

    if (userId === undefined) return Response.json({ code: "UNAUTHORIZED", message: "invalid session" }, { status: 401 });

    const url = new URL(req.url);
    const name = url.searchParams.get("name") ?? "";
    const lastModified = Number(url.searchParams.get("lastModified"));
    let uploaded: string | undefined;

    try {
      const user = await instance.sys.users.getUserById(userId);
      if (!user) return Response.json({ code: "UNAUTHORIZED", message: "invalid session" }, { status: 401 });

      const { files } = await userContext(async () => user);
      files.assertValidName(name);

      const directory = await requireDirectory(files, url.searchParams.get("path") ?? "/");
      const destination = path.join(directory, await files.uniqueName(directory, name));

      uploaded = destination;
      await Bun.write(destination, new Response(await instance.sys.filesystem.quotaLimitedBody(userId, req)));
      instance.sys.filesystem.forgetStorageUsed(userId);

      if (Number.isFinite(lastModified) && lastModified > 0) await fs.utimes(destination, new Date(), new Date(lastModified));

      log.info(`Uploaded '${files.toVirtual(destination)}' for user ${userId}`);

      return Response.json(await files.entryFor(destination));
    } catch (error) {
      // what was written before it failed is not a file
      if (uploaded) await fs.rm(uploaded, { force: true });

      if (error instanceof QuotaExceededError || (error as Error)?.cause instanceof QuotaExceededError) {
        return Response.json({ code: "QUOTA_EXCEEDED", message: "There is not enough space left in your storage quota for that file" }, { status: 413 });
      }

      if (error instanceof TRPCError) {
        return Response.json({ code: error.code, message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 400 });
      }

      log.error("upload failed", error);
      return Response.json({ code: "INTERNAL_SERVER_ERROR", message: "The upload failed" }, { status: 500 });
    }
  },
});

const statusFor = (error: TRPCError) => (error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400);

async function sessionUser(req: Request) {
  const authorization = getCookies(req.headers).Authorization;
  const userId = authorization ? await instance.sys.authorization.verifySession(decodeURIComponent(authorization)) : undefined;

  return userId === undefined ? undefined : instance.sys.users.getUserById(userId);
}

// Thumbnails are generated once per file version and cached next to the user's data.
// GET /api/uk.ewsgit.files/thumbnail?path=<file>&size=<pixels>
instance.sys.api.addRoute({
  method: "GET",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/thumbnail` }),
  async handler(req) {
    const user = await sessionUser(req);
    if (!user) return Response.json({ code: "UNAUTHORIZED", message: "invalid session" }, { status: 401 });

    const url = new URL(req.url);
    const virtualPath = url.searchParams.get("path") ?? "";

    if (virtualPath === "" || virtualPath.length > 4096) return Response.json({ code: "BAD_REQUEST", message: "invalid path" }, { status: 400 });

    try {
      const { files, directory } = await userContext(async () => user);
      const { absolute, stats } = await files.resolveFile(virtualPath);

      if (!canThumbnail(absolute)) return Response.json({ code: "UNSUPPORTED", message: "no preview for this type" }, { status: 415 });

      const size = snapSize(Number(url.searchParams.get("size")) || 192);
      const etag = `"${stats.mtimeMs}-${stats.size}-${size}"`;
      const headers = {
        "Cache-Control": "private, max-age=86400",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      };

      if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

      const output = await thumbnailFor({
        cacheDirectory: path.join(directory, "system", "thumbnails"),
        source: absolute,
        virtualPath: files.normalise(virtualPath),
        size,
        mtimeMs: stats.mtimeMs,
        bytes: stats.size,
      });

      return new Response(Bun.file(output), { headers: { ...headers, "Content-Type": "image/webp" } });
    } catch (error) {
      if (error instanceof TRPCError) return Response.json({ code: error.code, message: error.message }, { status: statusFor(error) });

      log.warning(`thumbnail failed for '${virtualPath}'`, error);
      return Response.json({ code: "UNSUPPORTED", message: "no preview for this file" }, { status: 415 });
    }
  },
});

// ---- public share links ----
// These are reachable without signing in, so everything below treats the request as hostile:
// the secret is checked against a hash, every failure looks identical, files are always sent as downloads and never rendered by the browser.

const html = (body: string, status = 200) => new Response(body, { status, headers: PAGE_HEADERS });
const unavailable = () => html(renderUnavailablePage(), 404);
const MAX_FORM_BYTES = 4096;

/** Reads a request body, giving up (undefined) as soon as it is bigger than `limit` bytes. */
async function readLimited(req: Request, limit: number): Promise<string | undefined> {
  if (!req.body || Number(req.headers.get("content-length") ?? 0) > limit) return undefined;

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > limit) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function openShare(token: string) {
  const parsed = parseToken(token);
  if (!parsed) return undefined;

  const user = await instance.sys.users.getUserById(parsed.userId).catch(() => undefined);
  if (!user) return undefined;

  const { files, shares } = await userContext(async () => user);
  const share = await shares.find(parsed.secret);
  if (!share || isExpired(share)) return undefined;

  const file = await files.resolveFile(share.path).catch(() => undefined);
  if (!file) return undefined;

  return { share, shares, absolute: file.absolute, size: file.stats.size, attemptKey: `${parsed.userId}:${share.id}` };
}

type OpenShare = NonNullable<Awaited<ReturnType<typeof openShare>>>;

const sharePageFor = (token: string, found: OpenShare, error?: string) =>
  renderSharePage({ name: found.share.name, size: found.size, expiresAt: found.share.expiresAt, needsPassword: found.share.passwordHash !== undefined, downloadUrl: `/api/${APPLICATION_ID}/share/${token}/download`, error });

function sendShared(found: OpenShare) {
  found.shares.countDownload(found.share.id).catch(() => undefined);

  return new Response(Bun.file(found.absolute), {
    headers: {
      // never the real type: a shared .html must download, not run on this origin
      "Content-Type": "application/octet-stream",
      "Content-Disposition": attachment(found.share.name),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

instance.sys.api.addRoute({
  method: "GET",
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/share/:token` }),
  async handler(_req, params) {
    const token = params?.pathname.groups.token ?? "";
    const found = await openShare(token).catch(() => undefined);

    return found ? html(sharePageFor(token, found)) : unavailable();
  },
});

instance.sys.api.addRoute({
  method: ["GET", "POST"],
  pattern: new URLPattern({ pathname: `/api/${APPLICATION_ID}/share/:token/download` }),
  async handler(req, params) {
    const token = params?.pathname.groups.token ?? "";
    const found = await openShare(token).catch(() => undefined);

    if (!found) return unavailable();

    if (found.share.passwordHash === undefined) return sendShared(found);

    // protected links only hand the file out in answer to a correct password
    if (req.method !== "POST") return new Response(null, { status: 303, headers: { Location: `/api/${APPLICATION_ID}/share/${token}`, "Cache-Control": "no-store" } });

    if (passwordAttempts.blocked(found.attemptKey)) return html(renderBlockedPage(), 429);

    const body = await readLimited(req, MAX_FORM_BYTES);
    const password = body === undefined ? undefined : new URLSearchParams(body).get("password");

    if (typeof password !== "string" || password.length > 128 || !(await verifyPassword(password, found.share.passwordHash))) {
      passwordAttempts.failed(found.attemptKey);
      return html(sharePageFor(token, found, "That password is not correct."), 401);
    }

    passwordAttempts.succeeded(found.attemptKey);
    return sendShared(found);
  },
});
