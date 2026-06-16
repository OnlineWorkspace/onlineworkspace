import type TerminalScreen from "../screen.ts";
import TerminalView from "../view.ts";

export default class TerminalContainerView extends TerminalView {
  constructor() {
    super();

    this.dimensions.width = { unit: "rem%", value: 100 };
    this.dimensions.height = { unit: "rem%", value: 100 };
    this.contentDimensions.width = { unit: "%", value: 100 };
    this.contentDimensions.height = { unit: "%", value: 100 };
    this.contentOffset.width = { unit: "px", value: 0 };
    this.contentOffset.height = { unit: "px", value: 0 };
  }

  setFlowDirection(flowDirection: "x" | "y") {
    this.childViewFlowDirection = flowDirection;

    return this;
  }

  override async draw(screen: TerminalScreen, drawOrigin: { x: number; y: number }): Promise<void> {
    await super.draw(screen, { x: drawOrigin.x + this.contentAbsoluteOffset.width, y: drawOrigin.y + this.contentAbsoluteOffset.height });
  }
}
