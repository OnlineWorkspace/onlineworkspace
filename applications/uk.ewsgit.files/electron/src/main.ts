import path from "node:path";
import {app, BrowserWindow, session} from "electron";

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

  if ((await session.defaultSession.cookies.get({url: "https://localhost"})).length === 0) {
    window.loadURL("https://localhost/?redirect=/app/uk.ewsgit.files/");
  } else {
    window.loadURL("https://localhost/app/uk.ewsgit.files");
  }

  return window;
}

app.whenReady().then(() => {
  createWindow();

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
