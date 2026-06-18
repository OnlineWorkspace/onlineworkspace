import type TerminalView from "./view.ts";

enum TerminalScalarValueOperation {
  Set,
  Add,
  Subtract,
  Multiply,
  Divide,
  Floor,
  Ceil,
}

export enum TerminalScalarValueUnit {
  Cell,
  Percentage,
}

export default class TerminalScalarValue {
  operationChain: [TerminalScalarValueOperation, number?, TerminalScalarValueUnit?][];

  constructor();
  constructor(value: number, unit: TerminalScalarValueUnit);
  constructor(value?: number, unit?: TerminalScalarValueUnit) {
    this.operationChain = [];

    if (value !== undefined && unit !== undefined) {
      this.set(value, unit);
    }
  }

  set(value: number, unit: TerminalScalarValueUnit) {
    this.operationChain.push([TerminalScalarValueOperation.Set, value, unit]);
    return this;
  }

  add(value: number, unit: TerminalScalarValueUnit) {
    this.operationChain.push([TerminalScalarValueOperation.Add, value, unit]);
    return this;
  }

  subtract(value: number, unit: TerminalScalarValueUnit) {
    this.operationChain.push([TerminalScalarValueOperation.Subtract, value, unit]);
    return this;
  }

  multiply(value: number) {
    this.operationChain.push([TerminalScalarValueOperation.Multiply, value]);
    return this;
  }

  divide(value: number) {
    this.operationChain.push([TerminalScalarValueOperation.Divide, value]);
    return this;
  }

  floor() {
    this.operationChain.push([TerminalScalarValueOperation.Floor]);
    return this;
  }

  ceil() {
    this.operationChain.push([TerminalScalarValueOperation.Ceil]);
    return this;
  }

  _internal_calculateFromView(view: TerminalView, valueType: "width" | "height"): number {
    let maxSize = 0;

    if (valueType === "height") {
      maxSize = view.viewProperties._absolute.contentHeight;
    }
    if (valueType === "width") {
      maxSize = view.viewProperties._absolute.contentWidth;
    }

    let val = 0;

    for (const operation of this.operationChain) {
      switch (operation[0]) {
        case TerminalScalarValueOperation.Set: {
          switch (operation[2]) {
            case TerminalScalarValueUnit.Cell: {
              val = operation[1]!;
              break;
            }
            case TerminalScalarValueUnit.Percentage: {
              val = (maxSize / 100) * operation[1]!;
              break;
            }
          }
          break;
        }
        case TerminalScalarValueOperation.Add: {
          switch (operation[2]) {
            case TerminalScalarValueUnit.Cell: {
              val += operation[1]!;
              break;
            }
            case TerminalScalarValueUnit.Percentage: {
              val += (maxSize / 100) * operation[1]!;
              break;
            }
          }
          break;
        }
        case TerminalScalarValueOperation.Subtract: {
          switch (operation[2]) {
            case TerminalScalarValueUnit.Cell: {
              val -= operation[1]!;
              break;
            }
            case TerminalScalarValueUnit.Percentage: {
              val -= (maxSize / 100) * operation[1]!;
              break;
            }
          }
          break;
        }
        case TerminalScalarValueOperation.Multiply: {
          val *= operation[1]!;
          break;
        }
        case TerminalScalarValueOperation.Divide: {
          val /= operation[1]!;
          break;
        }
        case TerminalScalarValueOperation.Floor: {
          val = Math.floor(val);
          break;
        }
        case TerminalScalarValueOperation.Ceil: {
          val = Math.ceil(val);
          break;
        }
      }
    }

    return val;
  }
}
