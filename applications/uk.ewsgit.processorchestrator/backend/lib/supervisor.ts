import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { WorkspacesNotificationPriority } from "@onlineworkspace/workspace-backend/src/systems/notifications.ts";
import { db, type ProcessRow } from "./db.ts";
import LogBuffer from "./logBuffer.ts";

export const APPLICATION_ID = "uk.ewsgit.processorchestrator";

export type ProcessState = "stopped" | "starting" | "running" | "stopping" | "restarting" | "crashed";

export interface RuntimeStatus {
  state: ProcessState;
  pid: number | undefined;
  startedAt: number | undefined;
  restarts: number;
  exitCode: number | null;
  signal: string | null;
  /** when a restart is waiting, the time it will happen */
  restartAt: number | undefined;
}

export type SupervisorListener = { output(data: Uint8Array): void; state(status: RuntimeStatus): void };

interface Managed {
  row: ProcessRow;
  status: RuntimeStatus;
  proc?: Bun.Subprocess;
  runId?: number;
  intentional: boolean;
  /** consecutive automatic restarts, reset after a stable run */
  attempts: number;
  restartTimer?: ReturnType<typeof setTimeout>;
  killTimer?: ReturnType<typeof setTimeout>;
  lastNotified: number;
  cols: number;
  rows: number;
  log: LogBuffer;
  listeners: Set<SupervisorListener>;
}

const STOP_TIMEOUT_MS = 10_000;
const STABLE_RUN_MS = 60_000;
const BACKOFF_MIN_MS = 1_000;
const BACKOFF_MAX_MS = 60_000;
const NOTIFY_THROTTLE_MS = 60_000;

const signalName = (signal: number | null): string | null =>
  signal === null ? null : (Object.entries(os.constants.signals).find(([, value]) => value === signal)?.[0] ?? `signal ${signal}`);

const idle = (): RuntimeStatus => ({ state: "stopped", pid: undefined, startedAt: undefined, restarts: 0, exitCode: null, signal: null, restartAt: undefined });

export default class Supervisor {
  private readonly managed = new Map<string, Managed>();
  private readonly log = instance.log.createLogger(APPLICATION_ID);
  private shuttingDown = false;

  /** where the logs of the processes are kept */
  private logFile(id: string) {
    return path.join(instance.sys.filesystem.getApplicationCacheDirectory(APPLICATION_ID), "logs", `${id}.log`);
  }

  private entry(row: ProcessRow): Managed {
    let m = this.managed.get(row.id);

    if (!m) {
      m = {
        row,
        status: idle(),
        intentional: false,
        attempts: 0,
        lastNotified: 0,
        cols: 80,
        rows: 24,
        log: new LogBuffer(this.logFile(row.id)),
        listeners: new Set(),
      };
      this.managed.set(row.id, m);
    } else {
      m.row = row;
    }

    return m;
  }

  /** makes the supervisor aware of a process row, used after it is created or edited */
  register(row: ProcessRow) {
    this.entry(row);
  }

  status(id: string): RuntimeStatus {
    return this.managed.get(id)?.status ?? idle();
  }

  isActive(id: string) {
    const state = this.managed.get(id)?.status.state;

    return state === "running" || state === "starting" || state === "stopping" || state === "restarting";
  }

  subscribe(row: ProcessRow, listener: SupervisorListener) {
    const m = this.entry(row);

    m.listeners.add(listener);

    return () => m.listeners.delete(listener);
  }

  replay(id: string): Uint8Array {
    return this.managed.get(id)?.log.tail() ?? new Uint8Array();
  }

  private setStatus(m: Managed, patch: Partial<RuntimeStatus>) {
    m.status = { ...m.status, ...patch };

    for (const listener of m.listeners) listener.state(m.status);
  }

  private async recordRunEnd(m: Managed, reason: string) {
    if (m.runId === undefined) return;

    const runId = m.runId;

    m.runId = undefined;

    try {
      await db`UPDATE public.uk_ewsgit_processorchestrator_runs
               SET ended_at = NOW(), exit_code = ${m.status.exitCode}, signal = ${m.status.signal}, reason = ${reason}
               WHERE id = ${runId}`;
    } catch (error) {
      this.log.warning(`Could not record the end of a run of ${m.row.name}: ${error}`);
    }
  }

  async start(row: ProcessRow): Promise<void> {
    const m = this.entry(row);

    if (this.isActive(row.id) && m.status.state !== "restarting") throw new Error("The process is already running");

    clearTimeout(m.restartTimer);
    m.restartTimer = undefined;
    m.intentional = false;

    await this.spawn(m);
  }

