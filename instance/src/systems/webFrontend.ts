import path from "node:path";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import type { Instance } from "../index.js";
import System from "../system.js";

export default class WebFrontendSystem extends System {
  viteServer!: ViteDevServer;

  constructor(instance: Instance) {
    super("web_frontend", instance);
  }

  async startup(): Promise<boolean> {
    if (process.platform === "darwin") {
      this.log.info(
        "You will have to run the vite server separately as it breaks under MacOS, change into the `instance/src` directory and run `npx vite --config ./web/vite.config.ts ./web`",
      );

      return false;
    }

    if (this.instance.sys.configuration.isDevMode) {
      this.viteServer = await createViteServer({
        configFile: path.join(this.instance.sys.filesystem.SRC_ROOT, "web/vite.config.ts"),
        root: path.join(this.instance.sys.filesystem.SRC_ROOT, "web"),
        clearScreen: false,
      });
      await this.viteServer.listen();
      this.log.info("Listening for web requests:");
    }
    return true;
  }
}
