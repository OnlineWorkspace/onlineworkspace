/// <reference path="./global.d.ts" />

import { InstanceStatus } from "@onlineworkspace/workspace-backend/src/index.ts";
import { WorkspacesEvent } from "@onlineworkspace/workspace-backend/src/systems/events.ts";
import { adminProcedure, type createOnlineWorkspaceTRPCContext } from "@onlineworkspace/workspace-backend/src/systems/trpc/coreRouter.ts";
import { initTRPC, TRPCError } from "@trpc/server";
import z from "zod";
import { restartPolicySchema } from "./lib/config.ts";
import { db, ensureSchema, type ProcessRow, type RunRow } from "./lib/db.ts";
import {
  cloneRepo,
  loadRepoProcesses,
  pullRepo,
  type ResolvedRepoProcess,
  removeRepoIfUnused,
  runSteps,
  validateGitRef,
  validateGitUrl,
} from "./lib/gitSource.ts";
import Supervisor, { APPLICATION_ID } from "./lib/supervisor.ts";
import { createTerminalHandler, TERMINAL_KIND } from "./lib/terminalSocket.ts";

const log = instance.log.createLogger(APPLICATION_ID);

export const t = initTRPC.context<ReturnType<typeof createOnlineWorkspaceTRPCContext>>().create();

const LOG_TAIL_BYTES = 512 * 1024;

await ensureSchema();

const supervisor = new Supervisor();

// jsonb comes back parsed or as text depending on the driver
const asJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return (value ?? fallback) as T;
};

const toProcess = (row: ProcessRow) => ({
  id: row.id,
  name: row.name,
  executable: row.executable,
  args: asJson<string[]>(row.args, []),
  env: asJson<Record<string, string>>(row.env, {}),
  cwd: row.cwd,
  autoStart: row.auto_start,
  restartPolicy: row.restart_policy,
  maxRestarts: row.max_restarts,
  notifyOnCrash: row.notify_on_crash,
  source: row.source,
  gitUrl: row.git_url,
  gitRef: row.git_ref,
  gitSubdir: row.git_subdir,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: supervisor.status(row.id),
});

const normalise = (row: ProcessRow): ProcessRow => ({ ...row, args: asJson(row.args, []), env: asJson(row.env, {}) });

async function getRow(id: string): Promise<ProcessRow> {
  const [row] = (await db`SELECT * FROM public.uk_ewsgit_processorchestrator_processes WHERE id = ${id}`) as ProcessRow[];

  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "That process does not exist" });

  return normalise(row);
}

const envKey = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Use letters, digits and underscores, not starting with a digit");

const processInput = z.object({
  name: z.string().trim().min(1).max(100),
  executable: z.string().trim().min(1).max(4096),
  args: z.array(z.string().max(8192)).max(200),
  env: z.record(envKey, z.string().max(32768)),
  cwd: z.string().trim().max(4096).nullable(),
  autoStart: z.boolean(),
  restartPolicy: restartPolicySchema,
  maxRestarts: z.number().int().min(0).max(100),
  notifyOnCrash: z.boolean(),
});

const gitInput = z.object({
  url: z.string().trim().min(1).max(2048),
  ref: z.string().trim().max(200).nullish(),
  subdir: z.string().trim().max(1024).nullish(),
});

const failure = (error: unknown): never => {
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : String(error) });
};

const describeChanges = (existing: ProcessRow, entry: ResolvedRepoProcess): string[] => {
  const changes: string[] = [];
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

  if (existing.executable !== entry.executable) changes.push("executable");
  if (!same(asJson(existing.args, []), entry.args)) changes.push("arguments");
  if (!same(asJson(existing.env, {}), entry.env)) changes.push("environment");
  if ((existing.cwd ?? "") !== entry.cwd) changes.push("working directory");
  if (existing.auto_start !== entry.autoStart) changes.push("auto-start");
  if (existing.restart_policy !== entry.restartPolicy || existing.max_restarts !== entry.maxRestarts) changes.push("restart policy");
  if (existing.notify_on_crash !== entry.notifyOnCrash) changes.push("notifications");

  return changes;
};

