import { sourceColorFromImage } from "@material/material-color-utilities";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import PALETTE_ICON from "@material-symbols/svg-700/outlined/palette.svg";
import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import ThemeMock from "./components/ThemeMock/ThemeMock.tsx";
import ThemeCard from "./components/ThemeCard/ThemeCard.tsx";
import { argbFromHex, grayScheme, type Scheme, schemeFromArgb } from "./lib.ts";
import { CATPPUCCIN_NAMES, CATPPUCCIN_THEMES } from "./catppuccin.ts";
import styles from "./Index.module.scss";
import { type ColorModePreference, setColorModePreference, useColorMode } from "@onlineworkspace/workspace-web/src/lib/colorMode.ts";


const DEFAULT_COLOR_THEMES = {
  amber: {
    darkMode: {
      error: "255, 180, 171",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "158, 142, 130",
      primary: "255, 184, 117",
      surface: "32, 27, 23",
      "on-error": "105, 0, 5",
      tertiary: "194, 204, 153",
      secondary: "226, 192, 164",
      background: "32, 27, 23",
      "on-primary": "75, 40, 0",
      "on-surface": "236, 224, 217",
      "on-tertiary": "44, 52, 15",
      "on-secondary": "65, 44, 25",
      "on-background": "236, 224, 217",
      "error-container": "147, 0, 10",
      "inverse-primary": "141, 79, 0",
      "inverse-surface": "236, 224, 217",
      "outline-variant": "81, 68, 58",
      "surface-variant": "81, 68, 58",
      "primary-container": "107, 59, 0",
      "surface-container": "33, 24, 15",
      "inverse-on-surface": "53, 47, 43",
      "on-error-container": "255, 180, 171",
      "on-surface-variant": "213, 195, 182",
      "tertiary-container": "66, 74, 35",
      "secondary-container": "89, 66, 45",
      "on-primary-container": "255, 220, 192",
      "on-tertiary-container": "222, 232, 179",
      "surface-container-low": "31, 22, 14",
      "on-secondary-container": "255, 220, 192",
      "surface-container-high": "40, 30, 21",
      "surface-container-lowest": "21, 12, 5",
      "surface-container-highest": "46, 36, 27",
    },
    lightMode: {
      error: "186, 26, 26",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "131, 116, 105",
      primary: "141, 79, 0",
      surface: "255, 251, 255",
      "on-error": "255, 255, 255",
      tertiary: "90, 98, 57",
      secondary: "115, 89, 67",
      background: "255, 251, 255",
      "on-primary": "255, 255, 255",
      "on-surface": "32, 27, 23",
      "on-tertiary": "255, 255, 255",
      "on-secondary": "255, 255, 255",
      "on-background": "32, 27, 23",
      "error-container": "255, 218, 214",
      "inverse-primary": "255, 184, 117",
      "inverse-surface": "53, 47, 43",
      "outline-variant": "213, 195, 182",
      "surface-variant": "242, 223, 209",
      "primary-container": "255, 220, 192",
      "surface-container": "254, 234, 220",
      "inverse-on-surface": "250, 239, 231",
      "on-error-container": "65, 0, 2",
      "on-surface-variant": "81, 68, 58",
      "tertiary-container": "222, 232, 179",
      "secondary-container": "255, 220, 192",
      "on-primary-container": "45, 22, 0",
      "on-tertiary-container": "23, 30, 0",
      "surface-container-low": "255, 255, 255",
      "on-secondary-container": "41, 24, 6",
      "surface-container-high": "248, 229, 215",
      "surface-container-lowest": "255, 241, 232",
      "surface-container-highest": "242, 223, 209",
    },
  },
  jungle: {
    darkMode: {
      error: "255, 180, 171",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "140, 147, 136",
      primary: "130, 219, 118",
      surface: "26, 28, 25",
      "on-error": "105, 0, 5",
      tertiary: "160, 207, 211",
      secondary: "186, 204, 178",
      background: "26, 28, 25",
      "on-primary": "0, 58, 4",
      "on-surface": "226, 227, 221",
      "on-tertiary": "0, 54, 58",
      "on-secondary": "38, 52, 34",
      "on-background": "226, 227, 221",
      "error-container": "147, 0, 10",
      "inverse-primary": "16, 110, 22",
      "inverse-surface": "226, 227, 221",
      "outline-variant": "66, 73, 63",
      "surface-variant": "66, 73, 63",
      "primary-container": "0, 83, 9",
      "surface-container": "21, 27, 20",
      "inverse-on-surface": "47, 49, 45",
      "on-error-container": "255, 180, 171",
      "on-surface-variant": "194, 200, 188",
      "tertiary-container": "30, 77, 81",
      "secondary-container": "60, 75, 56",
      "on-primary-container": "157, 248, 143",
      "on-tertiary-container": "188, 235, 239",
      "surface-container-low": "19, 25, 18",
      "on-secondary-container": "214, 232, 205",
      "surface-container-high": "27, 33, 25",
      "surface-container-lowest": "10, 16, 9",
      "surface-container-highest": "34, 39, 31",
    },
    lightMode: {
      error: "186, 26, 26",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "115, 121, 110",
      primary: "16, 110, 22",
      surface: "252, 253, 246",
      "on-error": "255, 255, 255",
      tertiary: "56, 101, 105",
      secondary: "83, 99, 78",
      background: "252, 253, 246",
      "on-primary": "255, 255, 255",
      "on-surface": "26, 28, 25",
      "on-tertiary": "255, 255, 255",
      "on-secondary": "255, 255, 255",
      "on-background": "26, 28, 25",
      "error-container": "255, 218, 214",
      "inverse-primary": "130, 219, 118",
      "inverse-surface": "47, 49, 45",
      "outline-variant": "194, 200, 188",
      "surface-variant": "222, 228, 216",
      "primary-container": "157, 248, 143",
      "surface-container": "234, 240, 227",
      "inverse-on-surface": "241, 241, 235",
      "on-error-container": "65, 0, 2",
      "on-surface-variant": "66, 73, 63",
      "tertiary-container": "188, 235, 239",
      "secondary-container": "214, 232, 205",
      "on-primary-container": "0, 34, 2",
      "on-tertiary-container": "0, 32, 34",
      "surface-container-low": "255, 255, 255",
      "on-secondary-container": "17, 31, 15",
      "surface-container-high": "228, 234, 221",
      "surface-container-lowest": "240, 246, 233",
      "surface-container-highest": "222, 228, 216",
    },
  },
  rose: {
    darkMode: {
      error: "255, 180, 171",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "158, 140, 144",
      primary: "255, 177, 199",
      surface: "32, 26, 27",
      "on-error": "105, 0, 5",
      tertiary: "239, 189, 147",
      secondary: "227, 189, 198",
      background: "32, 26, 27",
      "on-primary": "101, 0, 50",
      "on-surface": "236, 224, 225",
      "on-tertiary": "71, 41, 11",
      "on-secondary": "66, 41, 49",
      "on-background": "236, 224, 225",
      "error-container": "147, 0, 10",
      "inverse-primary": "173, 40, 97",
      "inverse-surface": "236, 224, 225",
      "outline-variant": "81, 67, 70",
      "surface-variant": "81, 67, 70",
      "primary-container": "141, 5, 73",
      "surface-container": "34, 23, 26",
      "inverse-on-surface": "53, 47, 48",
      "on-error-container": "255, 180, 171",
      "on-surface-variant": "213, 194, 197",
      "tertiary-container": "97, 63, 31",
      "secondary-container": "91, 63, 71",
      "on-primary-container": "255, 217, 226",
      "on-tertiary-container": "255, 220, 193",
      "surface-container-low": "31, 21, 24",
      "on-secondary-container": "255, 217, 226",
      "surface-container-high": "40, 29, 32",
      "surface-container-lowest": "21, 11, 14",
      "surface-container-highest": "46, 35, 38",
    },
    lightMode: {
      error: "186, 26, 26",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "131, 115, 119",
      primary: "173, 40, 97",
      surface: "255, 251, 255",
      "on-error": "255, 255, 255",
      tertiary: "124, 86, 53",
      secondary: "116, 86, 94",
      background: "255, 251, 255",
      "on-primary": "255, 255, 255",
      "on-surface": "32, 26, 27",
      "on-tertiary": "255, 255, 255",
      "on-secondary": "255, 255, 255",
      "on-background": "32, 26, 27",
      "error-container": "255, 218, 214",
      "inverse-primary": "255, 177, 199",
      "inverse-surface": "53, 47, 48",
      "outline-variant": "213, 194, 197",
      "surface-variant": "242, 221, 225",
      "primary-container": "255, 217, 226",
      "surface-container": "254, 233, 237",
      "inverse-on-surface": "250, 238, 239",
      "on-error-container": "65, 0, 2",
      "on-surface-variant": "81, 67, 70",
      "tertiary-container": "255, 220, 193",
      "secondary-container": "255, 217, 226",
      "on-primary-container": "62, 0, 29",
      "on-tertiary-container": "46, 21, 0",
      "surface-container-low": "255, 255, 255",
      "on-secondary-container": "43, 21, 28",
      "surface-container-high": "248, 227, 231",
      "surface-container-lowest": "255, 240, 242",
      "surface-container-highest": "242, 221, 225",
    },
  },
  ice: {
    darkMode: {
      error: "255, 180, 171",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "140, 145, 153",
      primary: "153, 203, 255",
      surface: "26, 28, 30",
      "on-error": "105, 0, 5",
      tertiary: "212, 190, 230",
      secondary: "185, 200, 218",
      background: "26, 28, 30",
      "on-primary": "0, 51, 84",
      "on-surface": "226, 226, 229",
      "on-tertiary": "57, 42, 73",
      "on-secondary": "36, 50, 64",
      "on-background": "226, 226, 229",
      "error-container": "147, 0, 10",
      "inverse-primary": "0, 98, 157",
      "inverse-surface": "226, 226, 229",
      "outline-variant": "66, 71, 78",
      "surface-variant": "66, 71, 78",
      "primary-container": "0, 74, 120",
      "surface-container": "21, 26, 32",
      "inverse-on-surface": "47, 48, 51",
      "on-error-container": "255, 180, 171",
      "on-surface-variant": "194, 199, 207",
      "tertiary-container": "80, 64, 96",
      "secondary-container": "58, 72, 87",
      "on-primary-container": "207, 229, 255",
      "on-tertiary-container": "239, 219, 255",
      "surface-container-low": "19, 24, 30",
      "on-secondary-container": "213, 228, 247",
      "surface-container-high": "27, 32, 38",
      "surface-container-lowest": "9, 15, 20",
      "surface-container-highest": "33, 38, 44",
    },
    lightMode: {
      error: "186, 26, 26",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "114, 119, 127",
      primary: "0, 98, 157",
      surface: "252, 252, 255",
      "on-error": "255, 255, 255",
      tertiary: "105, 87, 121",
      secondary: "82, 96, 112",
      background: "252, 252, 255",
      "on-primary": "255, 255, 255",
      "on-surface": "26, 28, 30",
      "on-tertiary": "255, 255, 255",
      "on-secondary": "255, 255, 255",
      "on-background": "26, 28, 30",
      "error-container": "255, 218, 214",
      "inverse-primary": "153, 203, 255",
      "inverse-surface": "47, 48, 51",
      "outline-variant": "194, 199, 207",
      "surface-variant": "222, 227, 235",
      "primary-container": "207, 229, 255",
      "surface-container": "234, 238, 246",
      "inverse-on-surface": "241, 240, 244",
      "on-error-container": "65, 0, 2",
      "on-surface-variant": "66, 71, 78",
      "tertiary-container": "239, 219, 255",
      "secondary-container": "213, 228, 247",
      "on-primary-container": "0, 29, 51",
      "on-tertiary-container": "35, 21, 51",
      "surface-container-low": "255, 255, 255",
      "on-secondary-container": "14, 29, 42",
      "surface-container-high": "228, 232, 241",
      "surface-container-lowest": "239, 244, 252",
      "surface-container-highest": "222, 227, 235",
    },
  },
  turquoise: {
    darkMode: {
      error: "255, 180, 171",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "137, 146, 149",
      primary: "83, 215, 242",
      surface: "25, 28, 29",
      "on-error": "105, 0, 5",
      tertiary: "189, 197, 235",
      secondary: "178, 203, 210",
      background: "25, 28, 29",
      "on-primary": "0, 54, 63",
      "on-surface": "225, 227, 228",
      "on-tertiary": "39, 47, 77",
      "on-secondary": "28, 52, 57",
      "on-background": "225, 227, 228",
      "error-container": "147, 0, 10",
      "inverse-primary": "0, 104, 120",
      "inverse-surface": "225, 227, 228",
      "outline-variant": "63, 72, 75",
      "surface-variant": "63, 72, 75",
      "primary-container": "0, 78, 91",
      "surface-container": "18, 27, 29",
      "inverse-on-surface": "46, 49, 50",
      "on-error-container": "255, 180, 171",
      "on-surface-variant": "191, 200, 203",
      "tertiary-container": "62, 69, 101",
      "secondary-container": "51, 74, 80",
      "on-primary-container": "167, 238, 255",
      "on-tertiary-container": "220, 225, 255",
      "surface-container-low": "16, 25, 27",
      "on-secondary-container": "205, 231, 238",
      "surface-container-high": "24, 33, 35",
      "surface-container-lowest": "7, 15, 18",
      "surface-container-highest": "30, 39, 41",
    },
    lightMode: {
      error: "186, 26, 26",
      scrim: "0, 0, 0",
      shadow: "0, 0, 0",
      outline: "111, 121, 123",
      primary: "0, 104, 120",
      surface: "251, 252, 253",
      "on-error": "255, 255, 255",
      tertiary: "85, 93, 126",
      secondary: "75, 98, 104",
      background: "251, 252, 253",
      "on-primary": "255, 255, 255",
      "on-surface": "25, 28, 29",
      "on-tertiary": "255, 255, 255",
      "on-secondary": "255, 255, 255",
      "on-background": "25, 28, 29",
      "error-container": "255, 218, 214",
      "inverse-primary": "83, 215, 242",
      "inverse-surface": "46, 49, 50",
      "outline-variant": "191, 200, 203",
      "surface-variant": "219, 228, 231",
      "primary-container": "167, 238, 255",
      "surface-container": "230, 239, 242",
      "inverse-on-surface": "239, 241, 242",
      "on-error-container": "65, 0, 2",
      "on-surface-variant": "63, 72, 75",
      "tertiary-container": "220, 225, 255",
      "secondary-container": "205, 231, 238",
      "on-primary-container": "0, 31, 37",
      "on-tertiary-container": "18, 26, 55",
      "surface-container-low": "255, 255, 255",
      "on-secondary-container": "5, 31, 36",
      "surface-container-high": "225, 234, 237",
      "surface-container-lowest": "236, 245, 248",
      "surface-container-highest": "219, 228, 231",
    },
  },
};


