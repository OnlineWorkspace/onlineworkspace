export interface Cookie {
  name: string;
  value: string;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export function getCookies(headers: Headers): Record<string, string> {
  const cookieHeader = headers.get("cookie") || headers.get("Cookie");
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const cookie of cookieHeader.split(";")) {
    const item = cookie.trim();
    if (!item) continue;
    const eqIdx = item.indexOf("=");
    if (eqIdx !== -1) {
      const key = item.substring(0, eqIdx).trim();
      const val = item.substring(eqIdx + 1).trim();
      cookies[key] = val;
    }
  }
  return cookies;
}

export function setCookie(headers: Headers, cookie: Cookie): void {
  let cookieStr = `${cookie.name}=${cookie.value}`;
  if (cookie.path) cookieStr += `; Path=${cookie.path}`;
  if (cookie.domain) cookieStr += `; Domain=${cookie.domain}`;
  if (cookie.expires) cookieStr += `; Expires=${cookie.expires.toUTCString()}`;
  if (cookie.maxAge !== undefined) cookieStr += `; Max-Age=${cookie.maxAge}`;
  if (cookie.secure) cookieStr += `; Secure`;
  if (cookie.httpOnly) cookieStr += `; HttpOnly`;
  if (cookie.sameSite) cookieStr += `; SameSite=${cookie.sameSite}`;
  headers.append("Set-Cookie", cookieStr);
}

export function deleteCookie(
  headers: Headers,
  name: string,
  attributes?: { path?: string; domain?: string },
): void {
  setCookie(headers, {
    name,
    value: "",
    expires: new Date(0),
    path: attributes?.path,
    domain: attributes?.domain,
  });
}
