import { BoxRenderable, CliRenderer, createCliRenderer, InputRenderable, RGBA, ScrollBoxRenderable, TextRenderable } from "@opentui/core";
import type { Instance } from "../index.ts";
import { LogMessageStyle, LogType } from "../log.ts";
import System from "../system.ts";
import yargs from "yargs";

const COMPACT_LOG_TYPE = false;

const BACKGROUND_COLOR = RGBA.fromInts(15, 15, 20, 255);
const BORDER_COLOR = RGBA.fromInts(60, 60, 75, 255);
const TEXT_COLOR = RGBA.fromInts(220, 220, 225, 255);
const EMPHASIZED_TEXT_COLOR = RGBA.fromInts(242, 106, 141, 255);
const MESSAGE_TYPE_COLORS: { [type in LogType]: RGBA } = {
  [LogType.INFO]: RGBA.fromInts(58, 134, 255, 255),
  [LogType.WARNING]: RGBA.fromInts(247, 184, 1, 255),
  [LogType.ERROR]: RGBA.fromInts(240, 80, 80, 255),
  [LogType.SUCCESS]: RGBA.fromInts(6, 214, 160, 255),
  [LogType.DEBUG]: RGBA.fromInts(131, 56, 236, 255),
  [LogType.RAW]: RGBA.fromInts(240, 80, 80, 255),
};
const MESSAGE_LEVEL_COLOR = RGBA.fromInts(250, 163, 7, 255);

export default class TerminalUISystem extends System {
  private renderer!: CliRenderer;

  constructor(instance: Instance) {
    super("terminal_ui", instance);
  }

