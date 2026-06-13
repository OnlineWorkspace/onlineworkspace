import { cursorTo, write } from "../stdout.ts";
import TerminalView from "../view.ts";

export default class TerminalBorderView extends TerminalView {
  constructor() {
    super();

    this.dimensions.width = { unit: "%", value: 50 };
    this.dimensions.height = { unit: "%", value: 100 };
    this.contentOffset.width = { unit: "px", value: 0 };
    this.contentOffset.height = { unit: "px", value: 0 };
  }

  override async draw(drawOrigin: { x: number; y: number }): Promise<void> {
    await cursorTo(drawOrigin.x, drawOrigin.y);
    await write(`┌${"─".repeat(this.absoluteDimensions.width - 2)}┐`);

    for (let i = 1; i < this.absoluteDimensions.height - 1; i++) {
      await cursorTo(drawOrigin.x, drawOrigin.y + i);
      if (i === this.absoluteDimensions.height - 2) {
        await cursorTo(drawOrigin.x, drawOrigin.y + this.absoluteDimensions.height - 2);
      } else {
        await write(`│${"#".repeat(this.absoluteDimensions.width - 2)}│`);
      }
    }
    await write(`└${"─".repeat(this.absoluteDimensions.width - 2)}┘`);

    await super.draw({ x: drawOrigin.x + this.contentAbsoluteOffset.width, y: drawOrigin.y + this.contentAbsoluteOffset.height });
  }

  override calculateSize(parentContentAbsoluteDimensions: { width: number; height: number }): void {
    super.calculateSize(parentContentAbsoluteDimensions);

    this.contentAbsoluteDimensions.width = this.absoluteDimensions.width - 2;
    this.contentAbsoluteDimensions.height = this.absoluteDimensions.width - 2;
    this.contentAbsoluteOffset.width = 1;
    this.contentAbsoluteOffset.height = 1;
  }
}
