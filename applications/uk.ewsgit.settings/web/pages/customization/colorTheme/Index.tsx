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
import { DEFAULT_COLOR_THEMES } from "./themes.ts";
import { CATPPUCCIN_NAMES, CATPPUCCIN_THEMES } from "./catppuccin.ts";
import styles from "./Index.module.scss";
import { type ColorModePreference, setColorModePreference, useColorMode } from "@onlineworkspace/workspace-web/src/lib/colorMode.ts";




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
