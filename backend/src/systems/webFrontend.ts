import path from "node:path";
import type { RollupError } from "rollup";
import { build as buildVite, createServer as createViteServer, type Logger as ViteLogger, preview as previewVite, type PreviewServer, type ViteDevServer } from "vite";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class WebFrontendSystem extends System {
  viteServer!: ViteDevServer;
  previewServer?: PreviewServer;

  constructor(instance: Instance) {
    super("web_frontend", instance);
  }

  override async startup(): Promise<boolean> {
    if (this.instance.sys.configuration.isDevMode) {
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
        logger: this.createViteLogger(),
      });
      await this.viteServer.listen();
    } else {
      return await this.serveBuild();
    }
    return true;
  }

  /** Outside of DevMode the web frontend is built, then that build is served on the same port the dev server uses. */
  private async serveBuild(): Promise<boolean> {
    const root = path.join(this.instance.sys.filesystem.WEB_ROOT);
    const configFile = path.join(root, "vite.config.ts");
    try {
      this.log.info("Building the web frontend...");
      await buildVite({ configFile, root, logLevel: "silent" });

      this.previewServer = await previewVite({
        configFile,
        root,
        logLevel: "silent",
        preview: {
          port: 5173,
          host: true,
          strictPort: true,
          allowedHosts: [this.instance.sys.configuration.proxy.hostname],
        },
      });
      this.log.info("Serving the web frontend on port 5173");
    } catch (err) {
      this.log.error("Failed to build and serve the web frontend", err);
      return false;
    }
    return true;
  }

  /** Routes vite's output through the system's log. */
  private createViteLogger(): ViteLogger {
    const self = this;
    return {
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
    };
  }
}
