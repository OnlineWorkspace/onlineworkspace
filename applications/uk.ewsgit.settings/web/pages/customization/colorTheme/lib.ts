import { CorePalette, TonalPalette } from "@material/material-color-utilities";

export type Scheme = { darkMode: Record<string, string>; lightMode: Record<string, string> };

/** Builds a full light + dark Material scheme from a source color (0xAARRGGBB). */
export function schemeFromArgb(sourceColor: number): Scheme {
  return schemeFromPalette(CorePalette.of(sourceColor));
}

/** A near-neutral scheme: every palette is almost desaturated, with a faint tint towards `hue` (default a cool blue-gray). */
export function grayScheme(hue = 250): Scheme {
  const palette = CorePalette.of(0xff6750a4);
  return schemeFromPalette({
    a1: TonalPalette.fromHueAndChroma(hue, 6),
    a2: TonalPalette.fromHueAndChroma(hue, 4),
    a3: TonalPalette.fromHueAndChroma(hue, 8),
    n1: TonalPalette.fromHueAndChroma(hue, 1.5),
    n2: TonalPalette.fromHueAndChroma(hue, 3),
    error: palette.error,
  });
}

type PaletteLike = Pick<CorePalette, "a1" | "a2" | "a3" | "n1" | "n2" | "error">;

function schemeFromPalette(palette: PaletteLike): Scheme {
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

  return {
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
}

export function argbFromHex(hex: string): number {
  return (0xff000000 | parseInt(hex.replace("#", ""), 16)) >>> 0;
}
