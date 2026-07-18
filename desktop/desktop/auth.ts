import { AppConfiguration, BINDING_PREFIX } from "./index.ts";

export function applyAuthBindings(
  appConfiguration: AppConfiguration,
  win: Deno.BrowserWindow,
) {
  win.bind(`${BINDING_PREFIX}`, async () => {
    return true;
  });
}

export async function startAuth(
  instanceBaseUrl: string,
  appConfiguration: AppConfiguration,
) {
  return new Promise<void>(async (resolve) => {
    const win = new Deno.BrowserWindow({
      resizable: false,
      width: 1000,
      height: 600,
    });

    win.show();
  });
}