  private async spawn(m: Managed) {
    const { row } = m;
    const cwd = row.cwd || undefined;

    this.setStatus(m, { state: "starting", exitCode: null, signal: null, restartAt: undefined });

    try {
      // a bare name is looked up on the PATH like a shell would
      const executable = row.executable.includes("/") ? row.executable : (Bun.which(row.executable) ?? row.executable);

      await fs.access(executable, fs.constants.X_OK).catch(() => {
        throw new Error(`The executable "${row.executable}" does not exist or is not executable`);
      });

      if (cwd) {
        const stat = await fs.stat(cwd).catch(() => undefined);

        if (!stat?.isDirectory()) throw new Error(`The working directory "${cwd}" does not exist`);
      }

      const proc = Bun.spawn([executable, ...row.args], {
        cwd,
        env: { ...process.env, TERM: "xterm-256color", ...row.env },
        terminal: {
          cols: m.cols,
          rows: m.rows,
          data: (_terminal, data) => {
            m.log.append(data);

            for (const listener of m.listeners) listener.output(data);
          },
        },
        onExit: (exited, exitCode, signalCode) => this.handleExit(m, exited, exitCode, signalName(signalCode)),
      });

      m.proc = proc;

      const [run] = await db`INSERT INTO public.uk_ewsgit_processorchestrator_runs (process_id) VALUES (${row.id}) RETURNING id`;

      m.runId = run.id;
      this.setStatus(m, { state: "running", pid: proc.pid, startedAt: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.log.warning(`Could not start ${row.name}: ${message}`);
      m.log.append(new TextEncoder().encode(`\r\n\x1b[31m[orchestrator] ${message}\x1b[0m\r\n`));

      for (const listener of m.listeners) listener.output(new TextEncoder().encode(`\r\n\x1b[31m[orchestrator] ${message}\x1b[0m\r\n`));

      this.setStatus(m, { state: "crashed", pid: undefined, startedAt: undefined });
      await db`INSERT INTO public.uk_ewsgit_processorchestrator_runs (process_id, ended_at, reason) VALUES (${row.id}, NOW(), 'spawn-failed')`.catch(() => {});

      throw new Error(message);
    }
  }

  private async handleExit(m: Managed, proc: Bun.Subprocess, exitCode: number | null, signalCode: string | null) {
    // a process which was replaced is not the one this supervisor is tracking any more
    if (m.proc !== proc) return;

    clearTimeout(m.killTimer);
    m.proc = undefined;

    const ranFor = m.status.startedAt ? Date.now() - m.status.startedAt : 0;
    const intentional = m.intentional || this.shuttingDown;
    const failed = (exitCode ?? 0) !== 0 || signalCode !== null;

    this.setStatus(m, { pid: undefined, startedAt: undefined, exitCode, signal: signalCode });

    if (intentional) {
      await this.recordRunEnd(m, "user-stop");
      this.setStatus(m, { state: "stopped" });
      return;
    }

    await this.recordRunEnd(m, failed ? "crashed" : "exited");

    if (ranFor >= STABLE_RUN_MS) m.attempts = 0;

    const { restart_policy: policy, max_restarts: maxRestarts } = m.row;
    const shouldRestart = policy === "always" || (policy === "on-failure" && failed);
    const gaveUp = shouldRestart && m.attempts >= maxRestarts;

    if (shouldRestart && !gaveUp) {
      const delay = Math.min(BACKOFF_MIN_MS * 2 ** m.attempts, BACKOFF_MAX_MS);

      m.attempts++;
      this.setStatus(m, { state: "restarting", restarts: m.status.restarts + 1, restartAt: Date.now() + delay });
      this.notify(m, failed, `It will restart in ${Math.round(delay / 1000)}s (attempt ${m.attempts} of ${maxRestarts}).`, false);

      m.restartTimer = setTimeout(() => {
        m.restartTimer = undefined;
        this.spawn(m).catch(() => this.afterFailedRestart(m));
      }, delay);
      return;
    }

    this.setStatus(m, { state: failed ? "crashed" : "stopped" });
    this.notify(m, failed, gaveUp ? "It was restarted too many times, so it has been left stopped." : "It will not be restarted.", gaveUp);
  }

  /** a restart which could not even spawn counts as another crash and goes through the backoff again */
  private afterFailedRestart(m: Managed) {
    if (m.attempts >= m.row.max_restarts) {
      this.notify(m, true, "It could not be restarted, so it has been left stopped.", true);
      return;
    }

    const delay = Math.min(BACKOFF_MIN_MS * 2 ** m.attempts, BACKOFF_MAX_MS);

    m.attempts++;
    this.setStatus(m, { state: "restarting", restartAt: Date.now() + delay });
    m.restartTimer = setTimeout(() => {
      m.restartTimer = undefined;
      this.spawn(m).catch(() => this.afterFailedRestart(m));
    }, delay);
  }

  private notify(m: Managed, failed: boolean, detail: string, urgent: boolean) {
    if (!m.row.notify_on_crash) return;

    const now = Date.now();

    // an urgent notification, the one about giving up, is always sent
    if (!urgent && now - m.lastNotified < NOTIFY_THROTTLE_MS) return;

    m.lastNotified = now;

    const { exitCode, signal } = m.status;
    const how = signal ? `was killed by ${signal}` : `exited with code ${exitCode ?? 0}`;
    const id = m.row.id;

    instance.sys.users
      .getAdministrators()
      .then((admins) => {
        for (const admin of admins) {
          instance.sys.notifications.send(
            admin.userId,
            APPLICATION_ID,
            urgent ? WorkspacesNotificationPriority.Urgent : failed ? WorkspacesNotificationPriority.Important : WorkspacesNotificationPriority.Normal,
            { title: `${m.row.name} stopped unexpectedly`, body: `It ${how}. ${detail}`, icon: "error" },
            {
              buttons: [
                { id: "view", label: "View output", type: "tonal" },
                { id: "restart", label: "Restart", type: "filled" },
              ],
            },
            {
              onButton: (buttonId) => {
                if (buttonId === "restart") {
                  this.restart(id).catch((error) => this.log.warning(`Restart from a notification failed: ${error}`));
                }

                return { action: { type: "navigate", value: `/app/${APPLICATION_ID}/p/${id}` } };
              },
            },
          );
        }
      })
      .catch((error) => this.log.warning(`Could not notify administrators: ${error}`));
  }

  async stop(id: string): Promise<void> {
    const m = this.managed.get(id);

    if (!m) return;

    m.intentional = true;
    clearTimeout(m.restartTimer);
    m.restartTimer = undefined;
    m.attempts = 0;

    if (!m.proc) {
      // waiting to restart or already ended
      this.setStatus(m, { state: "stopped", restartAt: undefined });
      return;
    }

    const proc = m.proc;

    this.setStatus(m, { state: "stopping" });
    proc.kill("SIGTERM");
    m.killTimer = setTimeout(() => proc.kill("SIGKILL"), STOP_TIMEOUT_MS);

    await proc.exited;
    // handleExit runs from onExit, give it the turn it needs to settle the state
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async restart(id: string, row?: ProcessRow): Promise<void> {
    const current = row ?? this.managed.get(id)?.row;

    if (!current) throw new Error("Unknown process");

    await this.stop(id);
    await this.start(current);
  }

  write(id: string, data: string) {
    this.managed.get(id)?.proc?.terminal?.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    const m = this.managed.get(id);

    if (!m) return;

    m.cols = Math.max(2, Math.min(cols, 500));
    m.rows = Math.max(1, Math.min(rows, 200));
    m.proc?.terminal?.resize(m.cols, m.rows);
  }

  clearLog(id: string) {
    this.managed.get(id)?.log.clear();
  }

  /** stops managing a deleted process */
  async forget(id: string) {
    await this.stop(id);
    this.managed.get(id)?.log.close();
    this.managed.delete(id);
    await fs.rm(this.logFile(id), { force: true });
    await fs.rm(`${this.logFile(id)}.1`, { force: true });
  }

  logPath(id: string) {
    return this.logFile(id);
  }

  async startAutoStart() {
    const rows = (await db`SELECT * FROM public.uk_ewsgit_processorchestrator_processes WHERE auto_start = TRUE`) as ProcessRow[];

    for (const row of rows) {
      this.start(row).catch((error) => this.log.warning(`Auto-start of ${row.name} failed: ${error instanceof Error ? error.message : error}`));
    }
  }

  async shutdown() {
    this.shuttingDown = true;

    await Promise.all([...this.managed.keys()].map((id) => this.stop(id).catch(() => {})));

    for (const m of this.managed.values()) m.log.close();
  }
}
