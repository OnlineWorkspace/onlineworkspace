import type { Server } from "bun";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { clientIp } from "../utils/network.ts";

interface RateLimitRule {
  /** the name of the limit, requests are counted per client address for each one */
  name: string;
  limit: number;
  windowMs: number;
}

const MINUTE = 60 * 1000;

/** requests to the setup and sign in procedures, these are the ones worth guessing at */
const PROCEDURE_RULES: Record<string, RateLimitRule> = {
  "authorization.passwordSignin": { name: "sign-in", limit: 20, windowMs: 10 * MINUTE },
  "authorization.passkeyRequestSignIn": { name: "sign-in", limit: 20, windowMs: 10 * MINUTE },
  "authorization.passkeyCompleteSignIn": { name: "sign-in", limit: 20, windowMs: 10 * MINUTE },
  "authorization.passwordResetRequest": { name: "password-reset-request", limit: 5, windowMs: 15 * MINUTE },
  "authorization.passwordResetComplete": { name: "password-reset", limit: 10, windowMs: 15 * MINUTE },
  "authorization.signup": { name: "signup", limit: 5, windowMs: 60 * MINUTE },
  "authorization.checkEmailAddressOwnership": { name: "email-code", limit: 5, windowMs: 60 * MINUTE },
  "authorization.validateEmailCode": { name: "email-code-check", limit: 30, windowMs: 15 * MINUTE },
  "authorization.isUsernameValid": { name: "username-check", limit: 120, windowMs: MINUTE },
  "userSelect.signInRequirements": { name: "sign-in-requirements", limit: 60, windowMs: MINUTE },
  "userSelect.getProfiles": { name: "profiles", limit: 60, windowMs: MINUTE },
  "setup.verifyToken": { name: "setup-token", limit: 10, windowMs: 10 * MINUTE },
};

const SETUP_RULE: RateLimitRule = { name: "setup", limit: 120, windowMs: MINUTE };
const GENERAL_RULE: RateLimitRule = { name: "general", limit: 1500, windowMs: MINUTE };

export interface RateLimitResult {
  allowed: boolean;
  /** seconds until the client can try again */
  retryAfter: number;
}

/** Rate limits, the origin check and the security headers, everything which protects the instance from being abused once it is public. */
export default class SecuritySystem extends System {
  private counters = new Map<string, { count: number; resetsAt: number }>();
  private cleanup?: ReturnType<typeof setInterval>;
  private warned = new Map<string, number>();

  constructor(instance: Instance) {
    super("security", instance);
  }

  override async startup(): Promise<boolean> {
    if (this.instance.sys.configuration.isDevMode) {
      this.log.warning("Development mode is on: the web frontend is served by the development server, without a content security policy. Turn isDevMode off in the configuration before this instance is used publicly.");
    }

    this.cleanup = setInterval(() => {
      const now = Date.now();

      for (const [key, counter] of this.counters) if (counter.resetsAt <= now) this.counters.delete(key);
      for (const [key, at] of this.warned) if (at <= now) this.warned.delete(key);
    }, MINUTE);
    this.cleanup.unref?.();

    return true;
  }

  override stop(): boolean {
    if (this.cleanup) clearInterval(this.cleanup);

    return true;
  }

  /** Counts a request against a limit, `key` is what is being limited (an address, usually). */
  hit(key: string, rule: Pick<RateLimitRule, "limit" | "windowMs">): RateLimitResult {
    const now = Date.now();
    const counter = this.counters.get(key);

    if (!counter || counter.resetsAt <= now) {
      this.counters.set(key, { count: 1, resetsAt: now + rule.windowMs });

      return { allowed: true, retryAfter: 0 };
    }

    counter.count++;

    return { allowed: counter.count <= rule.limit, retryAfter: Math.max(1, Math.ceil((counter.resetsAt - now) / 1000)) };
  }

  /** the procedures a tRPC request is calling, batched requests call several at once */
  private proceduresOf(url: URL): string[] {
    const trpcIndex = url.pathname.indexOf("/api/trpc/");

    if (trpcIndex === -1) return [];

    return decodeURIComponent(url.pathname.slice(trpcIndex + "/api/trpc/".length)).split(",").filter(Boolean);
  }

