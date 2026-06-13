import TerminalSizableElement from "./sizableElement.ts";
import { type TerminalEventListener, TerminalEventType } from "./terminalEvent.ts";

export default abstract class TerminalView extends TerminalSizableElement {
  eventListeners: TerminalEventListener<TerminalEventType>[];
  childViews: TerminalView[];
  childViewFlowDirection: "x" | "y" = "x";

  constructor() {
    super();

    this.childViews = [];

    this.eventListeners = [
      {
        type: TerminalEventType.ResizeScreen as const,
        cb: (event) => {
          event;
        },
      },
    ];
  }

  override calculateSize(parentContentAbsoluteDimensions: { width: number; height: number }): void {
    super.calculateSize(parentContentAbsoluteDimensions);

    for (const childView of this.childViews) {
      childView.calculateSize(this.contentAbsoluteDimensions);
    }
  }

  async draw(parentDrawOrigin: { x: number; y: number }) {
    let previousViewOrigin = { x: parentDrawOrigin.x + this.contentAbsoluteOffset.width, y: parentDrawOrigin.y + this.contentAbsoluteOffset.height };

    for (const childView of this.childViews) {
      await childView.draw(previousViewOrigin);
      if (this.childViewFlowDirection === "x") previousViewOrigin.x += childView.absoluteDimensions.width;
      if (this.childViewFlowDirection === "y") previousViewOrigin.y += childView.absoluteDimensions.height;
    }
  }
}
