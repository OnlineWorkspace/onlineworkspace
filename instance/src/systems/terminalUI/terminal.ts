import TerminalScreen from "./screen.ts";
import { write } from "./stdout.ts";

export default class Terminal {
  width: number;
  height: number;
  activeScreen: TerminalScreen;

  constructor() {
    const windowSize = process.stdout.getWindowSize() || [80, 20];
    this.width = windowSize[0];
    this.height = windowSize[1];
    this.activeScreen = new TerminalScreen(this);

    process.stdout.on("resize", () => {
      const windowSize = process.stdout.getWindowSize() || [80, 20];
      this.width = windowSize[0];
      this.height = windowSize[1];
    });
  }

  async draw() {
    await write("\x1b[?7l");
    await this.activeScreen.draw();
  }

  async end() {
    await write("\x1b[?7h");
  }
}
