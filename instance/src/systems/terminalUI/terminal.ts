import type RenderError from "./renderError.ts";
import TerminalScreen from "./screen.ts";

export default class Terminal {
  screen: TerminalScreen;
  renderError?: RenderError;

  constructor() {
    this.screen = new TerminalScreen(this);
    this.screen.onResize();

    process.stdout.on("resize", async () => {
      await this.screen.onResize();
    });

    // process.stdin.setRawMode(true);

    globalThis.addEventListener("unload", () => {
      this.end();
    });
  }

  async draw() {
    await this.screen.draw();
    await this.renderError?.draw(this.screen);
  }

  end() {
    this.screen._rawWrite(`\x1b[?47l`);
    // process.stdin.setRawMode(false);
  }
}