  override async startup(): Promise<boolean> {
    if (!process.stdout) return false;

    await super.startup();

    const self = this;

    this.renderer = await createCliRenderer({
      exitOnCtrlC: true,
      consoleOptions: {
        colorDefault: TEXT_COLOR,
        backgroundColor: BACKGROUND_COLOR,
        colorInfo: MESSAGE_TYPE_COLORS[LogType.INFO],
        colorWarn: MESSAGE_TYPE_COLORS[LogType.WARNING],
        colorError: MESSAGE_TYPE_COLORS[LogType.ERROR],
        colorDebug: MESSAGE_TYPE_COLORS[LogType.DEBUG],
      },
      consoleMode: "console-overlay",
      onDestroy: async () => {
        await this.instance.shutdown();
      },
    });

    self.renderer.setBackgroundColor(BACKGROUND_COLOR);

    const logContainer = new ScrollBoxRenderable(self.renderer, {
      height: "100%",
      width: "100%",
      border: true,
      borderStyle: "rounded",
      contentOptions: {
        flexDirection: "column",
      },
      focusedBorderColor: BORDER_COLOR,
      borderColor: BORDER_COLOR,
      stickyScroll: true,
      stickyStart: "bottom",
    });

    function addLogMessage(log: { type: LogType; level: string; message: string }) {
      const logEntry = new BoxRenderable(self.renderer, {
        flexDirection: "row",
        flexWrap: "no-wrap",
        flexShrink: 0,
      });
      logContainer.add(logEntry);
      const currentTypeColor = MESSAGE_TYPE_COLORS[log.type];

      if (COMPACT_LOG_TYPE) {
        logEntry.add(new TextRenderable(self.renderer, { content: "▌", fg: currentTypeColor }));
      } else {
        let typeString = "";

        switch (log.type) {
          case LogType.INFO:
            typeString = `${"INF"}`;
            break;
          case LogType.WARNING:
            typeString = `${"WAR"}`;
            break;
          case LogType.ERROR:
            typeString = `${"ERR"}`;
            break;
          case LogType.SUCCESS:
            typeString = `${"SUC"}`;
            break;
          case LogType.DEBUG:
            typeString = `${"DBG"}`;
            break;
          case LogType.RAW:
            typeString = `     `;
            break;
        }

        logEntry.add(new TextRenderable(self.renderer, { content: `${typeString}`, fg: currentTypeColor, paddingRight: 1, flexShrink: 0 }));
      }

      logEntry.add(new TextRenderable(self.renderer, { content: log.level.padEnd(16), fg: MESSAGE_LEVEL_COLOR, paddingRight: 1, flexShrink: 0 }));

      const logMessageContainer = new BoxRenderable(self.renderer, { flexDirection: "row", flexWrap: "wrap" });
      logEntry.add(logMessageContainer);

      const styledSegments = log.message.split("%");
      let currentMessageStyle: LogMessageStyle = LogMessageStyle.NORMAL;
      let customColorDef: RGBA | undefined;
      for (let segmentIdx = 0; segmentIdx < styledSegments.length; segmentIdx++) {
        const segmentContent = styledSegments[segmentIdx];

        if (segmentContent === "") continue;

        switch (`%${segmentContent}%`) {
          case LogMessageStyle.EMPHASIZED: {
            currentMessageStyle = LogMessageStyle.EMPHASIZED;
            continue;
          }
          case LogMessageStyle.NORMAL: {
            currentMessageStyle = LogMessageStyle.NORMAL;
            continue;
          }
          case LogMessageStyle.CUSTOM: {
            currentMessageStyle = LogMessageStyle.CUSTOM;
            continue;
          }
          case LogMessageStyle.END_CUSTOM: {
            currentMessageStyle = LogMessageStyle.END_CUSTOM;
            const colorValSegments = styledSegments[segmentIdx - 1].split(",").map((val) => Number(val));

            if (colorValSegments.length === 4) {
              customColorDef = RGBA.fromInts(colorValSegments[0], colorValSegments[1], colorValSegments[2], colorValSegments[3]);
            }

            continue;
          }
          case LogMessageStyle.RESET:
            currentMessageStyle = LogMessageStyle.RESET;
            continue;
        }

        switch (currentMessageStyle) {
          case LogMessageStyle.RESET:
          case LogMessageStyle.NORMAL:
            logMessageContainer.add(new TextRenderable(self.renderer, { content: segmentContent, fg: TEXT_COLOR, bg: BACKGROUND_COLOR }));
            break;
          case LogMessageStyle.EMPHASIZED:
            logMessageContainer.add(new TextRenderable(self.renderer, { content: segmentContent, fg: EMPHASIZED_TEXT_COLOR, bg: BACKGROUND_COLOR }));
            break;
          case LogMessageStyle.END_CUSTOM:
            logMessageContainer.add(new TextRenderable(self.renderer, { content: segmentContent, fg: customColorDef, bg: BACKGROUND_COLOR }));
            break;
        }
      }
    }

    for (const message of self.instance.log.allLogHistory) {
      addLogMessage(message);
    }

    self.instance.log._internal_onNewMessageListeners.push((message) => {
      addLogMessage(message);
    });

    self.renderer.root.add(logContainer);

    const commandInputContainer = new BoxRenderable(self.renderer, {
      border: true,
      borderStyle: "rounded",
      height: 3,
      width: "100%",
      borderColor: BORDER_COLOR,
      flexDirection: "row",
      gap: 1,
    });

    self.renderer.root.add(commandInputContainer);

    const PROMPT_STRING = `Online Workspace ${self.instance.versionString} >`;

    const promptMessage = new TextRenderable(self.renderer, {
      content: PROMPT_STRING,
      fg: RGBA.fromInts(242, 106, 141, 255),
      width: PROMPT_STRING.length,
    });

    commandInputContainer.add(promptMessage);

    const commandInput = new InputRenderable(self.renderer, {
      placeholder: "Click to start typing...",
      width: "100%",
      focusedBackgroundColor: BORDER_COLOR,

      onKeyDown(e) {
        if (e.name === "return") {
          const trimmedContent = commandInput.plainText.trim();
          if (!trimmedContent) return;
          self.instance.sys.consoleCommands.executeCommandFromString(trimmedContent);
          commandInput.clear();
        }
        commandInput.requestRender();
      },
    });
    commandInput.focus();
    commandInputContainer.add(commandInput);

    return true;
  }

  override stop(): this {
    this.renderer.destroy();

    return this;
  }
}
