import type TerminalScreen from "./screen.ts";

export default class RenderError {
  private errorMessage: string;
  private ORIGIN: { x: number; y: number } = { x: 0, y: 0 };

  constructor(errorMessage: string) {
    this.errorMessage = errorMessage;
  }

  async draw(screen: TerminalScreen) {
    await screen._rawCursorTo(this.ORIGIN.x, this.ORIGIN.y);
    await screen._rawWrite(`\x1b[91m\x1b[1m${this.errorMessage}`);
  }
}
