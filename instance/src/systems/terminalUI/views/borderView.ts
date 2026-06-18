import TerminalEffect, { TerminalColor } from "../effect.ts";
import TerminalScalarValue, { TerminalScalarValueUnit } from "../scalarValue.ts";
import TerminalView, { type TerminalViewContext } from "../view.ts";

export default class TerminalBorderView extends TerminalView {
  constructor(viewContext: TerminalViewContext) {
    super(viewContext);

    this.viewProperties.width = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.height = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentWidth = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentHeight = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentOffsetX = new TerminalScalarValue(1, TerminalScalarValueUnit.Cell);
    this.viewProperties.contentOffsetY = new TerminalScalarValue(1, TerminalScalarValueUnit.Cell);
  }

  override async draw(drawProperties: TerminalView["viewProperties"]["_absolute"]) {
    const screen = this.viewContext.screen;

    screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY);
    screen.write(`┌${"─".repeat(drawProperties.width - 2)}┐`, new TerminalEffect().setColor(TerminalColor.BrightBlack));

    for (let i = 1; i < drawProperties.height - 1; i++) {
      screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + i);
      screen.write(`│${" ".repeat(drawProperties.width - 2)}│`, new TerminalEffect().setColor(TerminalColor.BrightBlack));
    }
    screen.cursorTo(drawProperties.drawOriginX, drawProperties.height);
    screen.write(`└${"─".repeat(drawProperties.width - 2)}┘`, new TerminalEffect().setColor(TerminalColor.BrightBlack));

    // screen.write(JSON.stringify({ x: drawOrigin.x + this.contentAbsoluteOffset.width, y: drawOrigin.y + this.contentAbsoluteOffset.height }));

    await super.draw(drawProperties);
  }
}
