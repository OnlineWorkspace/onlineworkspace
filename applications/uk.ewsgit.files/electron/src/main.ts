import {app, BrowserWindow} from "electron"
import path from "node:path"

function createWindow() {
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
      preload: path.join(process.cwd(), "./src/preload.js")
    }
  })

  window.loadURL("https://localhost/app/uk.ewsgit.files")

  return window
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

