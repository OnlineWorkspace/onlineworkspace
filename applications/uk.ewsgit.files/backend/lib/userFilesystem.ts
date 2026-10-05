import { constants, type Dirent, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { TRPCError } from "@trpc/server";
import { describeFileType, type FileCategory } from "./fileTypes.ts";

export interface FileEntry {
  name: string;
  // virtual path, always starts with "/" ("/" is the user's home)
  path: string;
  kind: "directory" | "file";
  size: number;
  modified: number;
  created: number;
  extension: string;
  category: FileCategory | "directory";
  typeLabel: string;
  // number of children, only set for directories
  itemCount?: number;
}

// the most entries any recursive walk will visit, keeps pathological trees from stalling the server
const WALK_LIMIT = 100_000;

/**
 * Everything the files application does is confined to a single user's `fs` directory.
 * Virtual paths ("/Documents/a.txt") are mapped onto it, and any path that would escape it is rejected.
 */
export default class UserFilesystem {
  readonly root: string;

  constructor(userDirectory: string) {
    this.root = path.join(userDirectory, "fs");
  }

  normalise(virtualPath: string): string {
    const normalised = path.posix.normalize(`/${virtualPath}`).replace(/\/+$/, "");
    return normalised === "" ? "/" : normalised;
  }

  resolve(virtualPath: string): string {
    const absolute = path.resolve(this.root, `.${this.normalise(virtualPath)}`);

    if (absolute !== this.root && !absolute.startsWith(this.root + path.sep)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "That location is outside of your files" });
    }

    return absolute;
  }

  /**
   * Resolves a regular file that really lives inside the user's files: symlinks (also in parent folders) are refused,
   * so a file that was swapped for a link to somewhere else can never be read through the app.
   */
  async resolveFile(virtualPath: string): Promise<{ absolute: string; stats: Stats }> {
    const absolute = this.resolve(virtualPath);
    const stats = await fs.lstat(absolute).catch(() => undefined);

    if (!stats?.isFile()) throw new TRPCError({ code: "NOT_FOUND", message: "That file does not exist" });

    const [real, realRoot] = await Promise.all([fs.realpath(absolute), fs.realpath(this.root)]);
    if (!real.startsWith(realRoot + path.sep)) throw new TRPCError({ code: "FORBIDDEN", message: "That location is outside of your files" });

    return { absolute: real, stats };
  }

  toVirtual(absolute: string): string {
    const relative = path.relative(this.root, absolute).split(path.sep).join("/");
    return this.normalise(relative);
  }

  assertValidName(name: string) {
    if (name.trim() === "" || name === "." || name === ".." || /[\\/\0]/.test(name) || name.length > 255) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `"${name}" is not a valid name` });
    }
  }

  async ensureRoot() {
    await fs.mkdir(this.root, { recursive: true });
  }

  async exists(absolute: string): Promise<boolean> {
    return fs.access(absolute, constants.F_OK).then(
      () => true,
      () => false,
    );
  }

  async entryFor(absolute: string, stats?: Stats): Promise<FileEntry> {
    const info = stats ?? (await fs.stat(absolute));
    const name = path.basename(absolute) || "Home";
    const isDirectory = info.isDirectory();

    const type = describeFileType(name);

    const entry: FileEntry = {
      name,
      path: this.toVirtual(absolute),
      kind: isDirectory ? "directory" : "file",
      size: isDirectory ? 0 : Number(info.size),
      modified: info.mtimeMs,
      created: info.birthtimeMs || info.ctimeMs,
      ...(isDirectory
        ? { extension: "", category: "directory" as const, typeLabel: "Folder" }
        : { extension: type.extension, category: type.category, typeLabel: type.label }),
    };

    if (isDirectory) {
      entry.itemCount = (await fs.readdir(absolute).catch(() => [])).length;
    }

    return entry;
  }

  async readDirectory(absolute: string): Promise<FileEntry[]> {
    let children: Dirent[];

    try {
      children = await fs.readdir(absolute, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new TRPCError({ code: "NOT_FOUND", message: "This folder does not exist" });
      }
      if ((error as NodeJS.ErrnoException).code === "ENOTDIR") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This is not a folder" });
      }
      throw error;
    }

    const entries = await Promise.all(
      children
        .filter((child) => !child.isSymbolicLink())
        .map((child) => this.entryFor(path.join(absolute, child.name)).catch(() => undefined)),
    );

    return entries.filter((entry) => entry !== undefined);
  }

  /** Visits every file below `from`, depth first, never following symlinks. */
  async *walk(from: string = this.root, limit: number = WALK_LIMIT): AsyncGenerator<{ absolute: string; dirent: Dirent }> {
    const pending = [from];
    let visited = 0;

    while (pending.length > 0) {
      const directory = pending.pop()!;
      const children = await fs.readdir(directory, { withFileTypes: true }).catch(() => [] as Dirent[]);

      for (const dirent of children) {
        if (dirent.isSymbolicLink()) continue;
        if (++visited > limit) return;

        const absolute = path.join(directory, dirent.name);

        if (dirent.isDirectory()) pending.push(absolute);

        yield { absolute, dirent };
      }
    }
  }

  /** Finds a name that does not exist yet in `directory`, e.g. "report (1).pdf". */
  async uniqueName(directory: string, name: string): Promise<string> {
    if (!(await this.exists(path.join(directory, name)))) return name;

    const extension = path.extname(name);
    const stem = extension ? name.slice(0, -extension.length) : name;

    for (let attempt = 1; attempt < 10_000; attempt++) {
      const candidate = `${stem} (${attempt})${extension}`;
      if (!(await this.exists(path.join(directory, candidate)))) return candidate;
    }

    throw new TRPCError({ code: "CONFLICT", message: "Could not find a free name" });
  }

  /** `fs.rename` that also works across devices. */
  async movePath(source: string, destination: string) {
    try {
      await fs.rename(source, destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
      await fs.cp(source, destination, { recursive: true, errorOnExist: true, force: false });
      await fs.rm(source, { recursive: true, force: true });
    }
  }
}
