import TerminalEffect, { TerminalColor } from "../effect.ts";
import TerminalScalarValue, { TerminalScalarValueUnit } from "../scalarValue.ts";
import type TerminalScreen from "../screen.ts";
import TerminalView, { type TerminalViewContext } from "../view.ts";

export default class TerminalCrossView extends TerminalView {
  constructor(viewContext: TerminalViewContext) {
    super(viewContext);

    this.viewProperties.width = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.height = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentWidth = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentHeight = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentOffsetX = new TerminalScalarValue(0, TerminalScalarValueUnit.Cell);
    this.viewProperties.contentOffsetY = new TerminalScalarValue(0, TerminalScalarValueUnit.Cell);
  }

  override async draw(drawProperties: TerminalView["viewProperties"]["_absolute"]): Promise<void> {
    const screen = this.viewContext.screen;

    if (drawProperties.width < 31 || drawProperties.height < 3) {
      screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY);
      screen.write("Too Small to display CrossView");
      return;
    }

    enum VerticalAlignment {
      Even,
      Odd,
    }
    enum HorizontalAlignment {
      Even,
      Odd,
    }

    let horizontalAlignment: HorizontalAlignment;
    let verticalAlignment: VerticalAlignment;

    if (drawProperties.width % 2 === 0) {
      horizontalAlignment = HorizontalAlignment.Even;
    } else {
      horizontalAlignment = HorizontalAlignment.Odd;
    }

    if (drawProperties.height % 2 === 0) {
      verticalAlignment = VerticalAlignment.Even;
    } else {
      verticalAlignment = VerticalAlignment.Odd;
    }

    const labelText = `${drawProperties.width}x${drawProperties.height}`;
    let labelTextOffsetX = 0;
    let labelTextOffsetY = 0;

    screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY);

    if (horizontalAlignment === HorizontalAlignment.Odd) {
      screen.write(`${" ".repeat((drawProperties.width - 1) / 2)}▲${" ".repeat((drawProperties.width - 1) / 2)}`);

      for (let i = 1; i < drawProperties.height - 1; i++) {
        screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + i);
        screen.write(`${" ".repeat((drawProperties.width - 1) / 2)}│${" ".repeat((drawProperties.width - 1) / 2)}`);

        labelTextOffsetX =
          drawProperties.drawOriginX + (drawProperties.width - 1) / 2 - (labelText.length % 2 === 0 ? labelText.length / 2 : (labelText.length - 1) / 2);
      }

      screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + (drawProperties.height - 1));
      screen.write(`${" ".repeat((drawProperties.width - 1) / 2)}▼${" ".repeat((drawProperties.width - 1) / 2)}`);
    } else {
      screen.write(`${" ".repeat(drawProperties.width / 2 - 1)}▲${" ".repeat(drawProperties.width / 2)}`);

      for (let i = 1; i < drawProperties.height - 1; i++) {
        screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + i);
        screen.write(`${" ".repeat(drawProperties.width / 2 - 1)}│${" ".repeat(drawProperties.width / 2)}`);

        labelTextOffsetX =
          drawProperties.drawOriginX + drawProperties.width / 2 - 1 - (labelText.length % 2 === 0 ? labelText.length / 2 : (labelText.length - 1) / 2);
      }
      screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + drawProperties.height - 1);
      screen.write(`${" ".repeat(drawProperties.width / 2 - 1)}▼${" ".repeat(drawProperties.width / 2)}`);
    }

    if (verticalAlignment === VerticalAlignment.Odd) {
      screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + (drawProperties.height - 1) / 2);
      screen.write(`◀${"─".repeat(drawProperties.width - 2)}▶`);

      labelTextOffsetY = drawProperties.drawOriginY + (drawProperties.height - 1) / 2;
    } else {
      screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + drawProperties.height / 2 - 1);
      screen.write(`◀${"─".repeat(drawProperties.width - 2)}▶`);
      labelTextOffsetY = drawProperties.drawOriginY + drawProperties.height / 2 - 1;
    }

    screen.cursorTo(labelTextOffsetX, labelTextOffsetY);
    screen.write(labelText.split("x")[0], new TerminalEffect().setColor(TerminalColor.BrightWhite).setBold());
    screen.write("x", new TerminalEffect().setColor(TerminalColor.White));
    screen.write(labelText.split("x")[1], new TerminalEffect().setColor(TerminalColor.BrightWhite).setBold());

    // screen.write(`${" ".repeat(Math.floor((drawProperties.width - 1) / 2))} ▲${" ".repeat(Math.floor((drawProperties.width - 1) / 2))}`);

    // for (let i = 1; i < drawProperties.height; i++) {
    //   screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + i);
    //   if (i === Math.floor(drawProperties.height / 2) - 1) {
    //     const dashLen = Math.floor((drawProperties.width - dimensionText.length) / 2) - 2;
    //     screen.write(`◀${"─".repeat(dashLen)}${dimensionText}${"─".repeat(dashLen)}▶`);
    //   } else {
    //     screen.write(`${" ".repeat(Math.floor((drawProperties.width - 1) / 2))} │${" ".repeat(Math.floor((drawProperties.width - 1) / 2))}`);
    //   }
    // }
    // screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY + drawProperties.height);
    // screen.write(`${" ".repeat(Math.floor((drawProperties.width - 1) / 2))} ▼${" ".repeat(Math.floor((drawProperties.width - 1) / 2))}`);

    await super.draw(drawProperties);
  }
}
