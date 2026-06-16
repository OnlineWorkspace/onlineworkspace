import TerminalEffect, { TerminalColor } from "../effect.ts";
import type TerminalScreen from "../screen.ts";
import TerminalView from "../view.ts";

export default class TerminalBorderView extends TerminalView {
  constructor() {
    super();

    this.dimensions.width = { unit: "rem%", value: 100 };
    this.dimensions.height = { unit: "rem%", value: 100 };
    this.contentDimensions.width = { unit: "%", value: 100 };
    this.contentDimensions.height = { unit: "%", value: 100 };
    this.contentOffset.width = { unit: "px", value: 1 };
    this.contentOffset.height = { unit: "px", value: 1 };
  }

  override async draw(screen: TerminalScreen, drawOrigin: { x: number; y: number }): Promise<void> {
    screen.cursorTo(drawOrigin.x, drawOrigin.y);
    screen.write(`┌${"─".repeat(this.absoluteDimensions.width - 2)}┐`, new TerminalEffect().setColor(TerminalColor.BrightBlack));

    for (let i = 1; i < this.absoluteDimensions.height - 1; i++) {
      screen.cursorTo(drawOrigin.x, drawOrigin.y + i);
      screen.write(`│${" ".repeat(this.absoluteDimensions.width - 2)}│`, new TerminalEffect().setColor(TerminalColor.BrightBlack));
    }
    screen.cursorTo(drawOrigin.x, this.absoluteDimensions.height);
    screen.write(`└${"─".repeat(this.absoluteDimensions.width - 2)}┘`, new TerminalEffect().setColor(TerminalColor.BrightBlack));

    // screen.write(JSON.stringify({ x: drawOrigin.x + this.contentAbsoluteOffset.width, y: drawOrigin.y + this.contentAbsoluteOffset.height }));

    await super.draw(screen, { x: drawOrigin.x + this.contentAbsoluteOffset.width, y: drawOrigin.y + this.contentAbsoluteOffset.height });
  }
}
