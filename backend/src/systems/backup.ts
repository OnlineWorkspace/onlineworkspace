import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export type BackupTrigger = "manual" | "scheduled" | "pre-restore";
/** `full` is the database and everybody's files, `database` is the database and the configuration */
export type BackupScope = "full" | "database";

/** `full` has everything, `incremental` only has the files which changed since `baseId` and needs the backups before it to be restored */
export type BackupKind = "full" | "incremental";

export interface BackupRecord {
  id: string;
  createdAt: number;
  /** backups made before incremental backups existed are all full ones */
  kind?: BackupKind;
  /** the backup an incremental one continues from */
  baseId?: string;
  /** when the files were looked at, files which changed after it are in the next incremental backup */
  snapshotAt?: number;
  /** how many files, folders and links the filesystem had, and how many of them are in this archive */
  fileCount?: number;
  includedCount?: number;
  createdBy: number | null;
  trigger: BackupTrigger;
  scope: BackupScope;
  sizeBytes: number;
  instanceVersion: string;
  note?: string;
}

export interface BackupJob {
  kind: "backup" | "restore";
  id: string;
  startedAt: number;
  stage: string;
}

const FORMAT_VERSION = 2;
/** the file system keeps a change time slightly after the change, this much is looked back to not miss a file which was changing as the last backup began */
const CHANGE_SLACK_MS = 2000;
const SCHEDULE_CHECK_MS = 5 * 60 * 1000;
/** the folders of the filesystem which are not part of a backup, they can be made again */
const NOT_BACKED_UP = new Set(["cache", "backups", "system"]);
const BACKUP_ID = /^[0-9]{8}-[0-9]{6}-[0-9a-f]{8}$/;

export class BackupError extends Error {}

/** Backups of the database and the files, kept in the `backups` folder of the instance's filesystem. */
export default class BackupSystem extends System {
  private job?: BackupJob;
  private scheduleTimer?: ReturnType<typeof setInterval>;
  /** what went wrong with the last scheduled backup, for the settings page to show */
  lastScheduledError?: { at: number; message: string };
  /** what went wrong the last time a backup or a restore was started by a person */
  lastFailure?: { at: number; kind: BackupJob["kind"]; message: string };

  constructor(instance: Instance) {
    super("backup", instance);
  }

  get directory() {
    return path.join(this.instance.sys.filesystem.FS_ROOT, "backups");
  }

  override async startup(): Promise<boolean> {
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    await this.removeLeftovers();

    this.scheduleTimer = setInterval(() => void this.runSchedule(), SCHEDULE_CHECK_MS);
    this.scheduleTimer.unref?.();

    return true;
  }

  override stop(): boolean {
    if (this.scheduleTimer) clearInterval(this.scheduleTimer);

    return true;
  }

  /** a backup which was being made when the instance stopped leaves its working files behind */
  private async removeLeftovers() {
    for (const entry of await fs.readdir(this.directory).catch(() => [])) {
      if (entry.startsWith(".staging-") || entry.startsWith(".restore-") || entry.endsWith(".partial")) {
        await fs.rm(path.join(this.directory, entry), { recursive: true, force: true });
      }
    }
  }

  /** the tools a backup needs, a backup cannot be made or restored without them */
  tools() {
    return { pgDump: Bun.which("pg_dump") !== null, pgRestore: Bun.which("pg_restore") !== null, tar: Bun.which("tar") !== null };
  }

  get currentJob(): BackupJob | undefined {
    return this.job;
  }

  isValidId(id: string) {
    return BACKUP_ID.test(id);
  }

  archivePath(id: string) {
    if (!this.isValidId(id)) throw new BackupError("That is not a backup");

    return path.join(this.directory, `${id}.tar.gz`);
  }

  private recordPath(id: string) {
    return path.join(this.directory, `${id}.json`);
  }

