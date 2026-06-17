import TerminalEffect, { TerminalColor } from "../effect.ts";
import type TerminalScreen from "../screen.ts";
import TerminalView, { type TerminalViewContext } from "../view.ts";

export default class TerminalBorderView extends TerminalView {
  constructor(viewContext: TerminalViewContext) {
    super(viewContext);

    this.definitions.dimensions.width = { unit: "%", value: 100 };
    this.definitions.dimensions.height = { unit: "%", value: 100 };
    this.definitions.contentDimensions.width = { unit: "%", value: 100 };
    this.definitions.contentDimensions.height = { unit: "%", value: 100 };
    this.definitions.contentOffset.width = { unit: "px", value: 1 };
    this.definitions.contentOffset.height = { unit: "px", value: 1 };
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
