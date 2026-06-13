import type TerminalPane from "./pane.ts";
import { clearScreenDown, cursorTo } from "./stdout.ts";
import type Terminal from "./terminal.ts";
import { TerminalEventType } from "./terminalEvent.ts";

export default class TerminalScreen {
  parentTerminal: Terminal;
  contentBuffer: string[];
  visiblePanes: TerminalPane[];
  activePane: number;

  constructor(terminal: Terminal) {
    this.parentTerminal = terminal;
    this.visiblePanes = [];
    this.contentBuffer = [];
    this.activePane = 0;
  }

  cursorTo(x: number, y?: number) {
    return new Promise<void>((resolve) => process.stdout.cursorTo(x, y, () => resolve()));
  }

  write(text: string) {
    return new Promise<void>((resolve) => process.stdout.write(text, () => resolve()));
  }

  clearScreenDown() {
    return new Promise<void>((resolve) => process.stdout.clearScreenDown(() => resolve()));
  }

  async draw() {
    let idx = 0;
    for (const pane of this.visiblePanes) {
      pane.calculateSize({ width: this.parentTerminal.width, height: this.parentTerminal.height });
      idx += 50;
      await pane.draw({ x: idx, y: 0 });
    }

    function cursorTo(x: number, y?: number) {
      return new Promise<void>((resolve) => process.stdout.cursorTo(x, y, () => resolve()));
    }

    function write(text: string) {
      return new Promise<void>((resolve) => process.stdout.write(text, () => resolve()));
    }

    function clearScreenDown() {
      return new Promise<void>((resolve) => process.stdout.clearScreenDown(() => resolve()));
    }

    await
  }
}
