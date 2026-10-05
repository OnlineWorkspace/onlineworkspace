import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { TRPCError } from "@trpc/server";
import type UserFilesystem from "./userFilesystem.ts";

export interface TrashRecord {
  id: string;
  name: string;
  originalPath: string;
  kind: "directory" | "file";
  size: number;
  deletedAt: number;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/**
 * Per-user state owned by the files application: starred items and the recycle bin.
 * Lives next to the user's `fs` directory (in `system/` and `recycle_bin/`) so it never shows up in the file list.
 */
export default class UserData {
  private readonly starredFile: string;
  private readonly trashDirectory: string;

  constructor(
    userDirectory: string,
    private readonly files: UserFilesystem,
  ) {
    this.starredFile = path.join(userDirectory, "system", "files-starred.json");
    this.trashDirectory = path.join(userDirectory, "recycle_bin");
  }

  // ---- starred ----

  async starred(): Promise<string[]> {
    return readJson<string[]>(this.starredFile, []);
  }

  private async saveStarred(paths: string[]) {
    await fs.mkdir(path.dirname(this.starredFile), { recursive: true });
    await fs.writeFile(this.starredFile, JSON.stringify([...new Set(paths)]));
  }

  async setStarred(virtualPath: string, starred: boolean) {
    const normalised = this.files.normalise(virtualPath);
    const current = (await this.starred()).filter((p) => p !== normalised);
    await this.saveStarred(starred ? [...current, normalised] : current);
  }

  /** Keeps stars attached to items that were moved or renamed (including anything inside a moved folder). */
  async remapStarred(from: string, to: string | undefined) {
    const source = this.files.normalise(from);
    const remapped: string[] = [];

    for (const starred of await this.starred()) {
      if (starred === source) {
        if (to !== undefined) remapped.push(this.files.normalise(to));
      } else if (starred.startsWith(`${source}/`)) {
        if (to !== undefined) remapped.push(this.files.normalise(to) + starred.slice(source.length));
      } else {
        remapped.push(starred);
      }
    }

    await this.saveStarred(remapped);
  }

  // ---- recycle bin ----

  private payloadPath(id: string) {
    return path.join(this.trashDirectory, id);
  }

  private metaPath(id: string) {
    return path.join(this.trashDirectory, `${id}.meta.json`);
  }

  async trash(): Promise<TrashRecord[]> {
    const names = await fs.readdir(this.trashDirectory).catch(() => [] as string[]);
    const records = await Promise.all(names.filter((n) => n.endsWith(".meta.json")).map((n) => readJson<TrashRecord | undefined>(path.join(this.trashDirectory, n), undefined)));

    return records.filter((r) => r !== undefined).sort((a, b) => b.deletedAt - a.deletedAt);
  }

  async moveToTrash(virtualPath: string) {
    const normalised = this.files.normalise(virtualPath);

    if (normalised === "/") throw new TRPCError({ code: "BAD_REQUEST", message: "Your home folder cannot be deleted" });

    const absolute = this.files.resolve(normalised);
    const stats = await fs.lstat(absolute).catch(() => undefined);

    if (!stats) throw new TRPCError({ code: "NOT_FOUND", message: `${path.basename(normalised)} does not exist` });

    const record: TrashRecord = {
      id: randomUUID(),
      name: path.basename(normalised),
      originalPath: normalised,
      kind: stats.isDirectory() ? "directory" : "file",
      size: stats.isDirectory() ? 0 : stats.size,
      deletedAt: Date.now(),
    };

    await fs.mkdir(this.trashDirectory, { recursive: true });
    await this.files.movePath(absolute, this.payloadPath(record.id));
    await fs.writeFile(this.metaPath(record.id), JSON.stringify(record));
    await this.remapStarred(normalised, undefined);
  }

  private async record(id: string): Promise<TrashRecord> {
    const record = await readJson<TrashRecord | undefined>(this.metaPath(id), undefined);

    if (!record || record.id !== id) throw new TRPCError({ code: "NOT_FOUND", message: "That item is no longer in the trash" });

    return record;
  }

  /** Puts an item back where it came from (or in the home folder if its folder no longer exists). Returns the restored path. */
  async restore(id: string): Promise<string> {
    const record = await this.record(id);
    let parent = this.files.resolve(path.posix.dirname(record.originalPath));

    if (!(await this.files.exists(parent))) parent = this.files.root;

    const name = await this.files.uniqueName(parent, record.name);
    const destination = path.join(parent, name);

    await this.files.movePath(this.payloadPath(id), destination);
    await fs.rm(this.metaPath(id), { force: true });

    return this.files.toVirtual(destination);
  }

  async deletePermanently(id: string) {
    await this.record(id);
    await fs.rm(this.payloadPath(id), { recursive: true, force: true });
    await fs.rm(this.metaPath(id), { force: true });
  }

  async emptyTrash() {
    await fs.rm(this.trashDirectory, { recursive: true, force: true });
    await fs.mkdir(this.trashDirectory, { recursive: true });
  }
}
