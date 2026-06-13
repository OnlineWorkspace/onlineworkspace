import { cursorTo, write } from "../stdout.ts";
import TerminalView from "../view.ts";

export default class TerminalCrossView extends TerminalView {
  constructor() {
    super();

    this.dimensions.width = { unit: "%", value: 100 };
    this.dimensions.height = { unit: "%", value: 100 };
    this.contentOffset.width = { unit: "px", value: 0 };
    this.contentOffset.height = { unit: "px", value: 0 };
  }

  override async draw(drawOrigin: { x: number; y: number }): Promise<void> {
    /*
            ▲
            │
            │
    ◀─────16x5─────▶
            │
            │
            ▼
     */

    await cursorTo(drawOrigin.x, drawOrigin.y);

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

    if (horizontalAlignment === HorizontalAlignment.Odd) {
      for (let i = 0; i < this.absoluteDimensions.height; i++) {
        await cursorTo(drawOrigin.x, drawOrigin.y + i);
        await write(`${" ".repeat((this.absoluteDimensions.width - 1) / 2)}│${" ".repeat((this.absoluteDimensions.width - 1) / 2)}`);

        labelTextOffsetX =
          drawOrigin.x + (this.absoluteDimensions.width - 1) / 2 - (labelText.length % 2 === 0 ? labelText.length / 2 : (labelText.length - 1) / 2);
      }
    } else {
      await write(`${" ".repeat(this.absoluteDimensions.width / 2 - 1)}▲${" ".repeat(this.absoluteDimensions.width / 2)}`);

      for (let i = 1; i < this.absoluteDimensions.height; i++) {
        await cursorTo(drawOrigin.x, drawOrigin.y + i);
        await write(`${" ".repeat(this.absoluteDimensions.width / 2 - 1)}│${" ".repeat(this.absoluteDimensions.width / 2)}`);

        labelTextOffsetX =
          drawOrigin.x + this.absoluteDimensions.width / 2 - 1 - (labelText.length % 2 === 0 ? labelText.length / 2 : (labelText.length - 1) / 2);
      }
      await cursorTo(drawOrigin.x, drawOrigin.y + this.absoluteDimensions.height - 1);
      await write(`${" ".repeat(this.absoluteDimensions.width / 2 - 1)}▼${" ".repeat(this.absoluteDimensions.width / 2)}`);
    }

    if (verticalAlignment === VerticalAlignment.Odd) {
      await cursorTo(drawOrigin.x, drawOrigin.y + (this.absoluteDimensions.height - 1) / 2);
      await write(`${"─".repeat(this.absoluteDimensions.width)}`);

      labelTextOffsetY = drawOrigin.y + (this.absoluteDimensions.height - 1) / 2;
    } else {
      await cursorTo(drawOrigin.x, drawOrigin.y + this.absoluteDimensions.height / 2 - 1);
      await write(`${"─".repeat(this.absoluteDimensions.width)}`);
      labelTextOffsetY = drawOrigin.y + this.absoluteDimensions.height / 2 - 1;
    }

    await cursorTo(labelTextOffsetX, labelTextOffsetY);
    await write(labelText);

    // await write(`${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))} ▲${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))}`);

    // for (let i = 1; i < this.absoluteDimensions.height; i++) {
    //   await cursorTo(drawOrigin.x, drawOrigin.y + i);
    //   if (i === Math.floor(this.absoluteDimensions.height / 2) - 1) {
    //     const dashLen = Math.floor((this.absoluteDimensions.width - dimensionText.length) / 2) - 2;
    //     await write(`◀${"─".repeat(dashLen)}${dimensionText}${"─".repeat(dashLen)}▶`);
    //   } else {
    //     await write(`${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))} │${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))}`);
    //   }
    // }
    // await cursorTo(drawOrigin.x, drawOrigin.y + this.absoluteDimensions.height);
    // await write(`${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))} ▼${" ".repeat(Math.floor((this.absoluteDimensions.width - 1) / 2))}`);

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
