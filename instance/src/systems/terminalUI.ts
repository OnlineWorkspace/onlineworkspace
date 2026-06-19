import { CliRenderer, createCliRenderer, FrameBufferRenderable, type KeyEvent, OptimizedBuffer, RGBA } from "@opentui/core";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class TerminalUISystem extends System {
  constructor(instance: Instance) {
    super("terminal_ui", instance);
  }

  override async startup(): Promise<boolean> {
    if (!process.stdout) return false;

    await super.startup();

    let framebuffer: OptimizedBuffer | null = null;
    let resizeListener: ((width: number, height: number) => void) | null = null;

    async function run(renderer: CliRenderer): Promise<void> {
      renderer.start();

      let WIDTH = renderer.terminalWidth;
      let HEIGHT = renderer.terminalHeight;

      const framebufferRenderable = new FrameBufferRenderable(renderer, {
        id: "display",
        width: WIDTH,
        height: HEIGHT,
        zIndex: 0,
      });
      renderer.root.add(framebufferRenderable);
      framebuffer = framebufferRenderable.frameBuffer;

      function renderWelcome(): void {
        if (!framebuffer) return;

        const fb = framebuffer;
        const totalWidth = fb.width;
        const totalHeight = fb.height;

        const bgColor = RGBA.fromInts(15, 15, 20, 255);
        const welcomeColor = RGBA.fromInts(50, 220, 100, 255);

        fb.fillRect(0, 0, totalWidth, totalHeight, bgColor);

        const message = "Welcome to the System!";

        const startX = Math.floor((totalWidth - message.length) / 2);
        const startY = Math.floor(totalHeight / 2);

        if (startX >= 0 && startY >= 0) {
          for (let i = 0; i < message.length; i++) {
            fb.setCell(startX + i, startY, message[i], welcomeColor, bgColor);
          }
        }
      }

      resizeListener = (width: number, height: number) => {
        WIDTH = width;
        HEIGHT = height;
        if (framebuffer) {
          framebuffer.resize(width, height);
        }
      };
      renderer.on("resize", resizeListener);

      renderer.setFrameCallback(async () => {
        renderWelcome();
      });
    }

    function destroy(renderer: CliRenderer): void {
      renderer.clearFrameCallbacks();

      if (resizeListener) {
        renderer.off("resize", resizeListener);
        resizeListener = null;
      }

      renderer.root.remove("display");
      framebuffer = null;
    }

    const renderer = await createCliRenderer({
      exitOnCtrlC: true,
      targetFps: 30,
    });
    await run(renderer);

    return true;
  }
}