  /** @returns a response to answer with when the request is over a limit, nothing when it can carry on */
  rateLimit(req: Request, server?: Server<any>): Response | undefined {
    const ip = clientIp(req, server);
    const url = new URL(req.url);
    const rules = new Map<string, RateLimitRule>([[GENERAL_RULE.name, GENERAL_RULE]]);

    for (const procedure of this.proceduresOf(url)) {
      const rule = PROCEDURE_RULES[procedure] ?? (procedure.startsWith("setup.") ? SETUP_RULE : undefined);

      if (rule) rules.set(rule.name, rule);
    }

    for (const rule of rules.values()) {
      const result = this.hit(`${rule.name}:${ip}`, rule);

      if (result.allowed) continue;

      const warnKey = `${rule.name}:${ip}`;

      if (!this.warned.has(warnKey)) {
        this.warned.set(warnKey, Date.now() + rule.windowMs);
        this.log.warning(`${ip} went over the '${rule.name}' rate limit`);
      }

      return this.tooManyRequests(req, url, result.retryAfter);
    }

    return undefined;
  }

  private tooManyRequests(req: Request, url: URL, retryAfter: number): Response {
    const message = "Too many requests, please wait a while and try again";
    const headers = { "Retry-After": String(retryAfter), "Cache-Control": "no-store" };

    if (url.pathname.startsWith("/api/trpc/") || this.proceduresOf(url).length > 0) {
      const error = { error: { message, code: -32029, data: { code: "TOO_MANY_REQUESTS", httpStatus: 429, path: this.proceduresOf(url)[0] } } };
      const batch = url.searchParams.has("batch");
      const body = batch ? this.proceduresOf(url).map(() => error) : error;

      return Response.json(body, { status: 429, headers });
    }

    return Response.json({ code: "TOO_MANY_REQUESTS", message }, { status: 429, headers });
  }

  /**
   * Requests which change something must come from the instance's own pages. Browsers say where a request came from,
   * and a request which was made by another site is refused, which stops cross-site request forgery even if a cookie were sent.
   */
  originCheck(req: Request): Response | undefined {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return undefined;

    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");

    if (origin && origin !== "null") {
      try {
        if (new URL(origin).host === host) return undefined;
      } catch {
        // an origin which is not a URL is refused below
      }

      this.log.warning(`Refused a ${req.method} request from the origin '${origin}'`);
      return Response.json({ code: "FORBIDDEN", message: "Cross-site requests are not allowed" }, { status: 403 });
    }

    if (origin === "null") return Response.json({ code: "FORBIDDEN", message: "Cross-site requests are not allowed" }, { status: 403 });

    const site = req.headers.get("sec-fetch-site");

    if (site && site !== "same-origin" && site !== "none") {
      return Response.json({ code: "FORBIDDEN", message: "Cross-site requests are not allowed" }, { status: 403 });
    }

    // not a browser, so there are no ambient cookies to forge a request with
    return undefined;
  }

  /** the origin pages of this instance are served from */
  get origin() {
    return this.instance.sys.api.getProxyBasePath();
  }

  /** The policy for the pages themselves. The development server needs scripts it can inline and evaluate, so it is only applied to a build. */
  contentSecurityPolicy(): string | undefined {
    const configuration = this.instance.sys.configuration;

    if (configuration.isDevMode) return undefined;

    const host = configuration.proxy.hostname;

    return [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self' data:",
      `connect-src 'self' wss://${host} ws://${host}`,
      "worker-src 'self' blob:",
      "frame-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");
  }

  /** the headers every response gets, a header a route set itself is never replaced */
  headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "same-origin",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    };

    if (this.instance.sys.configuration.proxy.secure) headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

    return headers;
  }

  /** Files people uploaded are served from the same origin as the application, so a page in one must never be able to run as it. */
  isUserContent(url: URL) {
    return url.pathname.startsWith("/api/asset/");
  }

  applyHeaders(req: Request, res: Response): Response {
    const url = new URL(req.url);
    const additions = new Headers();

    for (const [name, value] of Object.entries(this.headers())) additions.set(name, value);

    if (url.pathname.startsWith("/api/trpc/") || /\/api\/app\//.test(url.pathname)) additions.set("Cache-Control", "no-store");

    if (this.isUserContent(url)) additions.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; media-src 'self'; sandbox");

    let target = res;

    // responses from fetch() have immutable headers
    try {
      for (const [name, value] of additions) if (!target.headers.has(name)) target.headers.set(name, value);
    } catch {
      target = new Response(res.body, res);

      for (const [name, value] of additions) if (!target.headers.has(name)) target.headers.set(name, value);
    }

    return target;
  }
}
