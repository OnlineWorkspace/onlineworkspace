import type TerminalSizableElement from "./sizableElement.ts";

enum TerminalScalarValueOperation {
  Add,
  Subtract,
  Multiply,
  Divide,
  Floor,
  Ceil,
}

export enum TerminalScalarValueUnit {
  Pixel,
  PercentageOfOriginalValue,
}

export default class TerminalScalarValue {
  operationChain: [TerminalScalarValueOperation, number?, TerminalScalarValueUnit?][];

  constructor() {
    this.operationChain = [];
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

  _internal_calculateFromSizableElement(sizableElement: TerminalSizableElement, valueType: "width" | "height"): number {
    let val = sizableElement.absoluteDimensions[valueType];

    for (const operation of this.operationChain) {
      switch (operation[0]) {
        case TerminalScalarValueOperation.Add: {
          switch (operation[2]) {
            case TerminalScalarValueUnit.Pixel: {
              val += operation[1]!;
              break;
            }
            case TerminalScalarValueUnit.PercentageOfOriginalValue: {
              val += (val / 100) * operation[1]!;
              break;
            }
          }
          break;
        }
        case TerminalScalarValueOperation.Subtract: {
          switch (operation[2]) {
            case TerminalScalarValueUnit.Pixel: {
              val -= operation[1]!;
              break;
            }
            case TerminalScalarValueUnit.PercentageOfOriginalValue: {
              val -= (val / 100) * operation[1]!;
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
