import { baselineTheme } from "@ewsgit/uikit-solid/src/core/design/themes/baseline.ts";
import { CATPPUCCIN_NAMES, CATPPUCCIN_THEMES } from "../../../../applications/uk.ewsgit.settings/web/pages/customization/colorTheme/catppuccin.ts";
import { DEFAULT_COLOR_THEMES } from "../../../../applications/uk.ewsgit.settings/web/pages/customization/colorTheme/themes.ts";

export interface ThemeScheme {
  lightMode: Record<string, string>;
  darkMode: Record<string, string>;
}

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const hexToRgb = (hex: string) => (hex.startsWith("#") ? [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join(", ") : hex);

const baselineScheme = (): ThemeScheme => ({
  lightMode: Object.fromEntries(Object.entries(baselineTheme.sys.color.lightMode).map(([key, value]) => [key, hexToRgb(value)])),
  darkMode: Object.fromEntries(Object.entries(baselineTheme.sys.color.darkMode).map(([key, value]) => [key, hexToRgb(value)])),
});

/** the id of the built in theme, which is stored as no theme at all */
export const BUILT_IN_THEME = "default";

/** the themes which can be chosen as the instance's default, the built in one first */
export const THEME_PRESETS: { id: string; name: string; scheme: ThemeScheme }[] = [
  { id: BUILT_IN_THEME, name: "Default", scheme: baselineScheme() },
  ...Object.entries(DEFAULT_COLOR_THEMES).map(([id, scheme]) => ({ id, name: capitalize(id), scheme: scheme as ThemeScheme })),
  ...Object.entries(CATPPUCCIN_THEMES).map(([id, scheme]) => ({ id, name: CATPPUCCIN_NAMES[id], scheme: scheme as ThemeScheme })),
];

/** what is stored for a theme, nothing for the built in one */
export const schemeForTheme = (id: string): ThemeScheme | null => (id === BUILT_IN_THEME ? null : (THEME_PRESETS.find((t) => t.id === id)?.scheme ?? null));