/** the built-in Material baseline palette, used when no custom scheme is saved */
const DEFAULT_SCHEME: Scheme = {
  darkMode: {
    background: "20, 18, 24",
    "surface-container": "33, 31, 38",
    primary: "208, 188, 255",
    "primary-container": "79, 55, 139",
    "secondary-container": "74, 68, 88",
    "on-surface": "230, 224, 233",
    "on-surface-variant": "202, 196, 208",
  },
  lightMode: {
    background: "254, 247, 255",
    "surface-container": "243, 237, 247",
    primary: "103, 80, 164",
    "primary-container": "234, 221, 255",
    "secondary-container": "232, 222, 248",
    "on-surface": "29, 27, 32",
    "on-surface-variant": "73, 69, 79",
  },
};

/** extra presets, generated from a single seed color each */
const GENERATED_THEMES: Record<string, string> = {
  ocean: "#0a6cbd",
  lavender: "#7e57c2",
  sunset: "#e8590c",
  crimson: "#c62828",
  mint: "#1fb58a",
  sky: "#29a9e0",
  lime: "#8bb800",
  sand: "#b59a6a",
  slate: "#5c6f82",
  berry: "#b0236b",
  coffee: "#7a5339",
  forest: "#2e6b3a",
};

const APPEARANCE_OPTIONS: { value: ColorModePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "auto", label: "Auto" },
  { value: "dark", label: "Dark" },
];

