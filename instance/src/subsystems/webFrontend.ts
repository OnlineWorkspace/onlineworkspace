import path from "path";
import type { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import { createServer as createViteServer, type ViteDevServer } from "vite";

export default class WebFrontendSubsystem extends SubSystem {
    viteServer!: ViteDevServer;

    constructor(instance: Instance) {
        super("web_frontend", instance);

        return this;
    }

    async startup(): Promise<boolean> {
        this.viteServer = await createViteServer({
            configFile: path.join(this.instance.subSystems.filesystem.SRC_ROOT, "web/vite.config.ts"),
            configLoader: "native",
            root: path.join(this.instance.subSystems.filesystem.SRC_ROOT, "web"),
            clearScreen: false
        });

        await this.viteServer.listen()

        this.log.info("Listening for web requests at:")
        this.viteServer.printUrls()

        return true;
    }
}
