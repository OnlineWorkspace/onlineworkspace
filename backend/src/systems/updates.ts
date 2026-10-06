import type { Instance } from "../index.ts";
import System from "../system.ts";

export interface UpdateCommit {
  hash: string;
  subject: string;
  author: string;
  date: number;
}

export interface UpdateStatus {
  version: string;
  /** `false` when the instance is not running from a git checkout, so there is nothing to compare */
  isCheckout: boolean;
  branch?: string;
  commit?: UpdateCommit;
  remote?: string;
  /** uncommitted changes in the checkout, an update would have to deal with them */
  hasLocalChanges?: boolean;
  /** commits made here which the remote does not have */
  ahead?: number;
  /** commits the remote has which this checkout does not */
  behind?: number;
  incoming?: UpdateCommit[];
  checkedAt?: number;
  checkError?: string;
}

const GIT_TIMEOUT_MS = 30_000;
const MAX_INCOMING = 50;
const FIELD = "\x1f";

export class UpdatesError extends Error {}

/** Looks at the git checkout the instance runs from and whether its remote has anything newer. Nothing here changes the checkout. */
export default class UpdatesSystem extends System {
  private lastCheck?: Pick<UpdateStatus, "ahead" | "behind" | "incoming" | "checkedAt" | "checkError">;
  private checking?: Promise<void>;

  constructor(instance: Instance) {
    super("updates", instance);
  }

  private async git(args: string[]): Promise<string> {
    const child = Bun.spawn(["git", ...args], {
      cwd: process.cwd(),
      // a fetch must fail rather than wait for someone to type a password or accept a host key
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND ?? "ssh -o BatchMode=yes -o ConnectTimeout=15" },
      stdout: "pipe",
      stderr: "pipe",
      timeout: GIT_TIMEOUT_MS,
      killSignal: "SIGKILL",
    });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);

    if (code !== 0) throw new UpdatesError(stderr.trim().split("\n").slice(-2).join(" ") || `git ${args[0]} failed (${code})`);

    return stdout.trim();
  }

  private parseCommits(output: string): UpdateCommit[] {
    return output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, author, date, ...subject] = line.split(FIELD);

        return { hash, author, date: Number(date) * 1000, subject: subject.join(FIELD) };
      });
  }

  async status(): Promise<UpdateStatus> {
    const status: UpdateStatus = { version: this.instance.versionString, isCheckout: false, ...this.lastCheck };

    if (!Bun.which("git")) return { ...status, checkError: status.checkError ?? "git is not installed on the server" };

    try {
      await this.git(["rev-parse", "--is-inside-work-tree"]);
    } catch {
      return status;
    }

    status.isCheckout = true;

    try {
      status.branch = (await this.git(["rev-parse", "--abbrev-ref", "HEAD"])) || undefined;
      status.commit = this.parseCommits(await this.git(["log", "-1", `--format=%h${FIELD}%an${FIELD}%ct${FIELD}%s`]))[0];
      status.remote = await this.git(["remote", "get-url", "origin"]).catch(() => undefined);
      status.hasLocalChanges = (await this.git(["status", "--porcelain", "--untracked-files=no"])).length > 0;
    } catch (error) {
      status.checkError = status.checkError ?? (error instanceof Error ? error.message : String(error));
    }

    return status;
  }

  /** Asks the remote for what is new, and works out how this checkout compares to its branch there. */
  async check(userId?: number): Promise<UpdateStatus> {
    this.checking ??= this.runCheck(userId).finally(() => {
      this.checking = undefined;
    });
    await this.checking;

    return this.status();
  }

  private async runCheck(userId?: number) {
    const checkedAt = Date.now();

    try {
      if (!Bun.which("git")) throw new UpdatesError("git is not installed on the server");

      const branch = await this.git(["rev-parse", "--abbrev-ref", "HEAD"]);

      if (branch === "HEAD") throw new UpdatesError("The instance is not on a branch, so there is nothing to compare it to");

      await this.git(["fetch", "--quiet", "origin", branch]);

      const upstream = `origin/${branch}`;
      const [ahead, behind] = (await this.git(["rev-list", "--left-right", "--count", `HEAD...${upstream}`])).split(/\s+/).map(Number);
      const incoming = behind > 0 ? this.parseCommits(await this.git(["log", `HEAD..${upstream}`, `--max-count=${MAX_INCOMING}`, `--format=%h${FIELD}%an${FIELD}%ct${FIELD}%s`])) : [];

      this.lastCheck = { ahead, behind, incoming, checkedAt };
      this.instance.sys.audit?.record({ action: "instance.update_checked", actorId: userId, details: { behind, ahead } });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.lastCheck = { checkedAt, checkError: message };
      this.log.warning(`Checking for updates failed: ${message}`);
    }
  }
}
