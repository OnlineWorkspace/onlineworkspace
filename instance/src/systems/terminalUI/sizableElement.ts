export default abstract class TerminalSizableElement {
  dimensions: {
    width: { value: number; unit: "%" | "px" };
    height: { value: number; unit: "%" | "px" };
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
    width: 0,
    height: 0,
  };
  absoluteDimensions: {
    width: number;
    height: number;
  } = {
    width: 1,
    height: 1,
  };

  calculateSize(parentContentAbsoluteDimensions: { width: number; height: number }) {
    this.absoluteDimensions.width = 16;
    this.absoluteDimensions.height = 8;
    this.contentAbsoluteDimensions.width = 16;
    this.contentAbsoluteDimensions.height = 8;
    this.contentAbsoluteOffset.width = 0;
    this.contentAbsoluteOffset.height = 0;

    // TODO: some maths here to calc the actual size

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

    if (this.absoluteDimensions.width > parentContentAbsoluteDimensions.width) {
      this.absoluteDimensions.width = parentContentAbsoluteDimensions.width;
    }

    if (this.absoluteDimensions.height > parentContentAbsoluteDimensions.height) {
      this.absoluteDimensions.height = parentContentAbsoluteDimensions.height;
    }

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
  }
}
