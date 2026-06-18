import TerminalScalarValue, { TerminalScalarValueUnit } from "../scalarValue.ts";
import TerminalView, { type TerminalViewContext } from "../view.ts";

export default class TerminalContainerView extends TerminalView {
  constructor(viewContext: TerminalViewContext) {
    super(viewContext);

    this.viewProperties.width = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.height = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentWidth = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentHeight = new TerminalScalarValue(100, TerminalScalarValueUnit.Percentage);
    this.viewProperties.contentOffsetX = new TerminalScalarValue(0, TerminalScalarValueUnit.Cell);
    this.viewProperties.contentOffsetY = new TerminalScalarValue(0, TerminalScalarValueUnit.Cell);
  }

  setFlowDirection(flowDirection: "x" | "y") {
    this.childViewFlowDirection = flowDirection;

    return this;
  }

  override async draw(drawProperties: TerminalView["viewProperties"]["_absolute"]): Promise<void> {
    await super.draw(drawProperties);
  }
}
