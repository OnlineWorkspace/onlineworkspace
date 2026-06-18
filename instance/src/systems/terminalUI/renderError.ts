import type TerminalScreen from "./screen.ts";

export default class RenderError {
  private errorMessage: string;
  private flash: number;

  constructor(errorMessage: string) {
    this.errorMessage = errorMessage;
    this.flash = 0;
  }

  async draw(screen: TerminalScreen) {
    const errorMessage = `RenderError! ${this.errorMessage}`;
    const xOrigin = Math.floor(screen.width / 2) - Math.floor(errorMessage.length / 2);

    this.flash += 0.25;

    await screen._rawCursorTo(xOrigin, 0);
    await screen._rawWrite(`${this.flash % 2 === 0 ? "\x1b[90;41m" : "\x1b[91;40m"}\x1b[1m  ${" ".repeat(errorMessage.length)}  `);
    await screen._rawCursorTo(xOrigin, 1);
    await screen._rawWrite(`${this.flash % 2 === 0 ? "\x1b[90;41m" : "\x1b[91;40m"}\x1b[1m  ${errorMessage}  `);
    await screen._rawCursorTo(xOrigin, 2);
    await screen._rawWrite(`${this.flash % 2 === 0 ? "\x1b[90;41m" : "\x1b[91;40m"}\x1b[1m  ${" ".repeat(errorMessage.length)}  `);
  }
}