  async list(): Promise<BackupRecord[]> {
    const records: BackupRecord[] = [];

    for (const entry of await fs.readdir(this.directory).catch(() => [])) {
      if (!entry.endsWith(".json")) continue;

      const id = entry.slice(0, -".json".length);

      if (!this.isValidId(id)) continue;

      try {
        const record = JSON.parse(await fs.readFile(path.join(this.directory, entry), "utf8")) as BackupRecord;
        const archive = await fs.stat(this.archivePath(id));

        records.push({ ...record, sizeBytes: archive.size });
      } catch {
        // the archive or its record is missing, so there is nothing which can be restored
      }
    }

    return records.sort((a, b) => b.createdAt - a.createdAt);
  }

  async get(id: string): Promise<BackupRecord | undefined> {
    return (await this.list()).find((r) => r.id === id);
  }

  /** the backups needed to restore this one, the oldest (a full backup) first and this one last */
  async chain(record: BackupRecord, all?: BackupRecord[]): Promise<BackupRecord[]> {
    const records = all ?? (await this.list());
    const chain = [record];

    while ((chain[0].kind ?? "full") === "incremental") {
      const base = records.find((r) => r.id === chain[0].baseId);

      if (!base) throw new BackupError(`That backup continues from a backup (${chain[0].baseId}) which no longer exists, so it cannot be restored`);
      if (chain.includes(base)) throw new BackupError("That backup's history is damaged");

      chain.unshift(base);
    }

    return chain;
  }

  /** the backups which cannot be restored without this one */
  dependents(id: string, all: BackupRecord[]): BackupRecord[] {
    const found = new Set<string>([id]);
    let grew = true;

    while (grew) {
      grew = false;

      for (const record of all) {
        if (!found.has(record.id) && record.baseId && found.has(record.baseId)) {
          found.add(record.id);
          grew = true;
        }
      }
    }

    found.delete(id);

    return all.filter((r) => found.has(r.id));
  }

