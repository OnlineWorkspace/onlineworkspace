import type { Instance } from "../index.ts";
import System from "../system.ts";
import { clientIp } from "../utils/network.ts";

export type AuditOutcome = "success" | "failure";

export interface AuditEntryInput {
  /** a dotted name for what happened, `auth.login`, `backup.restored` */
  action: string;
  /** the user who did it, nothing when it was not someone signed in */
  actorId?: number;
  /** the username which was given, for when there is no signed in user (a failed sign in) */
  actorName?: string;
  /** what it was done to: a username, a backup, a setting */
  target?: string;
  ip?: string;
  outcome?: AuditOutcome;
  details?: Record<string, unknown>;
}

export interface AuditEntry {
  id: number;
  createdAt: number;
  actorId: number | null;
  actorName: string | null;
  action: string;
  target: string | null;
  ip: string | null;
  outcome: AuditOutcome;
  details: Record<string, unknown> | null;
}

const DAY = 24 * 60 * 60 * 1000;

/** A record of who did what on the instance, kept in the database for administrators to look through. */
export default class AuditSystem extends System {
  private pruneTimer?: ReturnType<typeof setInterval>;

  constructor(instance: Instance) {
    super("audit", instance);
  }

  override async startup(): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    // there is deliberately no foreign key on the actor, the record of what someone did must outlive their account
    await db`CREATE TABLE IF NOT EXISTS audit_log (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actor_id INTEGER,
      actor_name TEXT,
      action TEXT NOT NULL,
      target TEXT,
      ip TEXT,
      outcome TEXT NOT NULL DEFAULT 'success',
      details JSONB
    )`;
    await db`CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC)`;
    await db`CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log (action)`;
    await db`CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_id)`;

    await this.prune();
    this.pruneTimer = setInterval(() => void this.prune(), DAY);
    this.pruneTimer.unref?.();

    return true;
  }

  override stop(): boolean {
    if (this.pruneTimer) clearInterval(this.pruneTimer);

    return true;
  }

  /** removes what is older than the retention period */
  async prune() {
    const days = this.instance.sys.configuration.auditLogRetentionDays;

    if (!days || days <= 0) return;

    try {
      const db = this.instance.sys.database.postgres();
      await db`DELETE FROM audit_log WHERE created_at < ${new Date(Date.now() - days * DAY)}`;
    } catch (err) {
      this.log.error("Failed to remove old audit log entries", err);
    }
  }

  /** Writes an entry. This never throws, a failure to record something must not stop whatever is being recorded. */
  record(entry: AuditEntryInput): void {
    void this.write(entry);
  }

  /** the address of a request for an entry, for use as `ip` */
  ipOf(req: Request, server?: Parameters<typeof clientIp>[1]) {
    return clientIp(req, server);
  }

  private async write(entry: AuditEntryInput) {
    try {
      const db = this.instance.sys.database.postgres();
      let actorName = entry.actorName;

      if (actorName === undefined && entry.actorId !== undefined) {
        actorName = await (await this.instance.sys.users.getUserById(entry.actorId))?.getUsername().catch(() => undefined);
      }

      await db`INSERT INTO audit_log (actor_id, actor_name, action, target, ip, outcome, details)
               VALUES (${entry.actorId ?? null}, ${actorName ?? null}, ${entry.action}, ${entry.target ?? null}, ${entry.ip ?? null}, ${entry.outcome ?? "success"}, ${entry.details ? JSON.stringify(entry.details) : null}::jsonb)`;
    } catch (err) {
      this.log.error(`Failed to record the audit entry '${entry.action}'`, err);
    }
  }

  /** a page of entries, the newest first */
  async list(options: { limit: number; before?: number; action?: string; actorId?: number; outcome?: AuditOutcome; search?: string }): Promise<{ entries: AuditEntry[]; hasMore: boolean }> {
    const db = this.instance.sys.database.postgres();
    const limit = Math.min(Math.max(options.limit, 1), 200);
    const search = options.search?.trim() ? `%${options.search.trim().replace(/[\\%_]/g, "\\$&")}%` : null;

    const rows = (await db`SELECT id, created_at, actor_id, actor_name, action, target, ip, outcome, details
                           FROM audit_log
                           WHERE (${options.before ?? null}::bigint IS NULL OR id < ${options.before ?? null}::bigint)
                             AND (${options.action ?? null}::text IS NULL OR action LIKE ${options.action ? `${options.action.replace(/[\\%_]/g, "\\$&")}%` : null})
                             AND (${options.actorId ?? null}::int IS NULL OR actor_id = ${options.actorId ?? null}::int)
                             AND (${options.outcome ?? null}::text IS NULL OR outcome = ${options.outcome ?? null}::text)
                             AND (${search}::text IS NULL OR actor_name ILIKE ${search} OR target ILIKE ${search} OR action ILIKE ${search} OR ip ILIKE ${search})
                           ORDER BY id DESC
                           LIMIT ${limit + 1}`) as {
      id: string | number;
      created_at: Date;
      actor_id: number | null;
      actor_name: string | null;
      action: string;
      target: string | null;
      ip: string | null;
      outcome: AuditOutcome;
      details: Record<string, unknown> | string | null;
    }[];

    return {
      hasMore: rows.length > limit,
      entries: rows.slice(0, limit).map((row) => ({
        id: Number(row.id),
        createdAt: new Date(row.created_at).getTime(),
        actorId: row.actor_id,
        actorName: row.actor_name,
        action: row.action,
        target: row.target,
        ip: row.ip,
        outcome: row.outcome,
        details: typeof row.details === "string" ? JSON.parse(row.details) : row.details,
      })),
    };
  }
}
