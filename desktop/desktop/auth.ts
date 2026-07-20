import { type AppConfiguration, applyCoreBindings } from "./index.ts";

export const AUTH_BINDING_PREFIX = `_ow_desktop_internal_core_auth_`;

export enum AuthBindingEndpoints {
  GetInstanceUrl,
  IsAuthenticated,
  AuthenticationComplete
}

export function applyAuthBindings(win: Deno.BrowserWindow, onAuthenticationComplete?: () => void) {
  win.bind(
    `${AUTH_BINDING_PREFIX}${AuthBindingEndpoints.GetInstanceUrl}`,
    async () => {
      return `https://localhost`;
    },
  );

  win.bind(
    `${AUTH_BINDING_PREFIX}${AuthBindingEndpoints.IsAuthenticated}`,
    async () => {
      return false;
    },
  );

    win.bind(
    `${AUTH_BINDING_PREFIX}${AuthBindingEndpoints.AuthenticationComplete}`,
    async () => {
      onAuthenticationComplete();
      return false;
    },
  );
}

export function startAuth(appConfiguration: AppConfiguration) {
  return new Promise<void>(async (resolve) => {
    const win = new Deno.BrowserWindow({
      resizable: false,
      width: 1000,
      height: 600
    });

    applyCoreBindings(appConfiguration, win);
    applyAuthBindings(win, () => {
      resolve();
    });

    win.navigate(
      `${appConfiguration.frontendBasePath}/ow_desktop_integration/auth/flow`,
    );

    win.show();
  });
}
