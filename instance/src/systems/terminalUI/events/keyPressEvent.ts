import TerminalEvent, { TerminalEventType } from "../terminalEvent.ts";

export default class KeyPressEvent extends TerminalEvent {
  type: TerminalEventType = TerminalEventType.KeyPress as const;
  key: string;

  constructor(key: string) {
    super();

    this.key = key;
  }
}
