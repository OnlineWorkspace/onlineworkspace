import type TerminalScreen from "./screen.ts";
import TerminalSizableElement from "./sizableElement.ts";
import type TerminalEvent from "./terminalEvent.ts";
import type TerminalView from "./view.ts";

export default class TerminalPane extends TerminalSizableElement {
  eventListeners: ((event: TerminalEvent) => void)[];
  childViews: TerminalView[];
  parent: TerminalScreen;

  constructor(screen: TerminalScreen, dimensions: TerminalPane["dimensions"]) {
    super();

    this.parent = screen;
    this.dimensions = dimensions;
    this.eventListeners = [];
    this.childViews = [];
  }

  override calculateSize(parentContentAbsoluteDimensions: { width: number; height: number }): void {
    super.calculateSize(parentContentAbsoluteDimensions);

    for (const childView of this.childViews) {
      childView.calculateSize(this.absoluteDimensions);
    }
  }

  async draw(drawOrigin: { x: number; y: number }) {
    for (const childViews of this.childViews) {
      await childViews.draw(drawOrigin);
    }
  }
}
