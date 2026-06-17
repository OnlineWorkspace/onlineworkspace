import RenderError from "./renderError.ts";
import TerminalScalarValue from "./scalarValue.ts";
import type TerminalScreen from "./screen.ts";
import TerminalSizableElement from "./sizableElement.ts";
import type { TerminalEventListener, TerminalEventType } from "./terminalEvent.ts";

export type TerminalViewContext = TerminalView["viewContext"];

export default abstract class TerminalView extends TerminalSizableElement {
  private viewContext!: { screen: TerminalScreen };

  definitions: {
    dimensions: {
      width: TerminalScalarValue;
      height: TerminalScalarValue;
      minWidth?: TerminalScalarValue;
      minHeight?: TerminalScalarValue;
      maxWidth?: TerminalScalarValue;
      maxHeight?: TerminalScalarValue;
    };
    content: {
      offset: {
        width: TerminalScalarValue;
        height: TerminalScalarValue;
      };
      dimensions: {
        width: TerminalScalarValue;
        height: TerminalScalarValue;
      };
    };
    absolute: {
      dimensions: {
        width: number,
        height: number
      }
      content: {
      offset: {
        width: number;
        height: number;
      };
      dimensions: {
        width: number;
        height: number;
      };
      }
    }
  } = {
    dimensions: {
      width: new TerminalScalarValue().absolute(),
      height: {
        unit: "px",
        value: -1,
      },
    },
    content: {
      offset: {
        width: {
          unit: "px",
          value: 0,
        },
        height: {
          unit: "px",
          value: 0,
        },
      },
      dimensions: {
        width: {
          unit: "px",
          value: 0,
        },
        height: {
          unit: "px",
          value: 0,
        },
      },
    },
  };

  _contentAbsoluteDimensions: {
    width: number;
    height: number;
  } = {
    width: 1,
    height: 1,
  };
  _contentAbsoluteOffset: {
    width: number;
    height: number;
  } = {
    width: 1,
    height: 1,
  };
  _absoluteDimensions: {
    width: number;
    height: number;
  } = {
    width: 1,
    height: 1,
  };

  eventListeners: TerminalEventListener<TerminalEventType>[];
  childViews: TerminalView[];
  childViewFlowDirection: "x" | "y" = "x";

  constructor(viewContext: TerminalViewContext) {
    super();

    this.viewContext = viewContext;

    if (!this.viewContext.screen) throw new Error(`This TerminalView -> ${this.constructor.name} was not initialized correctly!`);

    this.childViews = [];
    this.eventListeners = [];
  }

