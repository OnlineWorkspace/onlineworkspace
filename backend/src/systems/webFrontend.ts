import path from "node:path";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class WebFrontendSystem extends System {
  viteServer!: ViteDevServer;

  constructor(instance: Instance) {
    super("web_frontend", instance);
  }

  override async startup(): Promise<boolean> {
    if (this.instance.sys.configuration.isDevMode) {
      this.viteServer = await createViteServer({
        configFile: path.join(this.instance.sys.filesystem.SRC_ROOT, "../../web/vite.config.ts"),
        root: path.join(this.instance.sys.filesystem.SRC_ROOT, "../../web"),
        clearScreen: false,
      });
      await this.viteServer.listen();
      this.log.info("Listening for web requests:");
    }
    return true;
  }
}
