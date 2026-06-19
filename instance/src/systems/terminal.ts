import { CliRenderer, createCliRenderer, FrameBufferRenderable, type KeyEvent, OptimizedBuffer, RGBA } from "@opentui/core";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { LogType } from "../log.ts";

export default class TerminalUISystem extends System {
  constructor(instance: Instance) {
    super("terminal_ui", instance);
  }

  override async startup(): Promise<boolean> {
    if (!process.stdout) return false;

    await super.startup();

    const self = this;
    let framebuffer: OptimizedBuffer | null = null;
    let keyListener: ((key: KeyEvent) => void) | null = null;
    let resizeListener: ((width: number, height: number) => void) | null = null;

    let currentInput = "";

    let cursorVisible = true;
    let lastCursorToggle = Date.now();

    function todo(textContent: string) {
      if (!textContent.trim()) return;

      // do nothing right now

      self.instance.log.system.info(textContent);
    }

    async function run(renderer: CliRenderer): Promise<void> {
      renderer.start();

      let WIDTH = renderer.terminalWidth;
      let HEIGHT = renderer.terminalHeight;

      const framebufferRenderable = new FrameBufferRenderable(renderer, {
        id: "tui-container",
        width: WIDTH,
        height: HEIGHT,
        zIndex: 0,
      });
      renderer.root.add(framebufferRenderable);
      framebuffer = framebufferRenderable.frameBuffer;

      function renderUI(): void {
        if (!framebuffer) return;

        const fb = framebuffer;
        const w = fb.width;
        const h = fb.height;

        const bg = RGBA.fromInts(15, 15, 20, 255);
        const borderMuted = RGBA.fromInts(60, 60, 75, 255);
        const borderActive = RGBA.fromInts(100, 150, 240, 255);
        const textMain = RGBA.fromInts(220, 220, 225, 255);

        const messageTypeColors: { [type in LogType]: RGBA } = {
          [LogType.INFO]: RGBA.fromInts(50, 180, 255, 255),
          [LogType.WARNING]: RGBA.fromInts(240, 190, 60, 255),
          [LogType.ERROR]: RGBA.fromInts(240, 80, 80, 255),
          [LogType.SUCCESS]: RGBA.fromInts(240, 80, 80, 255),
          [LogType.DEBUG]: RGBA.fromInts(240, 80, 80, 255),
          [LogType.RAW]: RGBA.fromInts(240, 80, 80, 255),
          [LogType.PROMPT]: RGBA.fromInts(240, 80, 80, 255),
        };

        const messageLevel = RGBA.fromInts(250, 163, 7, 255);

        fb.fillRect(0, 0, w, h, bg);

        const inputAreaHeight = 3;
        const inputY = h - inputAreaHeight;
        const logAreaHeight = inputY - 1;

        const maxVisibleLogs = Math.max(1, logAreaHeight);
        const startingLogIndex = Math.max(0, self.instance.log.allLogHistory.length - maxVisibleLogs);
        const visibleLogs = self.instance.log.allLogHistory.slice(startingLogIndex);

        const COMPACT_LOG_TYPE = false;

        for (let i = 0; i < visibleLogs.length; i++) {
          const log = visibleLogs[i];
          const currentTypeColor = messageTypeColors[log.type];

          if (COMPACT_LOG_TYPE) fb.setCell(1, i, "▌", currentTypeColor, bg);

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
            case LogType.PROMPT:
              typeString = `${"PRM"} `;
              break;
            case LogType.RAW:
              typeString = `     `;
              break;
          }

          if (!COMPACT_LOG_TYPE)
            for (let charIdx = 0; charIdx < typeString.length; charIdx++) {
              fb.setCell(1 + charIdx, i, typeString[charIdx], messageTypeColors[log.type], bg);
            }

          for (let charIdx = 0; charIdx < log.level.length; charIdx++) {
            fb.setCell(COMPACT_LOG_TYPE ? 2 + charIdx : 1 + typeString.length + 1 + charIdx, i, log.level[charIdx], messageLevel, bg);
          }

          for (let charIdx = 0; charIdx < log.message.length; charIdx++) {
            fb.setCell(COMPACT_LOG_TYPE ? 2 + 16 + charIdx : 1 + typeString.length + 1 + 16 + charIdx, i, log.message[charIdx], textMain, bg);
          }
        }

        for (let x = 0; x < w; x++) {
          fb.setCell(x, inputY, "─", borderMuted, bg);
          fb.setCell(x, h - 1, "─", borderMuted, bg);
        }
        for (let y = inputY; y < h; y++) {
          fb.setCell(0, y, "│", borderMuted, bg);
          fb.setCell(w - 1, y, "│", borderMuted, bg);
        }
        fb.setCell(0, inputY, "╭", borderMuted, bg);
        fb.setCell(w - 1, inputY, "╮", borderMuted, bg);
        fb.setCell(0, h - 1, "╰", borderMuted, bg);
        fb.setCell(w - 1, h - 1, "╯", borderMuted, bg);

        const textY = inputY + 1;
        const prompt = `OnlineWorkspace ${self.instance.versionString} > `;

        for (let i = 0; i < prompt.length; i++) {
          fb.setCell(1 + i, textY, prompt[i], borderActive, bg);
        }

        const maxInputDisplayWidth = w - prompt.length - 4;
        const viewInput = currentInput.substring(Math.max(0, currentInput.length - maxInputDisplayWidth));

        for (let i = 0; i < viewInput.length; i++) {
          fb.setCell(1 + prompt.length + i, textY, viewInput[i], textMain, bg);
        }

        if (Date.now() - lastCursorToggle > 500) {
          cursorVisible = !cursorVisible;
          lastCursorToggle = Date.now();
        }

        if (cursorVisible) {
          const cursorX = 1 + prompt.length + viewInput.length;
          if (cursorX < w - 1) {
            fb.setCell(cursorX, textY, "█", borderActive, bg);
          }
        }
      }

      keyListener = (key: KeyEvent) => {
        if (key.name === "return" || key.name === "enter") {
          todo(currentInput);
          currentInput = "";
          cursorVisible = true;
        } else if (key.name === "backspace") {
          currentInput = currentInput.slice(0, -1);
          cursorVisible = true;
        } else if (key.sequence && key.sequence.length === 1) {
          currentInput += key.sequence;
          cursorVisible = true;
        }
      };
      renderer.keyInput.on("keypress", keyListener);

      resizeListener = (width: number, height: number) => {
        WIDTH = width;
        HEIGHT = height;
        if (framebuffer) {
          framebuffer.resize(width, height);
        }
      };
      renderer.on("resize", resizeListener);

      renderer.setFrameCallback(async () => {
        renderUI();
      });
    }

    function destroy(renderer: CliRenderer): void {
      renderer.clearFrameCallbacks();

      if (resizeListener) {
        renderer.off("resize", resizeListener);
        resizeListener = null;
      }

      if (keyListener) {
        renderer.keyInput.off("keypress", keyListener);
        keyListener = null;
      }

      renderer.root.remove("tui-container");
      framebuffer = null;
    }

    const renderer = await createCliRenderer({
      exitOnCtrlC: true,
    });
    await run(renderer);

    return true;
  }
}