  _calculateSize(availableSpace: { width: number; height: number }) {
    this._absoluteDimensions.width = 16;
    this._absoluteDimensions.height = 8;
    this._contentAbsoluteDimensions.width = 16;
    this._contentAbsoluteDimensions.height = 8;
    this._contentAbsoluteOffset.width = 0;
    this._contentAbsoluteOffset.height = 0;

    // Dimensions
    // px
    if (this._dimensions.width.unit === "px") {
      this._absoluteDimensions.width = this._dimensions.width.value;
    }
    if (this._dimensions.height.unit === "px") {
      this._absoluteDimensions.height = this._dimensions.height.value;
    }

    // %
    if (this._dimensions.width.unit === "%") {
      this._absoluteDimensions.width = Math.floor((this._dimensions.width.value / 100) * parentContentAbsoluteDimensions.width);
    }
    if (this._dimensions.height.unit === "%") {
      this._absoluteDimensions.height = Math.floor((this._dimensions.height.value / 100) * parentContentAbsoluteDimensions.height);
    }

    if (this._absoluteDimensions.width > parentContentAbsoluteDimensions.width) {
      this._absoluteDimensions.width = availableSpace.width;
    }

    if (this._absoluteDimensions.height > parentContentAbsoluteDimensions.height) {
      this._absoluteDimensions.height = availableSpace.height;
    }

    // Content Offset
    // px
    if (this._contentOffset.width.unit === "px") {
      this._contentAbsoluteOffset.width = this._contentOffset.width.value;
    }
    if (this._contentOffset.height.unit === "px") {
      this._contentAbsoluteOffset.height = this._contentOffset.height.value;
    }

    // %
    if (this._contentOffset.width.unit === "%") {
      this._contentAbsoluteOffset.width = Math.floor((this._contentOffset.width.value / 100) * parentContentAbsoluteDimensions.width);
    }
    if (this._contentOffset.height.unit === "%") {
      this._contentAbsoluteOffset.height = Math.floor((this._contentOffset.height.value / 100) * parentContentAbsoluteDimensions.height);
    }

    // Content Dimensions
    // px
    if (this._contentDimensions.width.unit === "px") {
      this._contentAbsoluteDimensions.width = this._contentDimensions.width.value;
    }
    if (this._contentDimensions.height.unit === "px") {
      this._contentAbsoluteDimensions.height = this._contentDimensions.height.value;
    }

    // %
    if (this._contentDimensions.width.unit === "%") {
      this._contentAbsoluteDimensions.width = Math.floor((this._contentDimensions.width.value / 100) * this._absoluteDimensions.width);
    }
    if (this._contentDimensions.height.unit === "%") {
      this._contentAbsoluteDimensions.height = Math.floor((this._contentDimensions.height.value / 100) * this._absoluteDimensions.height);
    }

    // Shrink the absolute content dimensions by the offset doubled
    this._contentAbsoluteDimensions.width -= this._contentAbsoluteOffset.width * 2;
    this._contentAbsoluteDimensions.height -= this._contentAbsoluteOffset.height * 2;

    const remainingContentAbsoluteDimensions = { ...this._contentAbsoluteDimensions };

    let totalChildrenPercentageWidth = 0;
    let totalChildrenPercentageHeight = 0;

    for (const childView of this.childViews) {
      if (this.childViewFlowDirection === "x") {
        if (childView._dimensions.width.unit === "%") {
          totalChildrenPercentageWidth += childView._dimensions.width.value;
          childView._dimensions.width.value = (childView._dimensions.width.value / totalChildrenPercentageWidth) * 100;
        }
      }

      if (this.childViewFlowDirection === "y") {
        if (childView._dimensions.height.unit === "%") {
          totalChildrenPercentageHeight += childView._dimensions.height.value;
          childView._dimensions.height.value = (childView._dimensions.height.value / totalChildrenPercentageHeight) * 100;
        }
      }

      childView._calculateSize(this._contentAbsoluteDimensions, remainingContentAbsoluteDimensions);
      if (this.childViewFlowDirection === "x") remainingContentAbsoluteDimensions.width -= childView._absoluteDimensions.width;
      if (this.childViewFlowDirection === "y") remainingContentAbsoluteDimensions.height -= childView._absoluteDimensions.height;
    }

    const currentContentTotalChildSize: { width: number; height: number } = { width: 0, height: 0 };

    for (const childView of this.childViews) {
      if (this.childViewFlowDirection === "x") currentContentTotalChildSize.width += childView.absoluteDimensions.width;
      if (this.childViewFlowDirection === "y") currentContentTotalChildSize.height += childView.absoluteDimensions.height;

      if (currentContentTotalChildSize.width > this.contentAbsoluteDimensions.width) {
        this.viewContext.screen.parentTerminal.renderError = new RenderError(
          `Content Width Exceeds Remaining Space, ${currentContentTotalChildSize.width} > ${this.contentAbsoluteDimensions.width}`,
        );
        break;
      }

      if (currentContentTotalChildSize.height > this.contentAbsoluteDimensions.height) {
        this.viewContext.screen.parentTerminal.renderError = new RenderError(
          `Content Height Exceeds Remaining Space, ${currentContentTotalChildSize.height} > ${this.contentAbsoluteDimensions.height}`,
        );
        break;
      }
    }
  }

  addChild<TV extends TerminalView>(view: new (viewContext: TerminalViewContext) => TV, cb?: (view: TV) => void) {
    const av = new view(this.viewContext);

    this.childViews.push(av);

    cb?.(av);

    return this;
  }

  async draw(screen: TerminalScreen, parentDrawOrigin: { x: number; y: number }) {
    const previousViewOrigin = { x: parentDrawOrigin.x, y: parentDrawOrigin.y };

    for (const childView of this.childViews) {
      await childView.draw(screen, previousViewOrigin);
      if (this.childViewFlowDirection === "x") previousViewOrigin.x += childView._absoluteDimensions.width;
      if (this.childViewFlowDirection === "y") previousViewOrigin.y += childView._absoluteDimensions.height;
      // screen.write(JSON.stringify({ parentDrawOrigin, type: childView.constructor.name }));
    }
  }
}
