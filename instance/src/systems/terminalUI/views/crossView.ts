import TerminalEffect, { TerminalColor } from "../effect.ts";
import type TerminalScreen from "../screen.ts";
import TerminalView from "../view.ts";

export default class TerminalCrossView extends TerminalView {
  constructor() {
    super();

    this.dimensions.width = { unit: "%", value: 100 };
    this.dimensions.height = { unit: "%", value: 100 };
    this.contentDimensions.width = { unit: "%", value: 100 };
    this.contentDimensions.height = { unit: "%", value: 100 };
    this.contentOffset.width = { unit: "px", value: 0 };
    this.contentOffset.height = { unit: "px", value: 0 };
  }

  override async draw(screen: TerminalScreen, drawOrigin: { x: number; y: number }): Promise<void> {
    if (this.absoluteDimensions.width < 31 || this.absoluteDimensions.height < 3) {
      screen.cursorTo(drawOrigin.x, drawOrigin.y);
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

    if (this.absoluteDimensions.width % 2 === 0) {
      horizontalAlignment = HorizontalAlignment.Even;
    } else {
      horizontalAlignment = HorizontalAlignment.Odd;
    }

    if (this.absoluteDimensions.height % 2 === 0) {
      verticalAlignment = VerticalAlignment.Even;
    } else {
      verticalAlignment = VerticalAlignment.Odd;
    }

    const labelText = `${this.absoluteDimensions.width}x${this.absoluteDimensions.height}`;
    let labelTextOffsetX = 0;
    let labelTextOffsetY = 0;

    screen.cursorTo(drawOrigin.x, drawOrigin.y);

    if (horizontalAlignment === HorizontalAlignment.Odd) {
      screen.write(`${" ".repeat((this.absoluteDimensions.width - 1) / 2)}▲${" ".repeat((this.absoluteDimensions.width - 1) / 2)}`);

      for (let i = 1; i < this.absoluteDimensions.height - 1; i++) {
        screen.cursorTo(drawOrigin.x, drawOrigin.y + i);
        screen.write(`${" ".repeat((this.absoluteDimensions.width - 1) / 2)}│${" ".repeat((this.absoluteDimensions.width - 1) / 2)}`);

        labelTextOffsetX =
          drawOrigin.x + (this.absoluteDimensions.width - 1) / 2 - (labelText.length % 2 === 0 ? labelText.length / 2 : (labelText.length - 1) / 2);
      }

      screen.cursorTo(drawOrigin.x, drawOrigin.y + (this.absoluteDimensions.height - 1));
      screen.write(`${" ".repeat((this.absoluteDimensions.width - 1) / 2)}▼${" ".repeat((this.absoluteDimensions.width - 1) / 2)}`);
    } else {
      screen.write(`${" ".repeat(this.absoluteDimensions.width / 2 - 1)}▲${" ".repeat(this.absoluteDimensions.width / 2)}`);

      for (let i = 1; i < this.absoluteDimensions.height - 1; i++) {
        screen.cursorTo(drawOrigin.x, drawOrigin.y + i);
        screen.write(`${" ".repeat(this.absoluteDimensions.width / 2 - 1)}│${" ".repeat(this.absoluteDimensions.width / 2)}`);

        labelTextOffsetX =
          drawOrigin.x + this.absoluteDimensions.width / 2 - 1 - (labelText.length % 2 === 0 ? labelText.length / 2 : (labelText.length - 1) / 2);
      }
      screen.cursorTo(drawOrigin.x, drawOrigin.y + this.absoluteDimensions.height - 1);
      screen.write(`${" ".repeat(this.absoluteDimensions.width / 2 - 1)}▼${" ".repeat(this.absoluteDimensions.width / 2)}`);
    }

    if (verticalAlignment === VerticalAlignment.Odd) {
      screen.cursorTo(drawOrigin.x, drawOrigin.y + (this.absoluteDimensions.height - 1) / 2);
      screen.write(`◀${"─".repeat(this.absoluteDimensions.width - 2)}▶`);

      labelTextOffsetY = drawOrigin.y + (this.absoluteDimensions.height - 1) / 2;
    } else {
      screen.cursorTo(drawOrigin.x, drawOrigin.y + this.absoluteDimensions.height / 2 - 1);
      screen.write(`◀${"─".repeat(this.absoluteDimensions.width - 2)}▶`);
      labelTextOffsetY = drawOrigin.y + this.absoluteDimensions.height / 2 - 1;
    }

    screen.cursorTo(labelTextOffsetX, labelTextOffsetY);
    screen.write(labelText.split("x")[0], new TerminalEffect().setColor(TerminalColor.BrightWhite).setBold());
    screen.write("x", new TerminalEffect().setColor(TerminalColor.White));
    screen.write(labelText.split("x")[1], new TerminalEffect().setColor(TerminalColor.BrightWhite).setBold());

    // screen.write(`${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))} ▲${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))}`);

    // for (let i = 1; i < this.absoluteDimensions.height; i++) {
    //   screen.cursorTo(drawOrigin.x, drawOrigin.y + i);
    //   if (i === Math.floor(this.absoluteDimensions.height / 2) - 1) {
    //     const dashLen = Math.floor((this.absoluteDimensions.width - dimensionText.length) / 2) - 2;
    //     screen.write(`◀${"─".repeat(dashLen)}${dimensionText}${"─".repeat(dashLen)}▶`);
    //   } else {
    //     screen.write(`${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))} │${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))}`);
    //   }
    // }
    // screen.cursorTo(drawOrigin.x, drawOrigin.y + this.absoluteDimensions.height);
    // screen.write(`${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))} ▼${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))}`);

    await super.draw(screen, { x: drawOrigin.x + this.contentAbsoluteOffset.width, y: drawOrigin.y + this.contentAbsoluteOffset.height });
  }
}
