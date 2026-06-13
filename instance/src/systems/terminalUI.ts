import type { Instance } from "../index.ts";
import System from "../system.ts";
import TerminalPane from "./terminalUI/pane.ts";
import { cursorTo } from "./terminalUI/stdout.ts";
import Terminal from "./terminalUI/terminal.ts";
import TerminalBorderView from "./terminalUI/views/borderView.ts";
import TerminalCrossView from "./terminalUI/views/crossView.ts";

export default class TerminalUISystem extends System {
  constructor(instance: Instance) {
    super("terminal_ui", instance);
  }

  override async startup(): Promise<boolean> {
    if (!process.stdout) return false;

    await super.startup();

    const terminal = new Terminal();
    const testPane = new TerminalPane(terminal.activeScreen, { width: { unit: "%", value: 100 }, height: { unit: "%", value: 100 } });

    const borderView = new TerminalBorderView();
    borderView.childViews.push(new TerminalCrossView());
    // borderView.childViews.push(new TerminalCrossView());
    // borderView.childViews.push(new TerminalCrossView());
    // borderView.childViews.push(new TerminalCrossView());
    // borderView.childViews.push(new TerminalCrossView());
    // borderView.childViews.push(new TerminalCrossView());

    testPane.childViews.push(borderView);

    terminal.activeScreen.visiblePanes.push(testPane);

    await terminal.draw();
    setInterval(async () => {
      await terminal.draw();
      await cursorTo(terminal.width, terminal.height);
    }, 50);

    return true;
  }
}
