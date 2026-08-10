import { type AppConfiguration, initDesktopApplication } from "@onlineworkspace/desktop";
import type { AddressInfo } from "node:net";
import { createServer as createViteServer } from "npm:vite"

const vs = await createViteServer({ configFile: "./vite.config.ts" })

const vsAddr = vs.httpServer.address() as AddressInfo

const APP_CONFIGURATION: AppConfiguration = {
  handleAuthentication: true,
  initialPath: "/",
  frontendBasePath: `http://127.0.0.1:${vsAddr.port}`,
  applicationId: "uk.ewsgit.files",
  displayName: "OW Files"
};

await initDesktopApplication(APP_CONFIGURATION, {});
