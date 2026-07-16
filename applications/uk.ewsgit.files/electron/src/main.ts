import { promises as fs } from "node:fs";
import * as os from "node:os";
import path from "node:path";
import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import fuse from "node-fuse-bindings";
import sharp from "sharp";

async function createWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 800,
    minHeight: 800,
    minWidth: 1000,
    transparent: true,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    frame: true,
    icon: path.join(process.cwd(), "../assets/uk.ewsgit.files64.png"),
    webPreferences: {
      preload: path.join(process.cwd(), "./src/preload.js"),
    },
  });

  if ((await session.defaultSession.cookies.get({ url: "https://localhost" })).length === 0) {
    await window.loadURL("https://localhost/?redirect=/app/uk.ewsgit.files/");
  } else {
    await window.loadURL("https://localhost/app/uk.ewsgit.files");
  }

  return window;
}

function getFileType(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();

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

      let thumbnail: Buffer | undefined;

      if (getFileType(p) === "image") {
        thumbnail = await new Promise<Buffer>((resolve) => {
          sharp(resolvedPath)
            .toFormat("webp")
            .resize(thumbnailSize, thumbnailSize)
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
          thumbnail: thumbnail,
          hidden: path.basename(p).startsWith("."),
          createdAt: itemStats.ctimeMs,
          modifiedAt: itemStats.atimeMs,
        },
      };
    } catch (_) {
      return {
        status: "invalid_path",
      };
    }
  });

  ipcMain.handle("files:os_platform", () => {
    return process.platform;
  });

  ipcMain.handle("files:open_in_default_application", async (_, [p]: [string]) => {
    const errorMessage = await shell.openPath(p);

    if (errorMessage !== "") {
      return { status: errorMessage };
    }

    return { status: "ok" };
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

const REMOTE_MOUNT_PATH = process.platform !== "win32" ? path.join(os.homedir(), `./ow_remote`) : "R:\\";

try {
  await fs.stat(REMOTE_MOUNT_PATH);
} catch (_) {
  await fs.mkdir(REMOTE_MOUNT_PATH, { recursive: true });
}
//
// fuse.mount(
//   REMOTE_MOUNT_PATH,
//   {
//     readdir(path, cb) {
//       console.log("readdir(%s)", path);
//       if (path === "/") return cb(0, ["test"]);
//       cb(0, []);
//     },
//     getattr(path, cb) {
//       console.log("getattr(%s)", path);
//       if (path === "/") {
//         cb(0, {
//           mtime: new Date(),
//           atime: new Date(),
//           ctime: new Date(),
//           nlink: 1,
//           size: 100,
//           mode: 16877,
//           uid: process.getuid ? process.getuid() : 0,
//           gid: process.getgid ? process.getgid() : 0,
//           isFile() {
//             return false;
//           },
//           isDirectory() {
//             return true;
//           },
//           isBlockDevice() {
//             return false;
//           },
//           isCharacterDevice() {
//             return false;
//           },
//           isSymbolicLink() {
//             return false;
//           },
//           isFIFO() {
//             return false;
//           },
//           isSocket() {
//             return false;
//           },
//           dev: 0,
//           ino: 0,
//           rdev: 0,
//           blksize: 0,
//           blocks: 0,
//           atimeMs: 0,
//           mtimeMs: 0,
//           ctimeMs: 0,
//           birthtimeMs: 0,
//           birthtime: new Date(0),
//         });
//         return;
//       }
//
//       if (path === "/test") {
//         cb(0, {
//           mtime: new Date(),
//           atime: new Date(),
//           ctime: new Date(),
//           nlink: 1,
//           size: 12,
//           mode: 33188,
//           uid: process.getuid ? process.getuid() : 0,
//           gid: process.getgid ? process.getgid() : 0,
//           isFile() {
//             return false;
//           },
//           isDirectory() {
//             return true;
//           },
//           isBlockDevice() {
//             return false;
//           },
//           isCharacterDevice() {
//             return false;
//           },
//           isSymbolicLink() {
//             return false;
//           },
//           isFIFO() {
//             return false;
//           },
//           isSocket() {
//             return false;
//           },
//           dev: 0,
//           ino: 0,
//           rdev: 0,
//           blksize: 0,
//           blocks: 0,
//           atimeMs: 0,
//           mtimeMs: 0,
//           ctimeMs: 0,
//           birthtimeMs: 0,
//           birthtime: new Date(0),
//         });
//         return;
//       }
//
//       cb(fuse.ENOENT);
//     },
//     open: (path, flags, cb) => {
//       console.log("open(%s, %d)", path, flags);
//       cb(0, 42); // 42 is an fd
//     },
//     read: (path, fd, buf, len, pos, cb) => {
//       console.log("read(%s, %d, %d, %d)", path, fd, len, pos);
//       var str = "hello world\n".slice(pos, pos + len);
//       if (!str) return cb(0);
//       buf.write(str);
//       return cb(str.length);
//     },
//   },
//   (err: number) => {
//     if (err) throw err;
//     console.log(`filesystem mounted on ${REMOTE_MOUNT_PATH}`);
//   },
// );
//
// process.on("SIGINT", () => {
//   fuse.unmount(REMOTE_MOUNT_PATH, async (err) => {
//     if (err) {
//       console.log(`filesystem at ${REMOTE_MOUNT_PATH} not unmounted`, err);
//     } else {
//       console.log(`filesystem at ${REMOTE_MOUNT_PATH} unmounted`);
//       await fs.rmdir(REMOTE_MOUNT_PATH);
//     }
//   });
// });
