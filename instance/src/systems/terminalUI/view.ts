import type TerminalScreen from "./screen.ts";
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

  override calculateSize(
    parentContentAbsoluteDimensions: { width: number; height: number },
    parentContentRemainingAbsoluteDimensions: { width: number; height: number },
  ): void {
    super.calculateSize(parentContentAbsoluteDimensions, parentContentRemainingAbsoluteDimensions);

    const remainingContentAbsoluteDimensions = { ...this.contentAbsoluteDimensions };

    let totalChildrenPercentageWidth = 0;
    let totalChildrenPercentageHeight = 0;

    for (const childView of this.childViews) {
      if (this.childViewFlowDirection === "x")
        if (childView.dimensions.width.unit === "%") {
          totalChildrenPercentageWidth += childView.dimensions.width.value;
        }

      if (this.childViewFlowDirection === "y")
        if (childView.dimensions.height.unit === "%") {
          totalChildrenPercentageHeight += childView.dimensions.height.value;
        }
    }

    for (const childView of this.childViews) {
      if (this.childViewFlowDirection === "x")
        if (childView.dimensions.width.unit === "%") {
          childView.dimensions.width.value = (childView.dimensions.width.value / totalChildrenPercentageWidth) * 100;
        }
      if (this.childViewFlowDirection === "y")
        if (childView.dimensions.height.unit === "%") {
          childView.dimensions.height.value = (childView.dimensions.height.value / totalChildrenPercentageHeight) * 100;
        }

      childView.calculateSize(this.contentAbsoluteDimensions, remainingContentAbsoluteDimensions);
      if (this.childViewFlowDirection === "x") remainingContentAbsoluteDimensions.width -= childView.absoluteDimensions.width;
      if (this.childViewFlowDirection === "y") remainingContentAbsoluteDimensions.height -= childView.absoluteDimensions.height;
    }
  }

  addChild(view: TerminalView) {
    this.childViews.push(view);

    return this;
  }

  async draw(screen: TerminalScreen, parentDrawOrigin: { x: number; y: number }) {
    const previousViewOrigin = { x: parentDrawOrigin.x, y: parentDrawOrigin.y };

    const currentContentTotalChildSize: { width: number; height: number } = { width: 0, height: 0 };

    for (const childView of this.childViews) {
      if (this.childViewFlowDirection === "x") currentContentTotalChildSize.width += childView.absoluteDimensions.width;
      if (this.childViewFlowDirection === "y") currentContentTotalChildSize.height += childView.absoluteDimensions.height;

      if (currentContentTotalChildSize.width > this.contentAbsoluteDimensions.width) {
        screen.write(`Warning! Content Width Exceeds Remaining Space, ${currentContentTotalChildSize.width} > ${this.contentAbsoluteDimensions.width}`);
        break;
      }

      if (currentContentTotalChildSize.height > this.contentAbsoluteDimensions.height) {
        screen.write(` [Warning! Content Height Exceeds Remaining Space, ${currentContentTotalChildSize.height} > ${this.contentAbsoluteDimensions.height}] `);
        break;
      }

      await childView.draw(screen, previousViewOrigin);
      if (this.childViewFlowDirection === "x") previousViewOrigin.x += childView.absoluteDimensions.width;
      if (this.childViewFlowDirection === "y") previousViewOrigin.y += childView.absoluteDimensions.height;
      // screen.write(JSON.stringify({ parentDrawOrigin, type: childView.constructor.name }));
    }
  }
}
