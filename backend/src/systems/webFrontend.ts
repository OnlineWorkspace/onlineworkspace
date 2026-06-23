import path from "node:path";
import type { RollupError } from "rollup";
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
      const self = this;
      this.viteServer = await createViteServer({
        configFile: path.join(this.instance.sys.filesystem.WEB_ROOT, "vite.config.ts"),
        root: path.join(this.instance.sys.filesystem.WEB_ROOT),
        clearScreen: false,
        server: {
          port: 5173,
          host: true,
          strictPort: true,
          allowedHosts: [this.instance.sys.configuration.proxy.hostname],
          hmr: {
            clientPort: 443,
            protocol: "wss",
            host: this.instance.sys.configuration.proxy.hostname,
          },
        },
        forceOptimizeDeps: true,
        logger: {
          info(msg: string, options?: { clear?: boolean; timestamp?: boolean; environment?: string }) {
            self.log.info(msg, options);
          },
          warn(msg: string, options?: { clear?: boolean; timestamp?: boolean; environment?: string }) {
            self.log.warning(msg, options);
          },
          warnOnce(msg: string, options?: { clear?: boolean; timestamp?: boolean; environment?: string }) {
            self.log.warning(msg, options);
          },
          error(
            msg: string,
            options?: {
              clear?: boolean;
              timestamp?: boolean;
              environment?: string;
              error?: Error | RollupError | null;
            },
          ) {
            self.log.error(msg, options);
          },
          clearScreen(type: "error" | "warn" | "info") {
            // do nothing
            type;
          },
          hasErrorLogged(error: Error | RollupError) {
            // do nothing
            error;
            return true;
          },
          hasWarned: false,
        },
      });
      await this.viteServer.listen();
    } else {
      this.log.warning("The Web frontend is not handled by the OnlineWorkspace instance backend when running outside of DevMode.");
    }
    return true;
  }
}
