import type KeyPressEvent from "./events/keyPressEvent.ts";
import type MouseClickEvent from "./events/mouseClickEvent.ts";
import type ResizeScreenEvent from "./events/resizeScreenEvent.ts";
import type ScrollDownEvent from "./events/scrollDownEvent.ts";
import type ScrollUpEvent from "./events/scrollUpEvent.ts";

export enum TerminalEventType {
  MouseClick,
  ScrollUp,
  ScrollDown,
  KeyPress,
  ResizeScreen,
}

export default abstract class TerminalEvent {
  abstract type: TerminalEventType;
}

type TerminalEventMap = {
  [TerminalEventType.MouseClick]: MouseClickEvent;
  [TerminalEventType.ScrollUp]: ScrollUpEvent;
  [TerminalEventType.ScrollDown]: ScrollDownEvent;
  [TerminalEventType.KeyPress]: KeyPressEvent;
  [TerminalEventType.ResizeScreen]: ResizeScreenEvent;
};

export type TerminalEventListener<Ty extends keyof TerminalEventMap> = { type: Ty; cb: (event: TerminalEventMap[Ty]) => void };
