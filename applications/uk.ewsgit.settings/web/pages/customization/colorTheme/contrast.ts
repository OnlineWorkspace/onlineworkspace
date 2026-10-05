import { Hct } from "@material/material-color-utilities";

export type Rgb = [number, number, number];

export const parseRgb = (value: string): Rgb => {
  const [r, g, b] = value.split(",").map((n) => Number.parseInt(n.trim(), 10) || 0);
  return [r, g, b];
};

export const formatRgb = ([r, g, b]: Rgb) => `${r}, ${g}, ${b}`;

export const rgbToHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;

export const hexToRgb = (hex: string): Rgb => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const argbOf = ([r, g, b]: Rgb) => ((0xff << 24) | (r << 16) | (g << 8) | b) >>> 0;

const luminance = ([r, g, b]: Rgb) => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG 2 contrast ratio, 1 to 21 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground role, background role, minimum ratio, human description] */
export type ContrastPair = { fg: string; bg: string; min: number; label: string };

export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: "on-primary", bg: "primary", min: 4.5, label: "Text on primary" },
  { fg: "on-primary-container", bg: "primary-container", min: 4.5, label: "Text on primary container" },
  { fg: "on-secondary", bg: "secondary", min: 4.5, label: "Text on secondary" },
  { fg: "on-secondary-container", bg: "secondary-container", min: 4.5, label: "Text on secondary container" },
  { fg: "on-tertiary", bg: "tertiary", min: 4.5, label: "Text on tertiary" },
  { fg: "on-tertiary-container", bg: "tertiary-container", min: 4.5, label: "Text on tertiary container" },
  { fg: "on-error", bg: "error", min: 4.5, label: "Text on error" },
  { fg: "on-error-container", bg: "error-container", min: 4.5, label: "Text on error container" },
  { fg: "on-background", bg: "background", min: 4.5, label: "Text on background" },
  { fg: "on-surface", bg: "surface", min: 4.5, label: "Text on surface" },
  { fg: "on-surface", bg: "surface-container", min: 4.5, label: "Text on surface container" },
  { fg: "on-surface-variant", bg: "surface-variant", min: 4.5, label: "Secondary text on surface variant" },
  { fg: "on-surface-variant", bg: "surface", min: 4.5, label: "Secondary text on surface" },
  { fg: "inverse-on-surface", bg: "inverse-surface", min: 4.5, label: "Text on inverse surface" },
  { fg: "primary", bg: "surface", min: 3, label: "Primary accent on surface" },
  { fg: "outline", bg: "surface", min: 3, label: "Outline on surface" },
];

export type Suggestion = {
  pair: ContrastPair;
  ratio: number;
  /** the role the advisor proposes to change */
  role: string;
  from: Rgb;
  to: Rgb;
  newRatio: number;
};

/** Moves `color` along lightness (keeping hue and chroma) until it meets `min` against `against`; undefined when impossible. */
function adjustTone(color: Rgb, against: Rgb, min: number): Rgb | undefined {
  const hct = Hct.fromInt(argbOf(color));
  let best: Rgb | undefined;
  let bestDelta = Infinity;

  for (const dir of [1, -1]) {
    for (let step = 1; step <= 100; step++) {
      const tone = hct.tone + dir * step;
      if (tone < 0 || tone > 100) break;
      const argb = Hct.from(hct.hue, hct.chroma, tone).toInt();
      const candidate: Rgb = [(argb >> 16) & 255, (argb >> 8) & 255, argb & 255];
      if (contrastRatio(candidate, against) >= min) {
        if (step < bestDelta) {
          bestDelta = step;
          best = candidate;
        }
        break;
      }
    }
  }
  return best;
}

/**
 * Finds every failing pair and proposes one change per pair. The advisor never edits anything itself — the
 * caller shows these and applies only what the user accepts.
 *
 * @param colors the active mode's roles ("r, g, b" strings)
 * @param lastEdited the role the user just touched; it is left alone and its partner is proposed instead
 */
export function adviseContrast(colors: Record<string, string>, lastEdited?: string): { failing: { pair: ContrastPair; ratio: number }[]; suggestions: Suggestion[] } {
  const failing: { pair: ContrastPair; ratio: number }[] = [];
  const suggestions: Suggestion[] = [];

  for (const pair of CONTRAST_PAIRS) {
    if (!colors[pair.fg] || !colors[pair.bg]) continue;

    const fg = parseRgb(colors[pair.fg]);
    const bg = parseRgb(colors[pair.bg]);
    const ratio = contrastRatio(fg, bg);

    if (ratio >= pair.min) continue;
    failing.push({ pair, ratio });

    // prefer changing the partner of what the user just edited, otherwise the foreground
    const order = lastEdited === pair.fg ? ["bg", "fg"] : ["fg", "bg"];
    for (const which of order) {
      const role = which === "fg" ? pair.fg : pair.bg;
      if (role === lastEdited) continue;
      const from = which === "fg" ? fg : bg;
      const to = adjustTone(from, which === "fg" ? bg : fg, pair.min);
      if (to) {
        suggestions.push({ pair, ratio, role, from, to, newRatio: contrastRatio(which === "fg" ? to : fg, which === "fg" ? bg : to) });
        break;
      }
    }
  }

  return { failing, suggestions };
}
