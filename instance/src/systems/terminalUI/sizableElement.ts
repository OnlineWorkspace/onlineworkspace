export default abstract class TerminalSizableElement {
  dimensions: {
    width: { value: number; unit: "%" | "rem%" | "px" };
    height: { value: number; unit: "%" | "rem%" | "px" };
    minWidth?: { value: number; unit: "%" | "px" };
    minHeight?: { value: number; unit: "%" | "px" };
    maxWidth?: { value: number; unit: "%" | "px" };
    maxHeight?: { value: number; unit: "%" | "px" };
  } = {
    width: {
      unit: "px",
      value: -1,
    },
    height: {
      unit: "px",
      value: -1,
    },
  };
  contentOffset: {
    width: {
      value: number;
      unit: "%" | "px";
    };
    height: {
      value: number;
      unit: "%" | "px";
    };
  } = {
    width: {
      unit: "px",
      value: 0,
    },
    height: {
      unit: "px",
      value: 0,
    },
  };
  contentDimensions: {
    width: {
      value: number;
      unit: "%" | "px";
    };
    height: {
      value: number;
      unit: "%" | "px";
    };
  } = {
    width: {
      unit: "px",
      value: 0,
    },
    height: {
      unit: "px",
      value: 0,
    },
  };
  contentAbsoluteDimensions: {
    width: number;
    height: number;
  } = {
    width: 1,
    height: 1,
  };
  contentAbsoluteOffset: {
    width: number;
    height: number;
  } = {
    width: 1,
    height: 1,
  };
  absoluteDimensions: {
    width: number;
    height: number;
  } = {
    width: 1,
    height: 1,
  };

  setDimensions(dimensions: TerminalSizableElement["dimensions"]) {
    this.dimensions = dimensions;

    return this;
  }

  calculateSize(
    parentContentAbsoluteDimensions: { width: number; height: number },
    parentContentRemainingAbsoluteDimensions: { width: number; height: number },
  ) {
    this.absoluteDimensions.width = 16;
    this.absoluteDimensions.height = 8;
    this.contentAbsoluteDimensions.width = 16;
    this.contentAbsoluteDimensions.height = 8;
    this.contentAbsoluteOffset.width = 0;
    this.contentAbsoluteOffset.height = 0;

    // Dimensions
    // px
    if (this.dimensions.width.unit === "px") {
      this.absoluteDimensions.width = this.dimensions.width.value;
    }
    if (this.dimensions.height.unit === "px") {
      this.absoluteDimensions.height = this.dimensions.height.value;
    }

    // %
    if (this.dimensions.width.unit === "%") {
      this.absoluteDimensions.width = Math.floor((this.dimensions.width.value / 100) * parentContentAbsoluteDimensions.width);
    }
    if (this.dimensions.height.unit === "%") {
      this.absoluteDimensions.height = Math.floor((this.dimensions.height.value / 100) * parentContentAbsoluteDimensions.height);
    }

    if (this.dimensions.width.unit === "rem%") {
      this.absoluteDimensions.width = Math.floor((this.dimensions.width.value / 100) * parentContentRemainingAbsoluteDimensions.width);
    }
    if (this.dimensions.height.unit === "rem%") {
      this.absoluteDimensions.height = Math.floor((this.dimensions.height.value / 100) * parentContentRemainingAbsoluteDimensions.height);
    }

    if (this.absoluteDimensions.width > parentContentAbsoluteDimensions.width) {
      this.absoluteDimensions.width = parentContentRemainingAbsoluteDimensions.width;
    }

    if (this.absoluteDimensions.height > parentContentAbsoluteDimensions.height) {
      this.absoluteDimensions.height = parentContentRemainingAbsoluteDimensions.height;
    }

    // Content Offset
    // px
    if (this.contentOffset.width.unit === "px") {
      this.contentAbsoluteOffset.width = this.contentOffset.width.value;
    }
    if (this.contentOffset.height.unit === "px") {
      this.contentAbsoluteOffset.height = this.contentOffset.height.value;
    }

    // %
    if (this.contentOffset.width.unit === "%") {
      this.contentAbsoluteOffset.width = Math.floor((this.contentOffset.width.value / 100) * parentContentAbsoluteDimensions.width);
    }
    if (this.contentOffset.height.unit === "%") {
      this.contentAbsoluteOffset.height = Math.floor((this.contentOffset.height.value / 100) * parentContentAbsoluteDimensions.height);
    }

    // Content Dimensions
    // px
    if (this.contentDimensions.width.unit === "px") {
      this.contentAbsoluteDimensions.width = this.contentDimensions.width.value;
    }
    if (this.contentDimensions.height.unit === "px") {
      this.contentAbsoluteDimensions.height = this.contentDimensions.height.value;
    }

    // %
    if (this.contentDimensions.width.unit === "%") {
      this.contentAbsoluteDimensions.width = Math.floor((this.contentDimensions.width.value / 100) * this.absoluteDimensions.width);
    }
    if (this.contentDimensions.height.unit === "%") {
      this.contentAbsoluteDimensions.height = Math.floor((this.contentDimensions.height.value / 100) * this.absoluteDimensions.height);
    }

    // Shrink the absolute content dimensions by the offset doubled
    this.contentAbsoluteDimensions.width -= this.contentAbsoluteOffset.width * 2;
    this.contentAbsoluteDimensions.height -= this.contentAbsoluteOffset.height * 2;
  }
}
