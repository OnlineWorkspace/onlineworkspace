import type { Instance } from "../index.ts";
import System from "../system.ts";
import Terminal from "./terminalUI/terminal.ts";
import TerminalBorderView from "./terminalUI/views/borderView.ts";
import TerminalContainerView from "./terminalUI/views/container.ts";
import TerminalCrossView from "./terminalUI/views/crossView.ts";
import TerminalTextInputView from "./terminalUI/views/textInput.ts";

export default class TerminalUISystem extends System {
  constructor(instance: Instance) {
    super("terminal_ui", instance);
  }

  override async startup(): Promise<boolean> {
    if (!process.stdout) return false;

    await super.startup();

    const terminal = new Terminal();

    // biome-ignore format: TUI description
    terminal.screen.childView.addChild(
      new TerminalContainerView().setFlowDirection("y")
        .addChild(
          new TerminalBorderView()
            .addChild(new TerminalContainerView().setFlowDirection("y")
              .addChild(
                new TerminalTextInputView()
                .setPlaceholder("Placeholder Text")
              )
              .addChild(
                new TerminalContainerView().setFlowDirection("x")
                  .addChild(new TerminalCrossView())
                  .addChild(new TerminalCrossView())
              )
            )
        )
        .addChild(
          new TerminalBorderView()
            .setDimensions({width: { unit: "%", value: 100 }, height: { unit: "px", value: 5 } })
        )
    );

    setInterval(async () => {
      await terminal.draw();
    }, 20);

    return true;
  }
}
