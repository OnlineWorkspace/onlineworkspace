import fs from "node:fs/promises";
import path from "node:path";
import z from "zod";

export const CONFIG_FILE = "processorchestrator.json";
const MAX_CONFIG_BYTES = 256 * 1024;

export const restartPolicySchema = z.enum(["never", "on-failure", "always"]);

const entrySchema = z.object({
  name: z.string().trim().min(1).max(100),
  executable: z.string().min(1).max(4096),
  args: z.array(z.string().max(8192)).max(200).default([]),
  env: z.record(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/), z.string().max(32768)).default({}),
  cwd: z.string().max(4096).default("."),
  autoStart: z.boolean().default(false),
  restartPolicy: restartPolicySchema.default("never"),
  maxRestarts: z.number().int().min(0).max(100).default(5),
  notifyOnCrash: z.boolean().default(true),
  install: z.array(z.string().max(4096)).max(20).default([]),
  build: z.array(z.string().max(4096)).max(20).default([]),
});

export const repoConfigSchema = z.object({
  version: z.literal(1),
  processes: z.array(entrySchema).min(1).max(50),
});

export type RepoProcessEntry = z.infer<typeof entrySchema>;
export type RepoConfig = z.infer<typeof repoConfigSchema>;

/**
 * Resolves a path from a repository's configuration against the repository, refusing anything which ends up outside it.
 * Symlinks are resolved first, so a link in the repository can not point out of it.
 */
export async function resolveInside(root: string, relative: string): Promise<string> {
  const realRoot = await fs.realpath(root);
  const target = path.resolve(realRoot, relative);

  if (target !== realRoot && !target.startsWith(realRoot + path.sep)) {
    throw new Error(`"${relative}" is outside the repository`);
  }

  // a path which doesn't exist yet can't be a link, check the deepest part which does
  let existing = target;

  while (true) {
    try {
      const real = await fs.realpath(existing);

      if (real !== realRoot && !real.startsWith(realRoot + path.sep)) throw new Error(`"${relative}" leads outside the repository`);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;

      const parent = path.dirname(existing);

      if (parent === existing) break;
      existing = parent;
    }
  }

  return target;
}

/** reads and validates processorchestrator.json from a directory of a repository */
export async function readRepoConfig(repoRoot: string, subdir: string | null | undefined): Promise<{ config: RepoConfig; directory: string }> {
  const directory = await resolveInside(repoRoot, subdir || ".");
  const file = path.join(directory, CONFIG_FILE);
  const stat = await fs.stat(file).catch(() => undefined);

  if (!stat?.isFile()) throw new Error(`The repository has no ${CONFIG_FILE}${subdir ? ` in ${subdir}` : " in its root"}`);
  if (stat.size > MAX_CONFIG_BYTES) throw new Error(`${CONFIG_FILE} is too large`);

  // the file itself can be a link, make sure it stays inside
  await resolveInside(repoRoot, path.relative(await fs.realpath(repoRoot), file));

  let json: unknown;

  try {
    json = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    throw new Error(`${CONFIG_FILE} is not valid JSON`);
  }

  const parsed = repoConfigSchema.safeParse(json);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    throw new Error(`${CONFIG_FILE} is invalid at ${issue.path.join(".") || "the top level"}: ${issue.message}`);
  }

  const names = new Set<string>();

  for (const entry of parsed.data.processes) {
    if (names.has(entry.name)) throw new Error(`${CONFIG_FILE} has two processes called "${entry.name}"`);
    names.add(entry.name);
  }

  return { config: parsed.data, directory };
}

/** the executable of a repository entry: a path with a slash belongs to the repository, a bare name is looked up on the PATH when started */
export async function resolveExecutable(directory: string, repoRoot: string, executable: string): Promise<string> {
  if (!executable.includes("/")) return executable;

  return resolveInside(repoRoot, path.relative(await fs.realpath(repoRoot), path.resolve(directory, executable)));
}
