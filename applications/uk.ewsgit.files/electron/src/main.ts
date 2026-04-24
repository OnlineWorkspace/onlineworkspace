import path from "node:path";
import { app, BrowserWindow, ipcMain, session } from "electron";
import { promises as fs } from "node:fs";
import sharp from "sharp";

async function createWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 800,
    minHeight: 600,
    minWidth: 769,
    transparent: true,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    frame: true,
    webPreferences: {
      preload: path.join(process.cwd(), "./src/preload.js"),
    },
  });

  if ((await session.defaultSession.cookies.get({ url: "https://localhost" })).length === 0) {
    window.loadURL("https://localhost/?redirect=/app/uk.ewsgit.files/");
  } else {
    window.loadURL("https://localhost/app/uk.ewsgit.files");
  }

  return window;
}

function getFileType(path: string) {
  const extension = path.split(".").pop();

  switch (extension) {
    case "avif":
    case "webp":
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image";
    case "txt":
    case "json":
    case "js":
    case "ts":
    case "tsx":
    case "scss":
    case "sass":
    case "yml":
    case "yaml":
    case "xml":
    case "py":
    case "toml":
    case "rs":
    case "html":
    case "htm":
    case "css":
    case "jsm":
    case "tsm":
    case "tsc":
    case "jsc":
    case "sql":
    case "lock":
      return "plaintext";
  }

  return undefined;
}

app.whenReady().then(async () => {
  const window = await createWindow();

  ipcMain.on("minimize_window", () => window.minimize());
  ipcMain.on("maximize_window", () => (window.isMaximized() ? window.unmaximize() : window.maximize()));
  ipcMain.on("close_window", () => window.close());

  ipcMain.handle("fs:readdir", async (_, [p, options]: [string, any]) => {
    const resolvedPath = path.resolve(p);

    try {
      return { status: "ok", items: await fs.readdir(resolvedPath, options) };
    } catch (_) {
      return { status: "missing_permission" };
    }
  });

  ipcMain.handle("files:get_entry", async (_, [p, thumbnailSize]: [string, number]) => {
    const resolvedPath = path.resolve(p);

    try {
      const itemStats = await fs.lstat(resolvedPath);

      let thumbnail: Buffer | undefined = undefined;

      if (getFileType(p) === "image") {
        thumbnail = await new Promise<Buffer>((resolve) => {
          sharp(resolvedPath)
            .toFormat("webp")
            .resize(thumbnailSize)
            .toBuffer((_, buffer) => {
              resolve(buffer);
            });
        });
      }

      return {
        status: "ok",
        data: {
          path: p,
          type: itemStats.isSymbolicLink() ? "link" : itemStats.isDirectory() ? "directory" : itemStats.isFile() ? "file" : "file",
          // TODO: implement sharing first
          shared: false,
          size: itemStats.size,
          thumbnail: thumbnail ? `data:image/${path.extname(resolvedPath)};base64,${thumbnail}` : undefined,
        },
      };
    } catch (_) {
      return {
        status: "invalid_path",
      };
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
