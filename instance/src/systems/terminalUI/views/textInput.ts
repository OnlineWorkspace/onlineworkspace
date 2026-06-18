import TerminalEffect from "../effect.ts";
import TerminalScalarValue, { TerminalScalarValueUnit } from "../scalarValue.ts";
import type TerminalScreen from "../screen.ts";
import TerminalView, { type TerminalViewContext } from "../view.ts";

export default class TerminalTextInputView extends TerminalView {
  value: string;
  private placeholder: string | undefined;

  constructor(viewContext: TerminalViewContext) {
    super(viewContext);

    this.viewProperties.width = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.height = new TerminalScalarValue(1, TerminalScalarValueUnit.Cell);
    this.viewProperties.contentWidth = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentHeight = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentOffsetX = new TerminalScalarValue(0, TerminalScalarValueUnit.Cell);
    this.viewProperties.contentOffsetY = new TerminalScalarValue(0, TerminalScalarValueUnit.Cell);

    this.value = "";
    this.placeholder = undefined;
  }

  setPlaceholder(placeholderText: string | undefined) {
    this.placeholder = placeholderText;

    return this;
  }

  override async draw(drawProperties: TerminalView["viewProperties"]["_absolute"]): Promise<void> {
    const screen = this.viewContext.screen;

    screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY);
    screen.write(`${" ".repeat(drawProperties.width)}`, new TerminalEffect().setUnderline());
    screen.cursorTo(drawProperties.drawOriginX, drawProperties.drawOriginY);
    if (this.value === "" && this.placeholder !== undefined) screen.write(`${this.placeholder}`, new TerminalEffect().setUnderline());

    await super.draw(drawProperties);
  }
}
