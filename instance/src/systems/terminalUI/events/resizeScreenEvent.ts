import TerminalEvent, { TerminalEventType } from "../terminalEvent.ts";

export default class ResizeScreenEvent extends TerminalEvent {
  type: TerminalEventType = TerminalEventType.ResizeScreen as const;
  dimensions: { width: number; height: number };

  constructor(dimensions: ResizeScreenEvent["dimensions"]) {
    super();

    this.dimensions = dimensions;
  }
}
