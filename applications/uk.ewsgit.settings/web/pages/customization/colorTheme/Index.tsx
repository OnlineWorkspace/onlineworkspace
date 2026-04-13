import { CorePalette, sourceColorFromImage } from "@material/material-color-utilities";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@onlineworkspace/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createSignal } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import TriColorPreview from "./components/TriColorPreview/TriColorPreview.tsx";
import styles from "./Index.module.scss";

const ColorThemePage: Component = () => {
  const navigate = useNavigate();
  const [wallpaperScheme, setWallpaperScheme] = createSignal<{ darkMode: Record<string, string>; lightMode: Record<string, string> }>();

  createEffect(async () => {
    const wallpaperSource = await trpc.customization.wallpaper.getCurrentWallpaper.query();

    if (!wallpaperSource) return;

    const sourceImage = new Image();
    sourceImage.src = wallpaperSource;

    // const generatedTheme = await themeFromImage(sourceImage);

    const sourceColor = await sourceColorFromImage(sourceImage);
    const palette = CorePalette.of(sourceColor);

    function redFromArgb(argb: number): number {
      return (argb >> 16) & 255;
    }

    function greenFromArgb(argb: number): number {
      return (argb >> 8) & 255;
    }

    function blueFromArgb(argb: number): number {
      return argb & 255;
    }

    function convertToUIKitRgbFormat(originalValue: number) {
      const red = redFromArgb(originalValue);
      const green = greenFromArgb(originalValue);
      const blue = blueFromArgb(originalValue);

      // rgb(red, green, blue)
      return `${red}, ${green}, ${blue}`;
    }

    const sysPalette = {
      darkMode: {
        primary: convertToUIKitRgbFormat(palette.a1.tone(80)),
        "on-primary": convertToUIKitRgbFormat(palette.a1.tone(20)),
        "primary-container": convertToUIKitRgbFormat(palette.a1.tone(30)),
        "on-primary-container": convertToUIKitRgbFormat(palette.a1.tone(90)),
        secondary: convertToUIKitRgbFormat(palette.a2.tone(80)),
        "on-secondary": convertToUIKitRgbFormat(palette.a2.tone(20)),
        "secondary-container": convertToUIKitRgbFormat(palette.a2.tone(30)),
        "on-secondary-container": convertToUIKitRgbFormat(palette.a2.tone(90)),
        tertiary: convertToUIKitRgbFormat(palette.a3.tone(80)),
        "on-tertiary": convertToUIKitRgbFormat(palette.a3.tone(20)),
        "tertiary-container": convertToUIKitRgbFormat(palette.a3.tone(30)),
        "on-tertiary-container": convertToUIKitRgbFormat(palette.a3.tone(90)),
        error: convertToUIKitRgbFormat(palette.error.tone(80)),
        "on-error": convertToUIKitRgbFormat(palette.error.tone(20)),
        "error-container": convertToUIKitRgbFormat(palette.error.tone(30)),
        "on-error-container": convertToUIKitRgbFormat(palette.error.tone(80)),
        background: convertToUIKitRgbFormat(palette.n1.tone(10)),
        "on-background": convertToUIKitRgbFormat(palette.n1.tone(90)),
        surface: convertToUIKitRgbFormat(palette.n1.tone(10)),
        "on-surface": convertToUIKitRgbFormat(palette.n1.tone(90)),
        "surface-variant": convertToUIKitRgbFormat(palette.n2.tone(30)),
        "on-surface-variant": convertToUIKitRgbFormat(palette.n2.tone(80)),
        "surface-container-low": convertToUIKitRgbFormat(palette.n2.tone(8)),
        "surface-container-lowest": convertToUIKitRgbFormat(palette.n2.tone(4)),
        "surface-container": convertToUIKitRgbFormat(palette.n2.tone(9)),
        "surface-container-high": convertToUIKitRgbFormat(palette.n2.tone(12)),
        "surface-container-highest": convertToUIKitRgbFormat(palette.n2.tone(15)),
        outline: convertToUIKitRgbFormat(palette.n2.tone(60)),
        "outline-variant": convertToUIKitRgbFormat(palette.n2.tone(30)),
        shadow: convertToUIKitRgbFormat(palette.n1.tone(0)),
        scrim: convertToUIKitRgbFormat(palette.n1.tone(0)),
        "inverse-surface": convertToUIKitRgbFormat(palette.n1.tone(90)),
        "inverse-on-surface": convertToUIKitRgbFormat(palette.n1.tone(20)),
        "inverse-primary": convertToUIKitRgbFormat(palette.a1.tone(40)),
      },
      lightMode: {
        primary: convertToUIKitRgbFormat(palette.a1.tone(40)),
        "on-primary": convertToUIKitRgbFormat(palette.a1.tone(100)),
        "primary-container": convertToUIKitRgbFormat(palette.a1.tone(90)),
        "on-primary-container": convertToUIKitRgbFormat(palette.a1.tone(10)),
        secondary: convertToUIKitRgbFormat(palette.a2.tone(40)),
        "on-secondary": convertToUIKitRgbFormat(palette.a2.tone(100)),
        "secondary-container": convertToUIKitRgbFormat(palette.a2.tone(90)),
        "on-secondary-container": convertToUIKitRgbFormat(palette.a2.tone(10)),
        tertiary: convertToUIKitRgbFormat(palette.a3.tone(40)),
        "on-tertiary": convertToUIKitRgbFormat(palette.a3.tone(100)),
        "tertiary-container": convertToUIKitRgbFormat(palette.a3.tone(90)),
        "on-tertiary-container": convertToUIKitRgbFormat(palette.a3.tone(10)),
        error: convertToUIKitRgbFormat(palette.error.tone(40)),
        "on-error": convertToUIKitRgbFormat(palette.error.tone(100)),
        "error-container": convertToUIKitRgbFormat(palette.error.tone(90)),
        "on-error-container": convertToUIKitRgbFormat(palette.error.tone(10)),
        background: convertToUIKitRgbFormat(palette.n1.tone(99)),
        "on-background": convertToUIKitRgbFormat(palette.n1.tone(10)),
        surface: convertToUIKitRgbFormat(palette.n1.tone(99)),
        "on-surface": convertToUIKitRgbFormat(palette.n1.tone(10)),
        "surface-variant": convertToUIKitRgbFormat(palette.n2.tone(90)),
        "on-surface-variant": convertToUIKitRgbFormat(palette.n2.tone(30)),
        "surface-container-low": convertToUIKitRgbFormat(palette.n2.tone(100)),
        "surface-container-lowest": convertToUIKitRgbFormat(palette.n2.tone(96)),
        "surface-container": convertToUIKitRgbFormat(palette.n2.tone(94)),
        "surface-container-high": convertToUIKitRgbFormat(palette.n2.tone(92)),
        "surface-container-highest": convertToUIKitRgbFormat(palette.n2.tone(90)),
        outline: convertToUIKitRgbFormat(palette.n2.tone(50)),
        "outline-variant": convertToUIKitRgbFormat(palette.n2.tone(80)),
        shadow: convertToUIKitRgbFormat(palette.n1.tone(0)),
        scrim: convertToUIKitRgbFormat(palette.n1.tone(0)),
        "inverse-surface": convertToUIKitRgbFormat(palette.n1.tone(20)),
        "inverse-on-surface": convertToUIKitRgbFormat(palette.n1.tone(95)),
        "inverse-primary": convertToUIKitRgbFormat(palette.a1.tone(80)),
      },
    };

    setWallpaperScheme(sysPalette);
  });

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
        <UKText role="title" size="m">
          Matched to your wallpaper
        </UKText>
        <TriColorPreview
          colors={[
            `rgb(${wallpaperScheme()?.darkMode.background || "0, 0, 0"})`,
            `rgb(${wallpaperScheme()?.darkMode.primaryContainer || "0, 0, 0"})`,
            `rgb(${wallpaperScheme()?.darkMode.primary || "0, 0, 0"})`,
          ]}
          onClick={async () => {
            const colorScheme = wallpaperScheme();

            if (!colorScheme) return;

            await trpc.customization.colorTheme.setColorTheme.mutate(colorScheme);
            window.location.reload();
          }}
        />
        <UKDivider direction="horizontal" />
        <UKText role="title" size="m">
          Default Theme
        </UKText>
        <TriColorPreview
          colors={["#141218", "#4f378bff", "#d0bcffff"]}
          onClick={async () => {
            await trpc.customization.colorTheme.setColorTheme.mutate(undefined);
            window.location.reload();
          }}
        />
      </div>
    </>
  );
};

export default ColorThemePage;
