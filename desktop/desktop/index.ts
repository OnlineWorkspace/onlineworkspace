import { applyAuthBindings, startAuth } from "./auth.ts";

export const BINDING_PREFIX = "_ow_desktop_internal_"

export interface AppConfiguration {
  handleAuthentication: boolean;
}

export async function initDesktopApplication(
  appConfiguration: AppConfiguration,
  win: Deno.BrowserWindow
) {
  if (appConfiguration.handleAuthentication) {
    applyAuthBindings(appConfiguration, win)
  }
}