type ThemeOption = { id: string; name: string; scheme: Scheme | undefined };

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const ColorThemePage: Component = () => {
  const navigate = useNavigate();
  const { preference, isLight: isLightMode } = useColorMode();
  const [wallpaperScheme, setWallpaperScheme] = createSignal<Scheme | undefined>(undefined);
  // undefined until the user picks something, in which case the currently applied theme is shown as selected
  const [pickedId, setPickedId] = createSignal<string | undefined>(undefined);
  const [applied] = createResource(() => trpc.customization.colorTheme.getCurrent.query() as Promise<Scheme | null>);
  const [applying, setApplying] = createSignal(false);
  const [saved] = createResource(() => trpc.customization.colorTheme.listSaved.query());

  createEffect(async () => {
    const wallpaperSource = await trpc.customization.wallpaper.getCurrentWallpaper.query();

    if (wallpaperSource === undefined) return;

    const sourceImage = new Image();
    sourceImage.src = wallpaperSource;

    // const generatedTheme = await themeFromImage(sourceImage);

    const sourceColor = await sourceColorFromImage(sourceImage);
    setWallpaperScheme(schemeFromArgb(sourceColor));
  });

  const [customHex, setCustomHex] = createSignal("#6750a4");

  const baseOptions = createMemo<ThemeOption[]>(() => [
    ...(wallpaperScheme() ? [{ id: "wallpaper", name: "From wallpaper", scheme: wallpaperScheme() }] : []),
    { id: "default", name: "Default", scheme: undefined },
    ...Object.entries(DEFAULT_COLOR_THEMES).map(([id, scheme]) => ({ id, name: capitalize(id), scheme: scheme as Scheme })),
    ...(saved() ?? []).map((s) => ({ id: `saved:${s.id}`, name: s.name, scheme: s.scheme as Scheme })),
    ...Object.entries(CATPPUCCIN_THEMES).map(([id, scheme]) => ({ id, name: CATPPUCCIN_NAMES[id], scheme })),
    { id: "gray", name: "Gray", scheme: grayScheme() },
    ...Object.entries(GENERATED_THEMES).map(([id, hex]) => ({ id, name: capitalize(id), scheme: schemeFromArgb(argbFromHex(hex)) })),
  ]);
  const sameScheme = (a: Scheme, b: Scheme) =>
    (["darkMode", "lightMode"] as const).every((mode) => {
      const [x, y] = [a[mode], b[mode]];
      const keys = Object.keys(x);
      return keys.length === Object.keys(y).length && keys.every((k) => x[k] === y[k]);
    });

  /** which option matches the theme saved on the server; "current" when it matches none of them (e.g. an edited copy) */
  const appliedId = createMemo(() => {
    if (applied.loading) return undefined;
    const current = applied();
    if (!current?.darkMode || !current?.lightMode) return "default";
    return baseOptions().find((o) => o.scheme && sameScheme(o.scheme, current))?.id ?? "current";
  });
  const options = createMemo<ThemeOption[]>(() => (appliedId() === "current" ? [{ id: "current", name: "Current theme", scheme: applied() as Scheme }, ...baseOptions()] : baseOptions()));
  const selectedId = () => pickedId() ?? appliedId() ?? "default";
  const setSelectedId = setPickedId;
  const custom = createMemo<ThemeOption>(() => ({ id: "custom", name: "Custom", scheme: schemeFromArgb(argbFromHex(customHex())) }));
  const selected = createMemo(() => (selectedId() === "custom" ? custom() : options().find((o) => o.id === selectedId()) ?? options()[0]));
  const colorsFor = (option: ThemeOption) => (option.scheme ?? DEFAULT_SCHEME)[isLightMode() ? "lightMode" : "darkMode"];

  /** true when the selected theme is exactly what is already saved on the server */
  const isApplied = createMemo(() => {
    if (applied.loading) return false;
    const current = applied();
    const scheme = selected().scheme;
    if (!current?.darkMode || !current?.lightMode) return scheme === undefined;
    return scheme !== undefined && sameScheme(scheme, current);
  });

  async function apply() {
    setApplying(true);
    await trpc.customization.colorTheme.setColorTheme.mutate(selected().scheme);
    window.location.reload();
  }

  return (
    <>
      <UKTopAppBar
        type={"small"}
        headline={"Color Theme"}
        leadingButton={{
          accessibleLabel: "Back",
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings/customization");
          },
        }}
      />
      <div class={styles.page}>
        <section class={styles.appearance}>
          <div class={styles.appearanceText}>
            <UKText role="title" size="m">
              Appearance
            </UKText>
            <UKText role="body" size="s" class={styles.hint}>
              Applies to every theme. Auto follows your device. Saved on this device.
            </UKText>
          </div>
          <UKSegmentedButton
            items={APPEARANCE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
            selectedId={preference}
            onSelect={(id) => setColorModePreference(id as ColorModePreference)}
          />
        </section>
        <section class={styles.preview}>
          <ThemeMock class={styles.previewMock} colors={colorsFor(selected())} />
          <div class={styles.previewInfo}>
            <UKText role="headline" size="s">
              {selected().name}
            </UKText>
            <UKText role="body" size="m" class={styles.hint}>
              {isApplied() ? "This is your current color theme." : selected().id === "wallpaper" ? "Colors picked from your current wallpaper." : "Pick a theme to preview it here, then apply it."}
            </UKText>
            <Show when={!isApplied()}>
              <UKButton color="filled" leadingIcon={CHECK_ICON} disabled={applying()} onClick={apply}>
                Apply theme
              </UKButton>
            </Show>
            <UKButton color="tonal" leadingIcon={PALETTE_ICON} onClick={() => navigate("/app/uk.ewsgit.settings/customization/color-theme/customise")}>
              Customise colors
            </UKButton>
          </div>
        </section>
        <UKText role="title" size="m">
          Create from a color
        </UKText>
        <div class={styles.customRow}>
          <input
            type="color"
            class={styles.colorInput}
            aria-label="Theme source color"
            value={customHex()}
            onInput={(e) => {
              setCustomHex(e.currentTarget.value);
              setSelectedId("custom");
            }}
          />
          <ThemeCard name={`Custom (${customHex()})`} colors={colorsFor(custom())} selected={selectedId() === "custom"} onClick={() => setSelectedId("custom")} />
        </div>
        <UKText role="title" size="m">
          Themes
        </UKText>
        <div class={styles.themeList}>
          <For each={options()}>
            {(option) => (
              <ThemeCard name={option.name} colors={colorsFor(option)} selected={!applied.loading && selectedId() === option.id} onClick={() => setSelectedId(option.id)} />
            )}
          </For>
        </div>
      </div>
    </>
  );
};

export default ColorThemePage;
