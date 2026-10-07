export const db = instance.sys.database.postgres();

export type RestartPolicy = "never" | "on-failure" | "always";
export type ProcessSource = "manual" | "git";

export interface ProcessRow {
  id: string;
  name: string;
  executable: string;
  args: string[];
  env: Record<string, string>;
  cwd: string | null;
  auto_start: boolean;
  restart_policy: RestartPolicy;
  max_restarts: number;
  notify_on_crash: boolean;
  source: ProcessSource;
  git_url: string | null;
  git_ref: string | null;
  git_subdir: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface RunRow {
  id: number;
  process_id: string;
  started_at: Date;
  ended_at: Date | null;
  exit_code: number | null;
  signal: string | null;
  reason: "user-stop" | "exited" | "crashed" | "spawn-failed" | null;
}

/** Creates the tables the application needs. Safe to run on every start. */
export async function ensureSchema() {
  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_processorchestrator_processes (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    executable TEXT NOT NULL,
    args JSONB NOT NULL DEFAULT '[]',
    env JSONB NOT NULL DEFAULT '{}',
    cwd TEXT,
    auto_start BOOLEAN NOT NULL DEFAULT FALSE,
    restart_policy TEXT NOT NULL DEFAULT 'never',
    max_restarts INTEGER NOT NULL DEFAULT 5,
    notify_on_crash BOOLEAN NOT NULL DEFAULT TRUE,
    source TEXT NOT NULL DEFAULT 'manual',
    git_url TEXT,
    git_ref TEXT,
    git_subdir TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_processorchestrator_runs (
    id SERIAL PRIMARY KEY,
    process_id UUID NOT NULL REFERENCES public.uk_ewsgit_processorchestrator_processes(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    exit_code INTEGER,
    signal TEXT,
    reason TEXT
  )`;

  await db`CREATE INDEX IF NOT EXISTS uk_ewsgit_processorchestrator_runs_process ON public.uk_ewsgit_processorchestrator_runs (process_id, started_at DESC)`;
}
