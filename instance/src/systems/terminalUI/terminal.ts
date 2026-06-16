import TerminalScreen from "./screen.ts";

export default class Terminal {
  screen: TerminalScreen;

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
  }

  end() {
    this.screen._rawWrite(`\x1b[?47l`);
    // process.stdin.setRawMode(false);
  }
}
