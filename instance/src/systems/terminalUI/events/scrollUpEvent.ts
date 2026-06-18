import TerminalEvent, { TerminalEventType } from "../terminalEvent.ts";

export default class ScrollUpEvent extends TerminalEvent {
  type: TerminalEventType = TerminalEventType.ScrollUp as const;
  yVector: number;

  constructor(yVector: ScrollUpEvent["yVector"]) {
    super();

    this.yVector = yVector;
  }
}
