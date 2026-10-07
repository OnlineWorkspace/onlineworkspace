import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { type RepoProcessEntry, readRepoConfig, resolveExecutable, resolveInside } from "./config.ts";
import { APPLICATION_ID } from "./supervisor.ts";

const CLONE_TIMEOUT_MS = 120_000;
const STEP_TIMEOUT_MS = 10 * 60_000;
const OUTPUT_LIMIT = 64 * 1024;

const URL_PATTERN = /^(https:\/\/[^\s/][^\s]*|ssh:\/\/[^\s/][^\s]*|git@[A-Za-z0-9._-]+:[^\s]+)$/;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/;

export function validateGitUrl(url: string) {
  // a leading "-" would be read by git as an option, "ext::" and "file:" run commands or read local files
  if (!URL_PATTERN.test(url) || url.length > 2048) {
    throw new Error("Use an https://, ssh:// or git@host:path repository URL");
  }
}

export function validateGitRef(ref: string | undefined | null) {
  if (ref && (!REF_PATTERN.test(ref) || ref.includes(".."))) throw new Error("That branch or tag name is not valid");
}

const reposRoot = () => path.join(instance.sys.filesystem.getApplicationCacheDirectory(APPLICATION_ID), "repos");

/** one checkout per repository and ref, shared by the processes which come from it */
export function repoDirectory(url: string, ref: string | null | undefined) {
  return path.join(
    reposRoot(),
    createHash("sha256")
      .update(`${url}\n${ref ?? ""}`)
      .digest("hex")
      .slice(0, 16),
  );
}

const gitEnv = () => ({
  ...process.env,
  GIT_TERMINAL_PROMPT: "0",
  GIT_ASKPASS: "echo",
  GIT_SSH_COMMAND: "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new",
  GIT_PROTOCOL_FROM_USER: "0",
});

// only the network protocols and no credential helper, whatever the server's git configuration says
const GIT_SAFE = ["-c", "protocol.allow=never", "-c", "protocol.https.allow=always", "-c", "protocol.ssh.allow=always", "-c", "credential.helper="];

async function run(cmd: string[], cwd: string | undefined, timeoutMs: number, env: Record<string, string | undefined> = gitEnv()) {
  const proc = Bun.spawn(cmd, { cwd, env, stdout: "pipe", stderr: "pipe", stdin: "ignore" });
  const timer = setTimeout(() => proc.kill("SIGKILL"), timeoutMs);

  const read = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let text = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      if (text.length < OUTPUT_LIMIT) text += decoder.decode(value, { stream: true });
    }

    return text.slice(0, OUTPUT_LIMIT);
  };

  const [stdout, stderr, code] = await Promise.all([read(proc.stdout), read(proc.stderr), proc.exited]);

  clearTimeout(timer);

  return { code, output: (stdout + stderr).trim() };
}

/** clones into a fresh directory and swaps it in, so a failed clone doesn't take the previous one with it */
export async function cloneRepo(url: string, ref: string | null | undefined): Promise<string> {
  validateGitUrl(url);
  validateGitRef(ref);

  const destination = repoDirectory(url, ref);
  const temporary = `${destination}.tmp-${crypto.randomUUID()}`;

  await fs.mkdir(reposRoot(), { recursive: true });

  const args = [...GIT_SAFE, "clone", "--depth", "1", "--no-tags", "--single-branch", ...(ref ? ["--branch", ref] : []), "--", url, temporary];
  const result = await run(["git", ...args], undefined, CLONE_TIMEOUT_MS);

  if (result.code !== 0) {
    await fs.rm(temporary, { recursive: true, force: true });
    throw new Error(`git clone failed: ${result.output.split("\n").slice(-3).join(" ")}`);
  }

  await fs.rm(destination, { recursive: true, force: true });
  await fs.rename(temporary, destination);

  return destination;
}

/** brings an existing checkout up to date, which only ever fast-forwards */
export async function pullRepo(url: string, ref: string | null | undefined): Promise<string> {
  validateGitUrl(url);
  validateGitRef(ref);

  const directory = repoDirectory(url, ref);

  if (!(await fs.stat(directory).catch(() => undefined))?.isDirectory()) return cloneRepo(url, ref);

  const result = await run(["git", ...GIT_SAFE, "pull", "--ff-only", "--depth", "1", "--no-tags"], directory, CLONE_TIMEOUT_MS);

  if (result.code !== 0) throw new Error(`git pull failed: ${result.output.split("\n").slice(-3).join(" ")}`);

  return directory;
}

export interface ResolvedRepoProcess {
  name: string;
  executable: string;
  args: string[];
  env: Record<string, string>;
  cwd: string;
  autoStart: boolean;
  restartPolicy: RepoProcessEntry["restartPolicy"];
  maxRestarts: number;
  notifyOnCrash: boolean;
  install: string[];
  build: string[];
}

/** the processes of a checkout with their paths made absolute, and refused if they leave the repository */
export async function loadRepoProcesses(url: string, ref: string | null | undefined, subdir: string | null | undefined): Promise<ResolvedRepoProcess[]> {
  const root = repoDirectory(url, ref);
  const { config, directory } = await readRepoConfig(root, subdir);
  const resolved: ResolvedRepoProcess[] = [];

  for (const entry of config.processes) {
    const cwd = await resolveInside(root, path.relative(await fs.realpath(root), path.resolve(directory, entry.cwd)));

    resolved.push({
      name: entry.name,
      executable: await resolveExecutable(directory, root, entry.executable),
      args: entry.args,
      env: entry.env,
      cwd,
      autoStart: entry.autoStart,
      restartPolicy: entry.restartPolicy,
      maxRestarts: entry.maxRestarts,
      notifyOnCrash: entry.notifyOnCrash,
      install: entry.install,
      build: entry.build,
    });
  }

  return resolved;
}

/** runs the install and build commands of an entry, each through a shell inside the entry's directory */
export async function runSteps(entry: ResolvedRepoProcess): Promise<{ command: string; code: number; output: string }[]> {
  const results = [];

  for (const command of [...entry.install, ...entry.build]) {
    const result = await run(["sh", "-c", command], entry.cwd, STEP_TIMEOUT_MS, { ...process.env, ...entry.env });

    results.push({ command, code: result.code, output: result.output.slice(-4000) });

    if (result.code !== 0) break;
  }

  return results;
}

export async function removeRepoIfUnused(url: string, ref: string | null | undefined) {
  await fs.rm(repoDirectory(url, ref), { recursive: true, force: true });
}
