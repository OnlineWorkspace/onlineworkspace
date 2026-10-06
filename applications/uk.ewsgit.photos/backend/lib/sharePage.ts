const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

// nothing on these pages may be framed, and nothing may load from anywhere but this server
export const PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
} as const;

export interface SharedItem {
  id: number;
  kind: "image" | "video";
  name: string;
  width: number;
  height: number;
  version: number;
}

const layout = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; font-family: system-ui, sans-serif; background: Canvas; color: CanvasText; }
  header { padding: 1.5rem 1.5rem 0.5rem; }
  h1 { margin: 0; font-size: 1.75rem; font-weight: 500; word-break: break-word; }
  p { margin: .25rem 0; opacity: .7; }
  main.message { box-sizing: border-box; width: min(28rem, 100% - 2rem); margin: 4rem auto; padding: 2rem; border-radius: 1.5rem; background: color-mix(in srgb, CanvasText 6%, Canvas); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); gap: 6px; padding: 1rem 1.5rem 2rem; }
  .tile { position: relative; display: block; aspect-ratio: 1; overflow: hidden; border-radius: 12px; background: color-mix(in srgb, CanvasText 8%, Canvas); color: inherit; text-decoration: none; }
  .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .tile span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .9rem; opacity: .7; }
  .single { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem 1.5rem 2rem; }
  .single img, .single video { max-width: 100%; max-height: 80vh; border-radius: 16px; }
  a.button { display: inline-block; padding: .65rem 1.5rem; border-radius: 999px; background: #b4005f; color: white; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>${body}</body>
</html>`;

const query = (item: SharedItem) => `v=${item.version}`;

export function renderSharedItems(base: string, title: string, items: SharedItem[]): string {
  if (items.length === 1) {
    const item = items[0]!;
    const file = `${base}/${item.id}/file?${query(item)}`;
    const media = item.kind === "video" ? `<video src="${file}" controls preload="metadata"></video>` : `<img src="${file}" alt="${escapeHtml(item.name)}">`;

    return layout(
      `${title} · Shared photo`,
      `<header><h1>${escapeHtml(title)}</h1><p>Shared with you</p></header><div class="single">${media}<a class="button" href="${file}&download=1">Download</a></div>`,
    );
  }

  const tiles = items
    .map((item) => {
      const href = `${base}/${item.id}/file?${query(item)}`;
      return item.kind === "video"
        ? `<a class="tile" href="${href}"><span>Video · ${escapeHtml(item.name)}</span></a>`
        : `<a class="tile" href="${href}"><img src="${base}/${item.id}/thumbnail?size=512&amp;${query(item)}" alt="${escapeHtml(item.name)}" loading="lazy"></a>`;
    })
    .join("");

  return layout(
    `${title} · Shared album`,
    `<header><h1>${escapeHtml(title)}</h1><p>${items.length} item${items.length === 1 ? "" : "s"} · shared with you</p></header><div class="grid">${tiles}</div>`,
  );
}

export const renderUnavailablePage = () =>
  layout("Not available", `<main class="message"><h1>This link is not available</h1><p>It may have been turned off by whoever shared it.</p></main>`);
