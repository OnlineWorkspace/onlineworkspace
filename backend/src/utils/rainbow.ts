import { LogMessageStyle } from "../log.ts";

const hueToRgb = (hue: number): [number, number, number] => {
  // full saturation, lightness 0.6, so it is readable on dark and light terminals
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (0.6 - 0.4 * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };

  return [channel(0), channel(8), channel(4)];
};

/** Styles text as a rainbow for the console, `offset` shifts where in the rainbow it starts so that stacked lines can slant. */
export const rainbow = (text: string, offset = 0): string =>
  [...text]
    .map((char, index) => {
      if (char === " ") return char;

      const [r, g, b] = hueToRgb(((index + offset) * 14) % 360);

      return `${LogMessageStyle.CUSTOM}${r},${g},${b},255${LogMessageStyle.END_CUSTOM}${char}`;
    })
    .join("");

const brightWhite = (text: string) => `${LogMessageStyle.CUSTOM}255,255,255,255${LogMessageStyle.END_CUSTOM}${text}`;

/** Draws text in bright white inside a rounded rainbow border. Returns one string per line. */
export const rainbowBox = (lines: string[]): string[] => {
  const width = Math.max(...lines.map((line) => line.length));
  const border = (text: string, row: number, column = 0) => rainbow(text, row * 3 + column);
  const edge = (row: number) => border("│", row);

  return [
    border(`╭${"─".repeat(width + 2)}╮`, 0),
    ...lines.map((line, index) => `${edge(index + 1)} ${brightWhite(line.padEnd(width))} ${border("│", index + 1, width + 3)}`),
    border(`╰${"─".repeat(width + 2)}╯`, lines.length + 1),
  ];
};
