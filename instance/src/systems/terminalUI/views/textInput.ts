import TerminalEffect from "../effect.ts";
import type TerminalScreen from "../screen.ts";
import TerminalView from "../view.ts";

export default class TerminalTextInputView extends TerminalView {
  value: string;
  private placeholder: string | undefined;

  constructor() {
    super();

    this.dimensions.width = { unit: "%", value: 100 };
    this.dimensions.height = { unit: "px", value: 1 };
    this.contentDimensions.width = { unit: "%", value: 100 };
    this.contentDimensions.height = { unit: "%", value: 100 };
    this.contentOffset.width = { unit: "px", value: 0 };
    this.contentOffset.height = { unit: "px", value: 0 };

    this.value = "";
    this.placeholder = undefined;
  }

  setPlaceholder(placeholderText: string | undefined) {
    this.placeholder = placeholderText;

    return this;
  }

  override async draw(screen: TerminalScreen, drawOrigin: { x: number; y: number }): Promise<void> {
    screen.cursorTo(drawOrigin.x, drawOrigin.y);
    screen.write(`${" ".repeat(this.absoluteDimensions.width)}`, new TerminalEffect().setUnderline());
    screen.cursorTo(drawOrigin.x, drawOrigin.y);
    if (this.value === "" && this.placeholder !== undefined) screen.write(`${this.placeholder}`, new TerminalEffect().setUnderline());

    await super.draw(screen, { x: drawOrigin.x + this.contentAbsoluteOffset.width, y: drawOrigin.y + this.contentAbsoluteOffset.height });
  }
}
