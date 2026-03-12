import path from "path";
import type { Instance } from "../index.js";
import System from "../system.js";
import fs from "fs";
import { randomUUIDv7 } from "bun";

export default class FilesystemSystem extends System {
  readonly SRC_ROOT = path.resolve("./instance/src/");
  readonly FS_ROOT = path.resolve("./fs/");
  readonly CACHE_PATH = path.join(this.FS_ROOT, "cache");
  readonly AUTOINSTALL_PATH = path.join(process.cwd(), "autoinstall");

  _internalAssets: Map<
    string,
    { userId: number; path: string; validUntil: number; public?: boolean }
  >;
  _internalAssetPaths: Map<string, string>;

  constructor(instance: Instance) {
    super("filesystem", instance);

    fs.mkdirSync(this.FS_ROOT, { recursive: true });
    if (fs.existsSync(this.CACHE_PATH)) {
      fs.rmSync(this.CACHE_PATH, { recursive: true });
    }
    fs.mkdirSync(this.CACHE_PATH, { recursive: true });

    if (!fs.existsSync(path.join(this.FS_ROOT, "assets/login"))) {
      fs.mkdirSync(path.join(this.FS_ROOT, "assets/login"), {
        recursive: true,
      });
    }

    if (!fs.existsSync(path.join(this.FS_ROOT, "assets/login/banner.png"))) {
      if (
        !fs.existsSync(
          path.join(this.AUTOINSTALL_PATH, "assets/login/banner.png"),
        )
      ) {
        fs.cpSync(
          path.join(this.SRC_ROOT, "assets/placeholder/banner.png"),
          path.join(this.FS_ROOT, "assets/login/banner.png"),
        );
      } else {
        fs.cpSync(
          path.join(this.AUTOINSTALL_PATH, "assets/login/banner.png"),
          path.join(this.FS_ROOT, "assets/login/banner.png"),
        );
      }
    }

    if (
      !fs.existsSync(path.join(this.FS_ROOT, "assets/login/background.png"))
    ) {
      fs.cpSync(
        path.join(this.SRC_ROOT, "assets/wallpapers/stars_wallpaper.png"),
        path.join(this.FS_ROOT, "assets/login/background.png"),
      );
    }

    this._internalAssets = new Map();
    this._internalAssetPaths = new Map();

    return this;
  }

  getApplicationSrc(applicationId: string) {
    console.log(
      this.instance.sys.applications.availableApplications.find(
        (a) => a.manifest?.id === applicationId,
      )?.path,
    );

    return this.instance.sys.applications.availableApplications.find(
      (a) => a.manifest?.id === applicationId,
    )?.path;
  }

  // Create a directory if it does not already exist
  // @returns {true} if created
  // @returns {false} if already exists
  async createDirectoryIfNotExists(path: string): Promise<boolean> {
    if (
      await fs.promises
        .access(path)
        .then(() => true)
        .catch(() => false)
    ) {
      return false;
    }

    await fs.promises.mkdir(path, { recursive: true });

    return true;
  }

  getFileType(path: string) {
    const extension = path.split(".").pop();

    switch (extension) {
      case "avif":
      case "jpg":
      case "jpeg":
      case "png":
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

    this.log.warning(`Unknown file format: '${path}' ext: '${extension}'`);

    return undefined;
  }

  // returns an endpoint where the asset located at the provided path can be loaded from on the client
  // defaults to 3hrs validity
  serveFile(
    userId: number,
    fsPath: string,
    isPublic: boolean = false,
    dontCachePath = false,
    validMs: number = 21600000,
  ): string {
    if (!dontCachePath) {
      const existingAsset = this._internalAssetPaths.get(fsPath);

      if (existingAsset) {
        this._internalAssets.get(existingAsset)!.validUntil =
          Date.now() + validMs;

        return `/api/asset/raw/${existingAsset}`;
      }
    }

    const assetId = randomUUIDv7();

    this._internalAssets.set(assetId, {
      path: fsPath,
      userId: userId,
      validUntil: Date.now() + validMs,
      public: isPublic,
    });
    this._internalAssetPaths.set(fsPath, assetId);

    this.log.info(`Serving asset at '${fsPath}' as '${assetId}'`);

    return `/api/asset/raw/${assetId}`;
  }

  async getUserPermissions(
    userId: number,
    fsPath: string,
  ): Promise<{ read: boolean; write: boolean }> {
    const user = (await this.instance.sys.users.getUserById(userId))!;

    if (await user.isAdministrator())
      return {
        read: true,
        write: true,
      };

    if (fsPath.startsWith(path.join(this.FS_ROOT, `/users/${userId}`)))
      return {
        read: true,
        write: true,
      };

    const db = this.instance.sys.database.postgres();

    const userGroups = (await user.getGroups()) || [];
    const userIdArray = userId ? [userId.toString()] : [];

    const validUserGroups = userGroups.filter(Boolean);

    return {
      read: false,
      write: false,
    };

    // const permissions = await db`
    //     SELECT
    //         EXISTS(
    //             SELECT 1
    //             FROM public.filesystem_permission_overrides
    //             WHERE file_path = ${fsPath}
    //                 AND read_permission_groups && ${validUserGroups}::TEXT[]
    //                OR read_permission_users @> ARRAY[${userIdArray}::TEXT]
    //         ) AS read_permission,
    //         EXISTS(
    //             SELECT 1
    //             FROM public.filesystem_permission_overrides
    //             WHERE file_path = ${fsPath}
    //                 AND write_permission_groups && ${validUserGroups}::TEXT[]
    //                OR write_permission_users @> ARRAY[${userIdArray}::TEXT]
    //         ) AS write_permission
    // `;
    // return {
    //     read: permissions[0].read_permission,
    //     write: permissions[0].write_permission,
    // };
  }

  getUserHomeDirectory(userId: number): string {
    return path.join(this.FS_ROOT, `/users/${userId}`);
  }

  async startup(): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    await db`CREATE TABLE IF NOT EXISTS filesystem_permission_overrides (
                file_path TEXT,
                recursive BOOL,
                read_permission_groups TEXT[],
                read_permission_users TEXT[],
                write_permission_groups TEXT[],
                write_permission_users TEXT[],
                owner TEXT[]
        )`;

    return true;
  }
}
