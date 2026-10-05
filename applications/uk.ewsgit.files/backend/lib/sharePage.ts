const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

const formatBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
};

// nothing on these pages may be embedded, framed or load anything from elsewhere
export const PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
} as const;

const layout = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; background: Canvas; color: CanvasText; }
  main { box-sizing: border-box; width: min(28rem, 100% - 2rem); padding: 2rem; border-radius: 1.5rem; background: color-mix(in srgb, CanvasText 6%, Canvas); }
  h1 { margin: 0 0 .25rem; font-size: 1.25rem; word-break: break-word; }
  p { margin: .25rem 0; opacity: .75; }
  form { display: flex; flex-direction: column; gap: .75rem; margin-top: 1.5rem; }
  input { padding: .75rem 1rem; border-radius: .75rem; border: 1px solid color-mix(in srgb, CanvasText 30%, transparent); background: Canvas; color: inherit; font: inherit; }
  button, a.button { display: inline-block; box-sizing: border-box; width: 100%; padding: .75rem 1.5rem; border: 0; border-radius: 999px; background: #b4005f; color: white; font: inherit; font-weight: 600; text-align: center; text-decoration: none; cursor: pointer; }
  .error { color: #ba1a1a; opacity: 1; }
  .actions { margin-top: 1.5rem; }
</style>
</head>
<body><main>${body}</main></body>
</html>`;

export interface SharedFileView {
  name: string;
  size: number;
  expiresAt: number | null;
  needsPassword: boolean;
  // where the download form posts to, or the link to follow when there is no password
  downloadUrl: string;
  error?: string;
}

export function renderSharePage(view: SharedFileView): string {
  const expiry = view.expiresAt === null ? "" : `<p>Available until ${escapeHtml(new Date(view.expiresAt).toUTCString())}</p>`;
  const error = view.error ? `<p class="error" role="alert">${escapeHtml(view.error)}</p>` : "";

  const action = view.needsPassword
    ? `<form method="post" action="${escapeHtml(view.downloadUrl)}">
  <label for="password">This file is protected. Enter the password to download it.</label>
  <input id="password" name="password" type="password" autocomplete="off" maxlength="128" required autofocus>
  <button type="submit">Download</button>
</form>`
    : `<div class="actions"><a class="button" href="${escapeHtml(view.downloadUrl)}">Download</a></div>`;

  return layout(
    `${view.name} · Shared file`,
    `<h1>${escapeHtml(view.name)}</h1>
<p>${escapeHtml(formatBytes(view.size))} · shared with you</p>
${expiry}
${error}
${action}`,
  );
}

/** Used for every way a link can be unusable (wrong, expired, revoked, file gone) so that they cannot be told apart. */
export const renderUnavailablePage = () => layout("Link unavailable", `<h1>This link is unavailable</h1><p>It may have expired, or the person who shared it may have stopped sharing.</p>`);

export const renderBlockedPage = () => layout("Too many attempts", `<h1>Too many attempts</h1><p>Wait a while before trying this link again.</p>`);

/** `Content-Disposition` value that survives any file name. */
export function attachment(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]|["\\%;]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}
