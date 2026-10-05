import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { TRPCError } from "@trpc/server";
import type UserFilesystem from "./userFilesystem.ts";

export interface ShareRecord {
  id: string;
  // SHA-256 of the secret part of the link, the link itself is only ever shown once
  secretHash: string;
  // virtual path of the shared file
  path: string;
  name: string;
  createdAt: number;
  // null never expires
  expiresAt: number | null;
  // "scrypt$<salt>$<hash>" when the link is password protected
  passwordHash?: string;
  downloads: number;
}

export type PublicShare = Omit<ShareRecord, "secretHash" | "passwordHash"> & { hasPassword: boolean };

export const MAX_SHARES_PER_USER = 200;
const SECRET_BYTES = 32;
const SCRYPT_KEY_LENGTH = 64;

const sha256 = (value: string) => createHash("sha256").update(value).digest();

const scryptAsync = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key))));

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${(await scryptAsync(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(password, Buffer.from(salt, "hex"));

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** A link is `<user id>.<secret>`. The user id only says whose share list to look in, the secret is what grants access. */
export function parseToken(token: string): { userId: number; secret: string } | undefined {
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return undefined;

  return { userId: Number(match[1]), secret: match[2]! };
}

export const isExpired = (share: Pick<ShareRecord, "expiresAt">, now = Date.now()) => share.expiresAt !== null && share.expiresAt <= now;

const toPublic = ({ secretHash: _secret, passwordHash, ...rest }: ShareRecord): PublicShare => ({ ...rest, hasPassword: passwordHash !== undefined });

// writes to the same file are chained so that two simultaneous changes cannot overwrite each other
const queues = new Map<string, Promise<unknown>>();

function serialised<T>(key: string, work: () => Promise<T>): Promise<T> {
  const next = (queues.get(key) ?? Promise.resolve()).then(work, work);
  queues.set(key, next.catch(() => undefined));
  return next;
}

/**
 * The share links a user created. Stored next to their `fs` directory so that the list never shows up as a file,
 * and only ever holds hashes: the file cannot be used to open anyone's links.
 */
export default class ShareStore {
  private readonly file: string;

  constructor(
    userDirectory: string,
    private readonly files: UserFilesystem,
  ) {
    this.file = path.join(userDirectory, "system", "files-shares.json");
  }

  private async read(): Promise<ShareRecord[]> {
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async write(records: ShareRecord[]) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });

    const temporary = `${this.file}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(records), { mode: 0o600 });
    await fs.rename(temporary, this.file);
  }

  private change<T>(work: (records: ShareRecord[]) => T | Promise<T>): Promise<T> {
    return serialised(this.file, async () => {
      const records = (await this.read()).filter((record) => !isExpired(record));
      const result = await work(records);
      await this.write(records);
      return result;
    });
  }

  async list(virtualPath?: string): Promise<PublicShare[]> {
    const normalised = virtualPath === undefined ? undefined : this.files.normalise(virtualPath);

    return (await this.read())
      .filter((record) => !isExpired(record) && (normalised === undefined || record.path === normalised))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(toPublic);
  }

  /** Returns the share and the secret to put in its link. The secret cannot be recovered afterwards. */
  async create(input: { path: string; name: string; expiresAt: number | null; password?: string }): Promise<{ share: PublicShare; secret: string }> {
    const secret = randomBytes(SECRET_BYTES).toString("base64url");
    const passwordHash = input.password ? await hashPassword(input.password) : undefined;

    const record: ShareRecord = {
      id: randomUUID(),
      secretHash: sha256(secret).toString("hex"),
      path: this.files.normalise(input.path),
      name: input.name,
      createdAt: Date.now(),
      expiresAt: input.expiresAt,
      ...(passwordHash ? { passwordHash } : {}),
      downloads: 0,
    };

    await this.change((records) => {
      if (records.length >= MAX_SHARES_PER_USER) throw new TRPCError({ code: "BAD_REQUEST", message: "You have reached the limit of shared links. Stop sharing something first." });
      records.push(record);
    });

    return { share: toPublic(record), secret };
  }

  async revoke(id: string): Promise<boolean> {
    return this.change((records) => {
      const index = records.findIndex((record) => record.id === id);
      if (index !== -1) records.splice(index, 1);
      return index !== -1;
    });
  }

  /** Looks a link up by its secret. Every record is compared so the time taken does not hint at what matched. */
  async find(secret: string): Promise<ShareRecord | undefined> {
    const wanted = sha256(secret);
    let found: ShareRecord | undefined;

    for (const record of await this.read()) {
      const candidate = Buffer.from(record.secretHash, "hex");
      if (candidate.length === wanted.length && timingSafeEqual(candidate, wanted) && !isExpired(record)) found = record;
    }

    return found;
  }

  async countDownload(id: string) {
    await this.change((records) => {
      const record = records.find((candidate) => candidate.id === id);
      if (record) record.downloads += 1;
    });
  }

  /** Keeps links attached to files that were moved or renamed, `to` undefined stops sharing everything below `from`. */
  async remap(from: string, to: string | undefined) {
    const source = this.files.normalise(from);

    await this.change((records) => {
      const kept: ShareRecord[] = [];

      for (const record of records) {
        if (record.path === source || record.path.startsWith(`${source}/`)) {
          if (to === undefined) continue;
          record.path = this.files.normalise(to) + record.path.slice(source.length);
          record.name = path.posix.basename(record.path);
        }
        kept.push(record);
      }

      records.splice(0, records.length, ...kept);
    });
  }
}

/** Failed password attempts per link, so a password cannot be guessed by hammering one link. */
const ATTEMPT_WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetsAt: number }>();

export const passwordAttempts = {
  blocked(key: string): boolean {
    const entry = attempts.get(key);
    if (!entry) return false;
    if (entry.resetsAt <= Date.now()) {
      attempts.delete(key);
      return false;
    }
    return entry.count >= MAX_ATTEMPTS;
  },
  failed(key: string) {
    const entry = attempts.get(key);

    if (!entry || entry.resetsAt <= Date.now()) attempts.set(key, { count: 1, resetsAt: Date.now() + ATTEMPT_WINDOW_MS });
    else entry.count += 1;
  },
  succeeded(key: string) {
    attempts.delete(key);
  },
};
