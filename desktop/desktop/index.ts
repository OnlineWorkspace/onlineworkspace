import { applyAuthBindings, startAuth } from "./auth.ts";

export interface AppConfiguration {
  handleAuthentication: boolean;
  frontendBasePath: string;
  initialPath: string;
  applicationId: string;
  displayName: string;
}

export const CORE_BINDING_PREFIX = `_ow_desktop_internal_core_`

export enum CoreBindingEndpoints {
  GetConfiguration
}

export function applyCoreBindings(appConfiguration: AppConfiguration, win: Deno.BrowserWindow) {
  win.bind(`${CORE_BINDING_PREFIX}${CoreBindingEndpoints.GetConfiguration}`, async () => {
    return appConfiguration as unknown as Record<string, unknown>
  })
}

export async function initDesktopApplication(
  appConfiguration: AppConfiguration,
  windowOptions: Deno.BrowserWindowOptions
) {
  if (appConfiguration.handleAuthentication) {
    await startAuth(appConfiguration)
  }

  const win = new Deno.BrowserWindow(windowOptions)

  applyCoreBindings(appConfiguration, win)

  if (appConfiguration.handleAuthentication) {
    applyAuthBindings(win)
  }

  win.navigate(`${appConfiguration.frontendBasePath}${appConfiguration.initialPath}`)

  return win;
}

export { AuthBindingEndpoints } from "./auth.ts"
