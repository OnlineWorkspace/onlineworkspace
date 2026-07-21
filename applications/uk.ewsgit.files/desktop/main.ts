import { type AppConfiguration, initDesktopApplication } from "@onlineworkspace/desktop";

const APP_CONFIGURATION: AppConfiguration = {
  handleAuthentication: true,
  initialPath: "/",
  frontendBasePath: "http://127.0.0.1:5175",
  applicationId: "uk.ewsgit.files",
  displayName: "OW Files"
};

await initDesktopApplication(APP_CONFIGURATION, {});
