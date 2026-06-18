import RenderError from "./renderError.ts";
import TerminalScalarValue, { TerminalScalarValueUnit } from "./scalarValue.ts";
import type TerminalScreen from "./screen.ts";
import type { TerminalEventListener, TerminalEventType } from "./terminalEvent.ts";

export type TerminalViewContext = TerminalView["viewContext"];

export default abstract class TerminalView {
  viewContext!: { screen: TerminalScreen; parentView?: TerminalView };

  viewProperties: {
    width: TerminalScalarValue;
    height: TerminalScalarValue;
    contentHeight: TerminalScalarValue;
    contentWidth: TerminalScalarValue;
    contentOffsetX: TerminalScalarValue;
    contentOffsetY: TerminalScalarValue;
    // managed by calculateAbsoluteProperties (DO NOT EDIT)
    _absolute: {
      drawOriginX: number;
      drawOriginY: number;
      width: number;
      height: number;
      contentWidth: number;
      contentHeight: number;
      contentOffsetX: number;
      contentOffsetY: number;
    };
  } = {
    width: new TerminalScalarValue().set(0, TerminalScalarValueUnit.Cell),
    height: new TerminalScalarValue().set(0, TerminalScalarValueUnit.Cell),
    contentHeight: new TerminalScalarValue().set(0, TerminalScalarValueUnit.Cell),
    contentWidth: new TerminalScalarValue().set(0, TerminalScalarValueUnit.Cell),
    contentOffsetX: new TerminalScalarValue().set(0, TerminalScalarValueUnit.Cell),
    contentOffsetY: new TerminalScalarValue().set(0, TerminalScalarValueUnit.Cell),
    // managed by calculateAbsoluteProperties (DO NOT EDIT)
    _absolute: {
      drawOriginX: 0,
      drawOriginY: 0,
      width: 0,
      height: 0,
      contentWidth: 0,
      contentHeight: 0,
      contentOffsetX: 0,
      contentOffsetY: 0,
    },
  };

  eventListeners: TerminalEventListener<TerminalEventType>[];
  childViews: TerminalView[];
  childViewFlowDirection: "x" | "y" = "x";

  constructor(viewContext: TerminalViewContext) {
    this.viewContext = viewContext;

    if (!this.viewContext.screen) throw new Error(`This TerminalView -> ${this.constructor.name} was not initialized correctly!`);

    this.childViews = [];
    this.eventListeners = [];
  }

  calculateAbsoluteProperties() {
    /* // Dimensions
    // px
    if (this.viewProperties.dimensions.width.unit === "px") {
      this._absoluteDimensions.width = this.viewProperties.dimensions.width.value;
    }
    if (this.viewProperties.dimensions.height.unit === "px") {
      this._absoluteDimensions.height = this.viewProperties.dimensions.height.value;
    }

    // %
    if (this.viewProperties.dimensions.width.unit === "%") {
      this._absoluteDimensions.width = Math.floor((this.viewProperties.dimensions.width.value / 100) * parentContentAbsoluteDimensions.width);
    }
    if (this.viewProperties.dimensions.height.unit === "%") {
      this._absoluteDimensions.height = Math.floor((this.viewProperties.dimensions.height.value / 100) * parentContentAbsoluteDimensions.height);
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
    } */

    if (this.childViewFlowDirection === "x") {
      let xWidthPercentageTotal = 0;
      for (const childView of this.childViews) {
      }
    }
  }

  addChild<TV extends TerminalView>(view: new (viewContext: TerminalViewContext) => TV, cb?: (view: TV) => void) {
    const av = new view({ ...this.viewContext, parentView: this });

    this.childViews.push(av);

    cb?.(av);

    return this;
  }

  async draw(drawProperties: TerminalView["viewProperties"]["_absolute"]) {
    for (const childView of this.childViews) {
      await childView.draw(drawProperties);
    }
  }
}
