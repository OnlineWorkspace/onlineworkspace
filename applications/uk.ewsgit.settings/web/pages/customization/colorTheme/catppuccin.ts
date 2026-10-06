import type { Scheme } from "./lib.ts";

type Flavor = {
  mauve: string;
  blue: string;
  teal: string;
  red: string;
  text: string;
  subtext0: string;
  overlay0: string;
  surface0: string;
  surface1: string;
  surface2: string;
  base: string;
  mantle: string;
  crust: string;
};

const FLAVORS = {
  latte: { mauve: "8839ef", blue: "1e66f5", teal: "179299", red: "d20f39", text: "4c4f69", subtext0: "6c6f85", overlay0: "9ca0b0", surface0: "ccd0da", surface1: "bcc0cc", surface2: "acb0be", base: "eff1f5", mantle: "e6e9ef", crust: "dce0e8" },
  frappe: { mauve: "ca9ee6", blue: "8caaee", teal: "81c8be", red: "e78284", text: "c6d0f5", subtext0: "a5adce", overlay0: "737994", surface0: "414559", surface1: "51576d", surface2: "626880", base: "303446", mantle: "292c3c", crust: "232634" },
  macchiato: { mauve: "c6a0f6", blue: "8aadf4", teal: "8bd5ca", red: "ed8796", text: "cad3f4", subtext0: "a5adcb", overlay0: "6e738d", surface0: "363a4f", surface1: "494d64", surface2: "5b6078", base: "24273a", mantle: "1e2030", crust: "181926" },
  mocha: { mauve: "cba6f7", blue: "89b4fa", teal: "94e2d5", red: "f38ba8", text: "cdd6f4", subtext0: "a6adc8", overlay0: "6c7086", surface0: "313244", surface1: "45475a", surface2: "585b70", base: "1e1e2e", mantle: "181825", crust: "11111b" },
} satisfies Record<string, Flavor>;

const rgb = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
const fmt = (hex: string) => rgb(hex).join(", ");
/** `amount` of `a` mixed into `b` */
const mix = (a: string, b: string, amount: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return x.map((c, i) => Math.round(c * amount + y[i] * (1 - amount))).join(", ");
};

function modeFrom(f: Flavor, light: boolean): Record<string, string> {
  // on-accent text is the darkest base in dark flavors and the lightest in latte
  const onAccent = light ? f.base : f.crust;
  const container = (accent: string) => mix(accent, f.base, light ? 0.25 : 0.3);
  return {
    primary: fmt(f.mauve),
    "on-primary": fmt(onAccent),
    "primary-container": container(f.mauve),
    "on-primary-container": light ? fmt(f.text) : fmt(f.mauve),
    secondary: fmt(f.blue),
    "on-secondary": fmt(onAccent),
    "secondary-container": container(f.blue),
    "on-secondary-container": light ? fmt(f.text) : fmt(f.blue),
    tertiary: fmt(f.teal),
    "on-tertiary": fmt(onAccent),
    "tertiary-container": container(f.teal),
    "on-tertiary-container": light ? fmt(f.text) : fmt(f.teal),
    error: fmt(f.red),
    "on-error": fmt(onAccent),
    "error-container": container(f.red),
    "on-error-container": light ? fmt(f.text) : fmt(f.red),
    background: fmt(f.base),
    "on-background": fmt(f.text),
    surface: fmt(f.base),
    "on-surface": fmt(f.text),
    "surface-variant": fmt(f.surface0),
    "on-surface-variant": fmt(f.subtext0),
    "surface-container-lowest": fmt(f.crust),
    "surface-container-low": fmt(f.mantle),
    "surface-container": fmt(f.surface0),
    "surface-container-high": fmt(f.surface1),
    "surface-container-highest": fmt(f.surface2),
    outline: fmt(f.overlay0),
    "outline-variant": fmt(f.surface1),
    shadow: "0, 0, 0",
    scrim: "0, 0, 0",
    "inverse-surface": fmt(f.text),
    "inverse-on-surface": fmt(f.base),
    "inverse-primary": fmt(f.mauve),
  };
}

/** Catppuccin flavors as themes; latte is the light side of each, the named flavor the dark side (latte itself pairs with mocha) */
export const CATPPUCCIN_THEMES: Record<string, Scheme> = Object.fromEntries(
  (Object.keys(FLAVORS) as (keyof typeof FLAVORS)[]).map((name) => [
    `catppuccin-${name}`,
    {
      darkMode: modeFrom(FLAVORS[name === "latte" ? "mocha" : name], false),
      lightMode: modeFrom(FLAVORS.latte, true),
    },
  ]),
);

export const CATPPUCCIN_NAMES: Record<string, string> = {
  "catppuccin-latte": "Catppuccin Latte",
  "catppuccin-frappe": "Catppuccin Frappé",
  "catppuccin-macchiato": "Catppuccin Macchiato",
  "catppuccin-mocha": "Catppuccin Mocha",
};
