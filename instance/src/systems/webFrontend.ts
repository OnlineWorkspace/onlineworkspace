import path from "path";
import type { Instance } from "../index.js";
import System from "../system.js";
import { createServer as createViteServer, LogErrorOptions, LogOptions, LogType, type ViteDevServer } from "vite";
import { RollupError } from "rollup";

export default class WebFrontendSystem extends System {
    viteServer!: ViteDevServer;

    constructor(instance: Instance) {
        super("web_frontend", instance);

        return this;
    }

    async startup(): Promise<boolean> {
        if (this.instance.sys.configuration.isDevMode) {
            this.viteServer = await createViteServer({
                configFile: path.join(this.instance.sys.filesystem.SRC_ROOT, "web/vite.config.ts"),
                configLoader: "native",
                root: path.join(this.instance.sys.filesystem.SRC_ROOT, "web"),
                clearScreen: false,
            });

            await this.viteServer.listen();

            this.log.info("Listening for web requests at:");
            this.viteServer.printUrls();
        }

        return true;
    }
}
