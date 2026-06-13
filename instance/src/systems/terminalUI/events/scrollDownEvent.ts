import TerminalEvent, { TerminalEventType } from "../terminalEvent.ts";

export default class ScrollDownEvent extends TerminalEvent {
  type: TerminalEventType = TerminalEventType.ScrollDown as const;
  yVector: number;

  constructor(yVector: ScrollDownEvent["yVector"]) {
    super();

    this.yVector = yVector * -1;
  }
}