const router = t.router({
  list: adminProcedure.query(async () => {
    const rows = (await db`SELECT * FROM public.uk_ewsgit_processorchestrator_processes ORDER BY name`) as ProcessRow[];

    return rows.map((row) => toProcess(normalise(row)));
  }),

  get: adminProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => toProcess(await getRow(input.id))),

  create: adminProcedure.input(processInput).mutation(async ({ input, ctx }) => {
    const id = crypto.randomUUID();

    await db`INSERT INTO public.uk_ewsgit_processorchestrator_processes
      (id, name, executable, args, env, cwd, auto_start, restart_policy, max_restarts, notify_on_crash, created_by)
      VALUES (${id}, ${input.name}, ${input.executable}, ${JSON.stringify(input.args)}::jsonb, ${JSON.stringify(input.env)}::jsonb, ${input.cwd || null},
        ${input.autoStart}, ${input.restartPolicy}, ${input.maxRestarts}, ${input.notifyOnCrash}, ${ctx.userId})`;

    const row = await getRow(id);

    supervisor.register(row);
    ctx.audit({ action: "processorchestrator.create", outcome: "success", target: `${input.name} (${input.executable})` });

    return toProcess(row);
  }),

  update: adminProcedure.input(processInput.extend({ id: z.uuid() })).mutation(async ({ input, ctx }) => {
    await getRow(input.id);
    await db`UPDATE public.uk_ewsgit_processorchestrator_processes SET
      name = ${input.name}, executable = ${input.executable}, args = ${JSON.stringify(input.args)}::jsonb, env = ${JSON.stringify(input.env)}::jsonb,
      cwd = ${input.cwd || null}, auto_start = ${input.autoStart}, restart_policy = ${input.restartPolicy}, max_restarts = ${input.maxRestarts},
      notify_on_crash = ${input.notifyOnCrash}, updated_at = NOW()
      WHERE id = ${input.id}`;

    const row = await getRow(input.id);

    supervisor.register(row);
    ctx.audit({ action: "processorchestrator.update", outcome: "success", target: input.name });

    return toProcess(row);
  }),

  delete: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input, ctx }) => {
    const row = await getRow(input.id);

    await supervisor.forget(input.id);
    await db`DELETE FROM public.uk_ewsgit_processorchestrator_processes WHERE id = ${input.id}`;

    // the checkout goes with the last process which came from it
    if (row.source === "git" && row.git_url) {
      const [remaining] =
        await db`SELECT COUNT(*)::int AS count FROM public.uk_ewsgit_processorchestrator_processes WHERE git_url = ${row.git_url} AND git_ref IS NOT DISTINCT FROM ${row.git_ref}`;

      if (remaining.count === 0) await removeRepoIfUnused(row.git_url, row.git_ref);
    }

    ctx.audit({ action: "processorchestrator.delete", outcome: "success", target: row.name });

    return { ok: true };
  }),

  start: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input, ctx }) => {
    const row = await getRow(input.id);

    await supervisor.start(row).catch(failure);
    ctx.audit({ action: "processorchestrator.start", outcome: "success", target: row.name });

    return toProcess(row);
  }),

  stop: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input, ctx }) => {
    const row = await getRow(input.id);

    await supervisor.stop(input.id);
    ctx.audit({ action: "processorchestrator.stop", outcome: "success", target: row.name });

    return toProcess(row);
  }),

  restart: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input, ctx }) => {
    const row = await getRow(input.id);

    await supervisor.restart(input.id, row).catch(failure);
    ctx.audit({ action: "processorchestrator.restart", outcome: "success", target: row.name });

    return toProcess(row);
  }),

  runs: adminProcedure.input(z.object({ id: z.uuid().optional(), limit: z.number().int().min(1).max(200).default(50) })).query(async ({ input }) => {
    const rows = (
      input.id
        ? await db`SELECT r.*, p.name FROM public.uk_ewsgit_processorchestrator_runs r JOIN public.uk_ewsgit_processorchestrator_processes p ON p.id = r.process_id WHERE r.process_id = ${input.id} ORDER BY r.started_at DESC LIMIT ${input.limit}`
        : await db`SELECT r.*, p.name FROM public.uk_ewsgit_processorchestrator_runs r JOIN public.uk_ewsgit_processorchestrator_processes p ON p.id = r.process_id ORDER BY r.started_at DESC LIMIT ${input.limit}`
    ) as (RunRow & { name: string })[];

    return rows.map((r) => ({
      id: r.id,
      processId: r.process_id,
      processName: r.name,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      exitCode: r.exit_code,
      signal: r.signal,
      reason: r.reason,
    }));
  }),

  /** the recent output as text, for downloading */
  logTail: adminProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    await getRow(input.id);

    const bytes = supervisor.replay(input.id);

    return new TextDecoder().decode(bytes.length > LOG_TAIL_BYTES ? bytes.slice(bytes.length - LOG_TAIL_BYTES) : bytes);
  }),

  clearLog: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    await getRow(input.id);
    supervisor.clearLog(input.id);

    return { ok: true };
  }),

  /** clones a repository and reads what it would add, nothing is run or saved */
  previewGit: adminProcedure.input(gitInput).mutation(async ({ input }) => {
    try {
      validateGitUrl(input.url);
      validateGitRef(input.ref);
      await cloneRepo(input.url, input.ref);

      const entries = await loadRepoProcesses(input.url, input.ref, input.subdir);
      const existing =
        (await db`SELECT name FROM public.uk_ewsgit_processorchestrator_processes WHERE git_url = ${input.url} AND git_ref IS NOT DISTINCT FROM ${input.ref ?? null} AND git_subdir IS NOT DISTINCT FROM ${input.subdir || null}`) as {
          name: string;
        }[];
      const taken = new Set(existing.map((r) => r.name));

      return entries.map((entry) => ({
        name: entry.name,
        executable: entry.executable,
        args: entry.args,
        env: entry.env,
        cwd: entry.cwd,
        autoStart: entry.autoStart,
        restartPolicy: entry.restartPolicy,
        steps: [...entry.install, ...entry.build],
        alreadyImported: taken.has(entry.name),
      }));
    } catch (error) {
      return failure(error);
    }
  }),

  /** adds the chosen processes from the checkout previewGit made, reading the configuration again rather than trusting the browser */
  importGit: adminProcedure.input(gitInput.extend({ names: z.array(z.string()).min(1).max(50) })).mutation(async ({ input, ctx }) => {
    try {
      validateGitUrl(input.url);
      validateGitRef(input.ref);

      const entries = (await loadRepoProcesses(input.url, input.ref, input.subdir)).filter((entry) => input.names.includes(entry.name));

      if (entries.length === 0) throw new Error("None of the chosen processes are in the repository");

      const steps = [];

      // install and build commands run once per import, the person importing has seen them listed
      for (const entry of entries) {
        const results = await runSteps(entry);

        steps.push(...results.map((r) => ({ process: entry.name, ...r })));

        const failed = results.find((r) => r.code !== 0);

        if (failed) throw new Error(`"${failed.command}" failed for ${entry.name}:\n${failed.output}`);
      }

      const created: string[] = [];

      for (const entry of entries) {
        const id = crypto.randomUUID();

        await db`INSERT INTO public.uk_ewsgit_processorchestrator_processes
          (id, name, executable, args, env, cwd, auto_start, restart_policy, max_restarts, notify_on_crash, source, git_url, git_ref, git_subdir, created_by)
          VALUES (${id}, ${entry.name}, ${entry.executable}, ${JSON.stringify(entry.args)}::jsonb, ${JSON.stringify(entry.env)}::jsonb, ${entry.cwd},
            ${entry.autoStart}, ${entry.restartPolicy}, ${entry.maxRestarts}, ${entry.notifyOnCrash}, 'git', ${input.url}, ${input.ref ?? null}, ${input.subdir || null}, ${ctx.userId})`;

        supervisor.register(await getRow(id));
        created.push(entry.name);
      }

      ctx.audit({ action: "processorchestrator.importGit", outcome: "success", target: `${input.url}: ${created.join(", ")}` });

      return { created, steps };
    } catch (error) {
      return failure(error);
    }
  }),

  /** pulls the repository a process came from and reports what would change, nothing is applied */
  checkGitUpdate: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    const row = await getRow(input.id);

    if (row.source !== "git" || !row.git_url) throw new TRPCError({ code: "BAD_REQUEST", message: "That process did not come from a repository" });

    try {
      await pullRepo(row.git_url, row.git_ref);

      const entries = await loadRepoProcesses(row.git_url, row.git_ref, row.git_subdir);
      const siblings = (
        (await db`SELECT * FROM public.uk_ewsgit_processorchestrator_processes WHERE git_url = ${row.git_url} AND git_ref IS NOT DISTINCT FROM ${row.git_ref} AND git_subdir IS NOT DISTINCT FROM ${row.git_subdir}`) as ProcessRow[]
      ).map(normalise);
      const byName = new Map(siblings.map((s) => [s.name, s]));

      return {
        entries: entries.map((entry) => {
          const existing = byName.get(entry.name);

          return {
            name: entry.name,
            status: !existing ? ("new" as const) : describeChanges(existing, entry).length ? ("changed" as const) : ("unchanged" as const),
            changes: existing ? describeChanges(existing, entry) : [],
            steps: [...entry.install, ...entry.build],
          };
        }),
        removed: siblings.filter((s) => !entries.some((e) => e.name === s.name)).map((s) => s.name),
      };
    } catch (error) {
      return failure(error);
    }
  }),

  /** applies the configuration from the checkout to the processes which came from it, running processes keep going until restarted */
  applyGitUpdate: adminProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input, ctx }) => {
    const row = await getRow(input.id);

    if (row.source !== "git" || !row.git_url) throw new TRPCError({ code: "BAD_REQUEST", message: "That process did not come from a repository" });

    try {
      const entries = await loadRepoProcesses(row.git_url, row.git_ref, row.git_subdir);
      const steps = [];
      const updated: string[] = [];

      for (const entry of entries) {
        const [existing] =
          (await db`SELECT * FROM public.uk_ewsgit_processorchestrator_processes WHERE name = ${entry.name} AND git_url = ${row.git_url} AND git_ref IS NOT DISTINCT FROM ${row.git_ref} AND git_subdir IS NOT DISTINCT FROM ${row.git_subdir}`) as ProcessRow[];

        if (!existing) continue;

        const results = await runSteps(entry);

        steps.push(...results.map((r) => ({ process: entry.name, ...r })));

        const failed = results.find((r) => r.code !== 0);

        if (failed) throw new Error(`"${failed.command}" failed for ${entry.name}:\n${failed.output}`);

        await db`UPDATE public.uk_ewsgit_processorchestrator_processes SET
          executable = ${entry.executable}, args = ${JSON.stringify(entry.args)}::jsonb, env = ${JSON.stringify(entry.env)}::jsonb, cwd = ${entry.cwd},
          auto_start = ${entry.autoStart}, restart_policy = ${entry.restartPolicy}, max_restarts = ${entry.maxRestarts}, notify_on_crash = ${entry.notifyOnCrash}, updated_at = NOW()
          WHERE id = ${existing.id}`;

        supervisor.register(await getRow(existing.id));
        updated.push(entry.name);
      }

      ctx.audit({ action: "processorchestrator.applyGitUpdate", outcome: "success", target: `${row.git_url}: ${updated.join(", ")}` });

      return { updated, steps };
    } catch (error) {
      return failure(error);
    }
  }),

  /** the manual processes as a processorchestrator.json, to put in a repository */
  exportConfig: adminProcedure.query(async () => {
    const rows = ((await db`SELECT * FROM public.uk_ewsgit_processorchestrator_processes WHERE source = 'manual' ORDER BY name`) as ProcessRow[]).map(
      normalise,
    );

    return JSON.stringify(
      {
        version: 1,
        processes: rows.map((r) => ({
          name: r.name,
          executable: r.executable,
          args: r.args,
          env: r.env,
          cwd: r.cwd ?? ".",
          autoStart: r.auto_start,
          restartPolicy: r.restart_policy,
          maxRestarts: r.max_restarts,
          notifyOnCrash: r.notify_on_crash,
        })),
      },
      null,
      2,
    );
  }),
});

export type TRPCRouter = typeof router;

await instance.sys.tRPC.registerTRPCRouter(router, `/api/app/${APPLICATION_ID}`);

instance.sys.api.registerWebsocket({
  kind: TERMINAL_KIND,
  pattern: new URLPattern({ pathname: `/api/app/${APPLICATION_ID}/ws/:id` }),
  adminOnly: true,
  handler: createTerminalHandler(supervisor),
  data: (userId, params) => ({ userId, processId: params.id }),
});

const startAutoStart = () => supervisor.startAutoStart().catch((error) => log.warning(`Could not start the auto-start processes: ${error}`));

// installed or enabled while the instance is already running, otherwise wait for it to finish starting
if (instance.status === InstanceStatus.Online) startAutoStart();
else instance.sys.event.on(WorkspacesEvent.StartupComplete, startAutoStart);

instance.sys.event.on(WorkspacesEvent.BeforeShutdown, () => {
  supervisor.shutdown().catch((error) => log.warning(`Could not stop the processes cleanly: ${error}`));
});
