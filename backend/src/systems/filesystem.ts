import * as fs from "@std/fs";
import path from "node:path";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { WorkspacesEvent } from "./events.ts";

export enum FileMediaType {
  Image,
  Video,
  ThreeDimensionalModel,
  Audio,
  Text,
}

export default class FilesystemSystem extends System {
  readonly SRC_ROOT = path.resolve("./backend/src/");
  readonly WEB_ROOT = path.join(this.SRC_ROOT, "../../web/");
  readonly FS_ROOT = path.resolve("./fs/");
  readonly CACHE_PATH = path.join(this.FS_ROOT, "cache");
  readonly SYSTEM_PATH = path.join(this.FS_ROOT, "system");
  readonly AUTO_INSTALL_PATH = path.join(process.cwd(), "auto_install");

  _internalAssets: Map<
    string,
    { userId: number; path: string; validUntil: number; public?: boolean }
  >;
  _internalAssetPaths: Map<string, string>;
  _internalFileExtensions: Map<string, { displayName: string, type: FileMediaType}>;

  constructor(instance: Instance) {
    super("filesystem", instance);

    this._internalAssets = new Map();
    this._internalAssetPaths = new Map();
    this._internalFileExtensions = new Map();


  }

  registerFileExtension(extension: `.${string}`, displayName: string, type: FileMediaType) {
    this._internalFileExtensions.set(extension, { displayName, type })

    return this
  }

  getApplicationSrc(applicationId: string) {
    console.log(
      this.instance.sys.applications.availableApplications.find((a) =>
        a.manifest?.id === applicationId
      )?.path,
    );

    return this.instance.sys.applications.availableApplications.find((a) =>
      a.manifest?.id === applicationId
    )?.path;
  }

  // Create a directory if it does not already exist
  // @returns {true} if created
  // @returns {false} if already exists
  async createDirectoryIfNotExists(path: string): Promise<boolean> {
    if (
      await fs.exists(path)
    ) {
      return false;
    }

    await Deno.mkdir(path, { recursive: true });

    return true;
  }

  getFileType(path: string) {
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
        this._internalAssets.get(existingAsset)!.validUntil = Date.now() +
          validMs;

        return `/api/asset/raw/${existingAsset}`;
      }
    }

    const assetId = crypto.randomUUID();

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

  // TODO: properly implement this instead of this hack.
  async getUserPermissions(
    userId: number,
    fsPath: string,
  ): Promise<{ read: boolean; write: boolean }> {
    const user = (await this.instance.sys.users.getUserById(userId))!;

    if (await user.isAdministrator()) {
      return {
        read: true,
        write: true,
      };
    }

    if (fsPath.startsWith(path.join(this.FS_ROOT, `/users/${userId}`))) {
      return {
        read: true,
        write: true,
      };
    }

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

  override async startup(): Promise<boolean> {
    await super.startup();

    if (!fs.existsSync(this.AUTO_INSTALL_PATH)) {
      // do nothing
    } else {this.log.info(
        `Auto install directory detected. (${this.AUTO_INSTALL_PATH})`,
      );}

    if (!fs.existsSync(this.FS_ROOT)) {
      Deno.mkdirSync(this.FS_ROOT, { recursive: true });
    } else this.log.debug(`FS_ROOT exists, (${this.FS_ROOT})`);

    if (!fs.existsSync(this.SYSTEM_PATH)) {
      Deno.mkdirSync(this.SYSTEM_PATH, {
        recursive: true,
      });
    } else this.log.debug(`SYSTEM_PATH exists, (${this.SYSTEM_PATH})`);

    if (!fs.existsSync(this.CACHE_PATH)) {
      Deno.mkdirSync(this.CACHE_PATH, { recursive: true });
    } else this.log.debug(`CACHE_PATH exists, (${this.CACHE_PATH})`);

    if (!fs.existsSync(path.join(this.FS_ROOT, "assets/login"))) {
      Deno.mkdirSync(path.join(this.FS_ROOT, "assets/login"), {
        recursive: true,
      });
    } else {
      this.log.debug(
        `FS_ROOT/assets/login exists, (${
          path.join(this.FS_ROOT, "assets/login")
        })`,
      );
    }

    if (!fs.existsSync(path.join(this.FS_ROOT, "assets/login/banner.png"))) {
      if (
        !fs.existsSync(
          path.join(this.AUTO_INSTALL_PATH, "assets/login/banner.png"),
        )
      ) {
        Deno.copyFileSync(
          path.join(this.SRC_ROOT, "assets/placeholder/banner.png"),
          path.join(this.FS_ROOT, "assets/login/banner.png"),
        );
      } else {
        Deno.copyFileSync(
          path.join(this.AUTO_INSTALL_PATH, "assets/login/banner.png"),
          path.join(this.FS_ROOT, "assets/login/banner.png"),
        );
      }
    }

    if (
      !fs.existsSync(path.join(this.FS_ROOT, "assets/login/background.png"))
    ) {
      Deno.copyFileSync(
        path.join(this.SRC_ROOT, "assets/wallpapers/pexels-steve-29708303.jpg"),
        path.join(this.FS_ROOT, "assets/login/background.png"),
      );
    } else this.log.debug(
      `FS_ROOT/assets/login/background.png exists, (${
        path.join(this.FS_ROOT, "assets/login/background.png")
      })`,
    );

    if (!fs.existsSync(path.join(this.SYSTEM_PATH, "fs_template_files"))) {
      Deno.mkdirSync(path.join(this.SYSTEM_PATH, "fs_template_files"));
      fs.copySync(
        path.join(this.SRC_ROOT, "assets/fs_template_files/"),
        path.join(this.SYSTEM_PATH, "fs_template_files"),
      );
    }else this.log.debug(
      `FS_ROOT/assets/fs_template_files exists, (${
        path.join(this.FS_ROOT, "assets/fs_template_files")
      })`,
    );

    if (!fs.existsSync(path.join(this.SYSTEM_PATH, "vite"))) {
      Deno.mkdirSync(path.join(this.SYSTEM_PATH, "vite"));
    }

    if (!this.instance.sys.configuration.isDevMode) {
      if (fs.existsSync(this.CACHE_PATH)) {
        Deno.removeSync(this.CACHE_PATH, { recursive: true });
        Deno.mkdirSync(this.CACHE_PATH, { recursive: true });
      }
    } else {
      this.log.warning("Cache was not cleared as we are running in devMode");
    }

    this.instance.sys.event.on(
      WorkspacesEvent.BeforeStartupComplete,
      async () => {
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
      },
    );

    return true;
  }
}
