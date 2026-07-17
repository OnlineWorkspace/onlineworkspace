import { startAuth } from "./auth.ts";

export interface AppConfiguration {
  /** app identifier (com.example.files) */
  id: string;
  /** app display name 'Files' */
  displayName: string;
  developmentStartPageUrl?: string;
  startPageUrl: string;
  enforceLogin: boolean;
}

export const IS_DEVELOPMENT = true;

export async function createDesktopApplication(
  appConfiguration: AppConfiguration,
) {
  const INSTANCE_BASE_URL = "https://localhost";

  if (appConfiguration.enforceLogin) {
    await startAuth(INSTANCE_BASE_URL, appConfiguration);
  }

  const win = new Deno.BrowserWindow({
    title: appConfiguration.displayName,
    width: 1200,
    height: 800,
  });

  win.show();

  if (IS_DEVELOPMENT) {
    win.navigate(
      appConfiguration.developmentStartPageUrl ||
        appConfiguration.startPageUrl,
    );
  } else {
    win.navigate(appConfiguration.startPageUrl);
  }
}
