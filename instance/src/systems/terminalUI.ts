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
      TerminalContainerView, v => v.setFlowDirection("y")
        .addChild(
          TerminalBorderView, v => v
            .addChild(TerminalContainerView, v => v.setFlowDirection("y")
              .addChild(
                TerminalTextInputView, v => v
                .setPlaceholder("Placeholder Text")
              )
              .addChild(
                TerminalContainerView, v => v.setFlowDirection("x")
                  .addChild(TerminalCrossView)
                  .addChild(TerminalCrossView)
              )
            )
        )
        // .addChild(
        //   TerminalBorderView, v=>v
        //     .setDimensions({width: { unit: "%", value: 100 }, height: { unit: "px", value: 5 } })
        // )
    );

    setInterval(async () => {
      await terminal.draw();
    }, 100);

    return true;
  }
}
