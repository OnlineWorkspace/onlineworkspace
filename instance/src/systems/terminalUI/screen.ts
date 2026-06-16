import type TerminalEffect from "./effect.ts";
import type Terminal from "./terminal.ts";
import type TerminalView from "./view.ts";
import TerminalContainerView from "./views/container.ts";

export default class TerminalScreen {
  parentTerminal: Terminal;
  private previousDrawBuffer: [string, string?][][];
  contentBuffer: [string, TerminalEffect?][];
  private cursorPosition: number;
  visualCursorStopPosition: [number, number];
  _internal_isDrawingFrame: boolean;
  width: number;
  height: number;
  childView: TerminalView;

  constructor(terminal: Terminal) {
    this.parentTerminal = terminal;
    this.previousDrawBuffer = [];
    this.contentBuffer = [];
    this.cursorPosition = 0;
    this.visualCursorStopPosition = [0, 0];
    this._internal_isDrawingFrame = false;
    this.width = process.stdout.columns;
    this.height = process.stdout.rows;
    this.childView = new TerminalContainerView();
  }

  cursorTo(x: number, y?: number) {
    this.cursorPosition = x + (y !== undefined ? y * this.width : 0);
  }

  write(text: string, effect?: TerminalEffect) {
    const strArray = text.split("");

    for (let idx = 0; idx < strArray.length; idx++) {
      this.contentBuffer[this.cursorPosition] = [strArray[idx], effect];
      this.cursorPosition++;
    }
  }

  clearScreenDown() {
    const originalCursorPosition = this.cursorPosition;

    while (true) {
      if (!this.contentBuffer[this.cursorPosition]) break;

      this.contentBuffer[this.cursorPosition] = [" "];
      this.cursorPosition++;
    }

    this.cursorPosition = originalCursorPosition;
  }

  _rawCursorTo(x: number, y?: number) {
    return new Promise<void>((resolve) => process.stdout.cursorTo(x, y, () => resolve()));
  }

  _rawWrite(text: string) {
    const encoder = new TextEncoder();
    return Deno.stdout.write(encoder.encode(text));
  }

  _rawClearScreenDown() {
    return new Promise<void>((resolve) => process.stdout.clearScreenDown(() => resolve()));
  }

  async onResize() {
    this.width = process.stdout.columns;
    this.height = process.stdout.rows;

    await this._rawWrite(`\u001b[?47h\u001b[?7l\u001b[3J`);

    this.contentBuffer = [];
    this.previousDrawBuffer = [];

    const entries = this.width * this.height;

    for (let i = 0; i < entries; i++) {
      this.contentBuffer.push([" "]);
    }
  }

  async draw() {
    if (this._internal_isDrawingFrame) return;
    this._internal_isDrawingFrame = true;

    this.childView.calculateSize({ width: this.width, height: this.height }, { width: this.width, height: this.height });
    await this.childView.draw(this, { x: 0, y: 0 });

    let remBuf = this.contentBuffer;

    let i = 0;

    while (remBuf.length !== 0) {
      const curBuf = remBuf.slice(0, this.width);
      remBuf = remBuf.slice(this.width);

      // let lastChar: TerminalScreen["contentBuffer"][0] | undefined;
      // for (const char of curBuf) {
      //   if (char[1] !== lastChar?.[1]) {
      //     await this._rawWrite(await char[1]!._internal_apply());
      //   }

      //   await this._rawWrite(char[0]);

      //   lastChar = char;
      // }

      const drawBuffer: [string, string?][] = [];

      for (const char of curBuf) {
        if (drawBuffer[drawBuffer.length - 1]) {
          if (drawBuffer[drawBuffer.length - 1]?.[1] === char?.[1]) {
            drawBuffer[drawBuffer.length - 1][0] += char[0];
          } else {
            drawBuffer.push([char?.[0], await char[1]?._internal_apply()]);
          }
        } else {
          drawBuffer.push([char?.[0], await char[1]?._internal_apply()]);
        }
      }

      if (
        !this.previousDrawBuffer[i]?.every((element, idx) => {
          const target = drawBuffer[idx];
          if (!element || !target) return false;

          return element[0] === target[0] && element[1] === target[1];
        })
      ) {
        let toDraw = "";

        for (const group of drawBuffer) {
          if (group[1]) {
            toDraw += `${group[1] + group[0]}\u001b[0m`;
          } else {
            toDraw += group[0];
          }
        }

        await this._rawWrite(`\u001b[${i + 1};1f${toDraw}`);
      }

      if (this.previousDrawBuffer[i]) {
        this.previousDrawBuffer[i] = drawBuffer;
      } else {
        this.previousDrawBuffer.push(drawBuffer);
      }

      i++;
    }

    await this._rawCursorTo(this.visualCursorStopPosition[0], this.visualCursorStopPosition[1]);
    this._internal_isDrawingFrame = false;
  }
}
