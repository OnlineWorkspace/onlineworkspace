import type { Server } from "bun";

/** strips the port from an address as the reverse proxy reports it, `1.2.3.4:5678`, `[::1]:5678` or a bare `::1` */
export const stripPort = (address: string): string => {
  const trimmed = address.trim();
  const bracketed = trimmed.match(/^\[(.+)\](?::\d+)?$/);

  if (bracketed) return bracketed[1];

  // more than one colon is an IPv6 address which has no port
  return trimmed.split(":").length === 2 ? trimmed.split(":")[0] : trimmed;
};

/**
 * The address of whoever made the request. The reverse proxy sets `X-Real-IP` itself, replacing anything the client sent,
 * so it is only trustworthy while the backend can only be reached through the proxy.
 */
export const clientIp = (req: Request, server?: Server<any>): string => {
  const forwarded = req.headers.get("x-real-ip");

  if (forwarded) return stripPort(forwarded);

  const direct = server?.requestIP(req)?.address;

  return direct ? stripPort(direct) : "unknown";
};

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

/** @returns true if the request came from the machine the backend runs on, and was addressed to it as localhost */
export const isLocalRequest = (req: Request, server?: Server<any>): boolean => {
  const ip = clientIp(req, server);
  const host = stripPort(req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();

  return (ip === "::1" || ip === "::ffff:127.0.0.1" || ip.startsWith("127.")) && LOOPBACK_HOSTNAMES.has(host);
};