  /** every file, folder and link in the part of the filesystem which is backed up, relative to its root, and when each changed */
  private async scanFiles(root: string): Promise<{ path: string; changedAt: number }[]> {
    const found: { path: string; changedAt: number }[] = [];

    const walk = async (relative: string) => {
      for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true }).catch(() => [])) {
        if (relative === "" && NOT_BACKED_UP.has(entry.name)) continue;
        if (!entry.isFile() && !entry.isDirectory() && !entry.isSymbolicLink()) continue;

        const entryPath = relative === "" ? entry.name : `${relative}/${entry.name}`;
        // the change time can not be set by programs, unlike the modification time which uploads and copies keep from the original
        const stats = await fs.lstat(path.join(root, entryPath)).catch(() => undefined);

        if (!stats) continue;

        found.push({ path: entryPath, changedAt: Math.max(stats.ctimeMs, stats.mtimeMs) });

        if (entry.isDirectory()) await walk(entryPath);
      }
    };

    await walk("");

    return found;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.list();

    if (!all.some((r) => r.id === id)) return false;

    const dependents = this.dependents(id, all);

    if (dependents.length > 0) {
      throw new BackupError(`${dependents.length === 1 ? "Another backup continues" : `${dependents.length} other backups continue`} from this one and could not be restored without it. Delete ${dependents.length === 1 ? "that one" : "those"} first`);
    }

    await fs.rm(this.archivePath(id), { force: true });
    await fs.rm(this.recordPath(id), { force: true });

    return true;
  }

  private begin(kind: BackupJob["kind"], id: string) {
    if (this.job) throw new BackupError(`A ${this.job.kind} is already running`);

    this.job = { kind, id, startedAt: Date.now(), stage: "Starting" };
  }

  private stage(stage: string) {
    if (this.job) this.job.stage = stage;
  }

  private async run(command: string[], env: Record<string, string> = {}, okExitCodes: number[] = [0]) {
    const process = Bun.spawn(command, { env: { ...Bun.env, ...env }, stdout: "pipe", stderr: "pipe" });
    const [stderr, code] = await Promise.all([new Response(process.stderr).text(), process.exited]);

    if (!okExitCodes.includes(code)) {
      throw new BackupError(`${path.basename(command[0])} failed (${code}): ${stderr.trim().split("\n").slice(-3).join(" ") || "no output"}`);
    }

    return stderr;
  }

  private postgresArguments() {
    const postgres = this.instance.sys.configuration.databases.postgres;

    return {
      connection: ["-h", postgres.host, "-p", String(postgres.port), "-U", postgres.user, "-d", postgres.database],
      env: { PGPASSWORD: postgres.password },
    };
  }

  private assertTools(needs: (keyof ReturnType<BackupSystem["tools"]>)[]) {
    const tools = this.tools();
    const missing = needs.filter((tool) => !tools[tool]);

    if (missing.length > 0) {
      throw new BackupError(`${missing.map((t) => (t === "pgDump" ? "pg_dump" : t === "pgRestore" ? "pg_restore" : t)).join(" and ")} must be installed on the server to make or restore backups`);
    }
  }

  private newId() {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);

    return `${stamp}-${crypto.randomBytes(4).toString("hex")}`;
  }

  /**
   * The backup which an incremental backup would continue from: the newest one with files, as long as everything it needs is still there.
   * Backups of only the database never count, they have no files to continue from.
   */
  private async findBase(): Promise<BackupRecord | undefined> {
    const all = await this.list();

    for (const candidate of all) {
      if (candidate.scope !== "full") continue;

      try {
        await this.chain(candidate, all);

        return candidate;
      } catch {
        // a backup which cannot be restored is no good to continue from
      }
    }

    return undefined;
  }

  /** how many incremental backups there are since the last full one, counting back from a backup */
  private async chainLength(record: BackupRecord): Promise<number> {
    return (await this.chain(record)).length - 1;
  }

  /**
   * Makes a backup. Files which change while it is being made are included as they were when they were read.
   * An `incremental` backup has the whole database, which is a single dump, but only the files which changed since the last backup with files.
   * It is a full one when there is nothing to continue from.
   */
  async create(options: { scope: BackupScope; trigger: BackupTrigger; mode?: BackupKind; userId?: number; note?: string }): Promise<BackupRecord> {
    this.assertTools(["pgDump", "tar"]);

    const id = this.newId();
    this.begin("backup", id);

    const staging = path.join(this.directory, `.staging-${id}`);
    const partial = path.join(this.directory, `${id}.tar.gz.partial`);

    try {
      await fs.mkdir(staging, { recursive: true, mode: 0o700 });

      // a backup made so that a restore can be undone has to stand on its own
      const base = options.scope === "full" && options.mode === "incremental" && options.trigger !== "pre-restore" ? await this.findBase() : undefined;
      const snapshotAt = Date.now();

      const record: BackupRecord = {
        id,
        createdAt: snapshotAt,
        kind: base ? "incremental" : "full",
        baseId: base?.id,
        snapshotAt,
        createdBy: options.userId ?? null,
        trigger: options.trigger,
        scope: options.scope,
        sizeBytes: 0,
        instanceVersion: this.instance.versionString,
        note: options.note,
      };

      this.stage("Exporting the database");
      const postgres = this.postgresArguments();
      await this.run(["pg_dump", ...postgres.connection, "-Fc", "--no-owner", "--no-privileges", "-f", path.join(staging, "database.dump")], postgres.env);

      const root = this.instance.sys.filesystem.FS_ROOT;
      const members = ["manifest.json", "database.dump"];
      let command: string[];

      if (options.scope === "full") {
        this.stage(base ? "Finding the files which changed" : "Listing the files");

        const files = await this.scanFiles(root);
        // a file is in an incremental backup when it changed since the files were last looked at, the configuration always is
        const cutoff = base ? (base.snapshotAt ?? base.createdAt) - CHANGE_SLACK_MS : -Infinity;
        const included = files.filter((file) => file.changedAt >= cutoff || file.path === "configuration.json");

        record.fileCount = files.length;
        record.includedCount = included.length;

        // every path, so that restoring knows which files had been deleted by then
        await fs.writeFile(path.join(staging, "index.lst"), files.map((file) => file.path).join("\0"));
        await fs.writeFile(path.join(staging, "include.lst"), included.map((file) => `./${file.path}`).join("\0"));
        members.push("index.lst");

        this.stage("Archiving the files");
        command = ["tar", "-czf", partial, "--transform", "s,^\\./,fs/,", "--no-recursion", "--null", "-C", root, "-T", path.join(staging, "include.lst"), "-C", staging, ...members];
      } else {
        this.stage("Archiving the configuration");
        command = ["tar", "-czf", partial, "--transform", "s,^\\./,fs/,", "-C", root, "./configuration.json", "-C", staging, ...members];
      }

      await fs.writeFile(path.join(staging, "manifest.json"), JSON.stringify({ formatVersion: FORMAT_VERSION, ...record }, null, 2));

      // the exit code 1 is tar saying that a file changed while it was read, which a live instance does all the time
      await this.run(command, {}, [0, 1]);

      await fs.chmod(partial, 0o600);
      await fs.rename(partial, this.archivePath(id));

      record.sizeBytes = (await fs.stat(this.archivePath(id))).size;
      await fs.writeFile(this.recordPath(id), JSON.stringify(record, null, 2), { mode: 0o600 });

      this.instance.sys.audit?.record({
        action: "backup.created",
        actorId: options.userId,
        target: id,
        details: { trigger: options.trigger, scope: options.scope, kind: record.kind, baseId: record.baseId, sizeBytes: record.sizeBytes },
      });
      this.log.success(`Made the ${record.kind === "incremental" ? `incremental backup of ${record.includedCount} of ${record.fileCount} files` : `${options.scope} backup`} '${id}' (${options.trigger})`);

      return record;
    } catch (error) {
      await fs.rm(partial, { force: true });
      this.instance.sys.audit?.record({ action: "backup.created", actorId: options.userId, target: id, outcome: "failure", details: { trigger: options.trigger, error: String(error) } });
      if (options.trigger === "manual") this.lastFailure = { at: Date.now(), kind: "backup", message: error instanceof Error ? error.message : String(error) };
      throw error;
    } finally {
      await fs.rm(staging, { recursive: true, force: true });
      this.job = undefined;
    }
  }

  /**
   * Replaces the database, and the files if the backup has them, with what was backed up.
   * A backup of what is there now is made first so that the restore can be undone. The configuration is not replaced, as it says
   * where this instance's database is and what it is called.
   */
  async restore(id: string, userId: number): Promise<{ restartingInMs: number }> {
    this.assertTools(["pgRestore", "pgDump", "tar"]);

    const record = await this.get(id);

    if (!record) throw new BackupError("That backup does not exist");

    // an incremental backup is restored from the full backup it began with and every incremental one after it, which must all be there
    const chain = await this.chain(record);

    // checked before anything is changed, tar fails if either file is not in the archive or the archive is damaged
    for (const link of chain) {
      await this.run(["tar", "-tzf", this.archivePath(link.id), "manifest.json", "database.dump"]).catch((error: Error) => {
        throw new BackupError(`That backup is damaged or is not a backup of this instance (${link.id}: ${error.message})`);
      });
    }

    const pre = await this.create({ scope: record.scope, trigger: "pre-restore", userId, note: `Made before restoring ${id}` });

    this.begin("restore", id);

    const staging = path.join(this.directory, `.restore-${id}`);

    try {
      await fs.mkdir(staging, { recursive: true, mode: 0o700 });

      // oldest first, so that what changed later replaces what was there, and the database and file index are the ones of the backup being restored
      for (const [position, link] of chain.entries()) {
        this.stage(chain.length > 1 ? `Unpacking the backup (${position + 1} of ${chain.length})` : "Unpacking the backup");
        await this.run(["tar", "-xzf", this.archivePath(link.id), "-C", staging]);
      }

      this.stage("Restoring the database");
      const postgres = this.postgresArguments();
      await this.run(["pg_restore", ...postgres.connection, "--clean", "--if-exists", "--no-owner", "--no-privileges", "--single-transaction", path.join(staging, "database.dump")], postgres.env);

      if (record.scope === "full") {
        this.stage("Restoring the files");
        const root = this.instance.sys.filesystem.FS_ROOT;

        // whatever the unpacked backups have which the restored one did not is a file which had been deleted by then
        await this.removeDeleted(path.join(staging, "fs"), path.join(staging, "index.lst"));

        for (const entry of await fs.readdir(path.join(staging, "fs")).catch(() => [])) {
          if (NOT_BACKED_UP.has(entry) || entry === "configuration.json") continue;

          await fs.rm(path.join(root, entry), { recursive: true, force: true });
          await fs.rename(path.join(staging, "fs", entry), path.join(root, entry));
        }
      }

      // written to the restored database, so that the record of the restore is not lost with the one it replaced
      this.instance.sys.audit?.record({ action: "backup.restored", actorId: userId, target: id, details: { scope: record.scope, undoBackup: pre.id } });
      this.log.success(`Restored the backup '${id}'`);

      return { restartingInMs: 1500 };
    } catch (error) {
      this.instance.sys.audit?.record({ action: "backup.restored", actorId: userId, target: id, outcome: "failure", details: { error: String(error), undoBackup: pre.id } });
      this.lastFailure = { at: Date.now(), kind: "restore", message: error instanceof Error ? error.message : String(error) };
      throw error;
    } finally {
      await fs.rm(staging, { recursive: true, force: true });
      this.job = undefined;
    }
  }

  /** removes what is not in the index (every path the backup had, separated by NUL characters) from the unpacked files, which the index is missing for old backups */
  private async removeDeleted(unpacked: string, indexFile: string) {
    const index = await fs.readFile(indexFile, "utf8").catch(() => undefined);

    // backups from before there were incremental ones are always the whole thing, there is nothing to take away
    if (index === undefined) return;

    const keep = new Set(index.split("\0"));

    const walk = async (relative: string) => {
      for (const entry of await fs.readdir(path.join(unpacked, relative), { withFileTypes: true }).catch(() => [])) {
        const entryPath = relative === "" ? entry.name : `${relative}/${entry.name}`;

        if (!keep.has(entryPath) && !(relative === "" && entry.name === "configuration.json")) {
          await fs.rm(path.join(unpacked, entryPath), { recursive: true, force: true });
        } else if (entry.isDirectory()) {
          await walk(entryPath);
        }
      }
    };

    await walk("");
  }

  /** Starts over from the restored state, everything the instance had in memory (sessions, caches) is from before it. */
  restartSoon(delayMs: number) {
    setTimeout(() => void this.instance.restart("auto").catch((err) => this.log.error("Failed to restart after restoring a backup", err)), delayMs);
  }

  /** makes a scheduled backup when one is due, and removes the old ones */
  private async runSchedule() {
    const schedule = this.instance.sys.configuration.backups;

    if (!schedule.enabled || this.job || this.instance.mode !== "full") return;

    try {
      const scheduled = (await this.list()).filter((b) => b.trigger === "scheduled");
      const due = scheduled.length === 0 || Date.now() - scheduled[0].createdAt >= Math.max(1, schedule.intervalHours) * 60 * 60 * 1000;

      if (!due) return;

      // scheduled backups continue from the last one, with a new full backup every so often so that a restore never needs a long line of them
      let mode: BackupKind = "full";

      if (schedule.includeFiles && (schedule.incremental ?? true)) {
        const base = await this.findBase();

        if (base && (await this.chainLength(base)) < Math.max(1, schedule.fullEvery ?? 7) - 1) mode = "incremental";
      }

      await this.create({ scope: schedule.includeFiles ? "full" : "database", trigger: "scheduled", mode });
      this.lastScheduledError = undefined;

      const keep = Math.max(1, schedule.keep);

      // a backup which one that is kept continues from stays, it goes once nothing needs it any more
      for (const old of (await this.list()).filter((b) => b.trigger === "scheduled").slice(keep)) {
        if (this.dependents(old.id, await this.list()).length > 0) continue;

        await this.delete(old.id);
        this.instance.sys.audit?.record({ action: "backup.deleted", target: old.id, details: { reason: "scheduled backups kept" } });
      }
    } catch (error) {
      this.lastScheduledError = { at: Date.now(), message: error instanceof Error ? error.message : String(error) };
      this.log.error("A scheduled backup failed", error);
    }
  }
}
