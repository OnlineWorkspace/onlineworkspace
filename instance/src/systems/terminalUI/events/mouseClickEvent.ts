import TerminalEvent, { TerminalEventType } from "../terminalEvent.ts";

export default class MouseClickEvent extends TerminalEvent {
  type: TerminalEventType = TerminalEventType.MouseClick as const;
  position: { x: number; y: number };

  constructor(position: MouseClickEvent["position"]) {
    super();

    this.position = position;
  }
}
