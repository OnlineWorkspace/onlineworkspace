import { type AppConfiguration, IS_DEVELOPMENT } from "./index.ts";

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

    if (IS_DEVELOPMENT) {
      win.navigate(
        `${instanceBaseUrl}/auth/app/flow/?app_id=${
          encodeURIComponent(appConfiguration.id)
        }&app_display_name=${
          encodeURIComponent(appConfiguration.displayName)
        }&redirect=${
          encodeURIComponent(
            appConfiguration.developmentStartPageUrl ||
              appConfiguration.startPageUrl,
          )
        }`,
      );
    } else {
      win.navigate(
        `${instanceBaseUrl}/auth/app/flow/?app_id=${
          encodeURIComponent(appConfiguration.id)
        }&app_display_name=${
          encodeURIComponent(appConfiguration.displayName)
        }&redirect=${encodeURIComponent(appConfiguration.startPageUrl)}`,
      );
    }
  });
}
