import * as fs from "@std/fs";
import path from "node:path";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { WorkspacesEvent } from "./events.ts";
import {iterateReader} from "@std/io";
import { createHash } from "node:crypto";

export enum FileMediaType {
  Image,
  Video,
  ThreeDimensionalModel,
  Audio,
  Text,
  Unknown,
  PDF,
  Archive,
  RichOfficeDocument,
}

export default class FilesystemSystem extends System {
  readonly SRC_ROOT = path.resolve(process.cwd(), "./backend/src/");
  readonly WEB_ROOT = path.join(this.SRC_ROOT, "../../web/");
  readonly FS_ROOT = path.resolve(process.cwd(), "./fs/");
  readonly CACHE_PATH = path.join(this.FS_ROOT, "cache");
  readonly SYSTEM_PATH = path.join(this.FS_ROOT, "system");
  readonly AUTO_INSTALL_PATH = path.join(process.cwd(), "auto_install");

  _internalAssets: Map<
    string,
    { userId: number; path: string; validUntil: number; public?: boolean }
  >;
  _internalAssetPaths: Map<string, string>;
  _internalFileExtensions: Map<
    string,
    { displayName: string; type: FileMediaType }
  >;

  constructor(instance: Instance) {
    super("filesystem", instance);

    this._internalAssets = new Map();
    this._internalAssetPaths = new Map();
    this._internalFileExtensions = new Map();
  }

  /**
    Register a file extension to be recognized by OnlineWorkspace applications
  */
  registerFileExtension(
    extension: `.${string}`,
    displayName: string,
    type: FileMediaType,
  ) {
    this._internalFileExtensions.set(extension, { displayName, type });
    this.log.debug(
      `Registered file extension ${
        this.log.emphasis(extension)
      } -> '${displayName}' as type ${this.log.emphasis(FileMediaType[type])}`,
    );

    return this;
  }

  getApplicationSrc(applicationId: string) {
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

  /**
   * Get a file's md5 hash
   * @returns {string} an md5 hash of the input file
   */
  async getFileHash(path: string): Promise<string> {
    const hash = createHash("md5")
    const file = await Deno.open(path)

    for await (const chunk of iterateReader(file)) {
      hash.update(chunk)
    }

    return hash.digest("utf-8")
  }

  getFileType(path: string): FileMediaType {
    const extension = "." + (path.split(".").pop())?.toLowerCase();

    const mediaType = this._internalFileExtensions.get(extension)?.type;

    if (mediaType === undefined) {
      this.log.warning(`Unknown file format: '${path}' ext: '${extension}'`);
      return FileMediaType.Unknown;
    }

    return mediaType;
  }

  // returns an endpoint where the asset located at the provided path can be loaded from on the client
  // defaults to 3hrs validity
  serveFile(
    userId: number,
    fsPath: string,
    isPublic: boolean = false,
    evadeCache = false,
    validMs: number = 21600000,
  ): string {
    if (!evadeCache) {
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

    // const db = this.instance.sys.database.postgres();

    // const userGroups = (await user.getGroups()) || [];
    // const userIdArray = userId ? [userId.toString()] : [];

    // const validUserGroups = userGroups.filter(Boolean);

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
    } else {
      this.log.info(
        `Auto install directory detected. (${this.AUTO_INSTALL_PATH})`,
      );
    }

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
    } else {this.log.debug(
        `FS_ROOT/assets/login/background.png exists, (${
          path.join(this.FS_ROOT, "assets/login/background.png")
        })`,
      );}

    if (!fs.existsSync(path.join(this.SYSTEM_PATH, "fs_template_files"))) {
      Deno.mkdirSync(path.join(this.SYSTEM_PATH, "fs_template_files"));
      fs.copySync(
        path.join(this.SRC_ROOT, "assets/fs_template_files/"),
        path.join(this.SYSTEM_PATH, "fs_template_files"),
        { overwrite: true },
      );
    } else {this.log.debug(
        `FS_ROOT/assets/fs_template_files exists, (${
          path.join(this.FS_ROOT, "assets/fs_template_files")
        })`,
      );}

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

    this.registerFileExtension(
      ".png",
      "Portable Network Graphic (PNG)",
      FileMediaType.Image,
    );
    this.registerFileExtension(
      ".webp",
      "Web Picture format (WebP)",
      FileMediaType.Image,
    );
    this.registerFileExtension(
      ".avif",
      "AV1 Image File Format (AVIF)",
      FileMediaType.Image,
    );
    this.registerFileExtension(
      ".gif",
      "Graphics Interchange Format (GIF)",
      FileMediaType.Image,
    );
    this.registerFileExtension(
      ".jpeg",
      "Joint Photographic Experts Group (JPEG)",
      FileMediaType.Image,
    );
    this.registerFileExtension(
      ".jpg",
      "Joint Photographic Experts Group (JPEG)",
      FileMediaType.Image,
    );
    this.registerFileExtension(
      ".svg",
      "Scalable Vector Graphics (SVG)",
      FileMediaType.Image,
    );
    this.registerFileExtension(".ico", "Icon format", FileMediaType.Image);

    this.registerFileExtension(
      ".mp4",
      "MPEG-4 Video (MP4)",
      FileMediaType.Video,
    );
    this.registerFileExtension(".webm", "WebM Video", FileMediaType.Video);
    this.registerFileExtension(
      ".mkv",
      "Matroska Video (MKV)",
      FileMediaType.Video,
    );
    this.registerFileExtension(
      ".mov",
      "Apple QuickTime Movie",
      FileMediaType.Video,
    );
    this.registerFileExtension(
      ".avi",
      "Audio Video Interleave (AVI)",
      FileMediaType.Video,
    );

    this.registerFileExtension(
      ".obj",
      "Wavefront OBJ 3D Model",
      FileMediaType.ThreeDimensionalModel,
    );
    this.registerFileExtension(
      ".gltf",
      "GL Transmission Format (gLTF)",
      FileMediaType.ThreeDimensionalModel,
    );
    this.registerFileExtension(
      ".glb",
      "Binary GL Transmission Format (GLB)",
      FileMediaType.ThreeDimensionalModel,
    );
    this.registerFileExtension(
      ".fbx",
      "Filmbox 3D Asset (FBX)",
      FileMediaType.ThreeDimensionalModel,
    );
    this.registerFileExtension(
      ".stl",
      "Stereolithography 3D Asset (STL)",
      FileMediaType.ThreeDimensionalModel,
    );

    this.registerFileExtension(
      ".mp3",
      "MPEG Audio Layer III (MP3)",
      FileMediaType.Audio,
    );
    this.registerFileExtension(
      ".wav",
      "Waveform Audio File Format (WAV)",
      FileMediaType.Audio,
    );
    this.registerFileExtension(".ogg", "Ogg Vorbis Audio", FileMediaType.Audio);
    this.registerFileExtension(".m4a", "MPEG-4 Audio", FileMediaType.Audio);

    this.registerFileExtension(".txt", "Plain Text File", FileMediaType.Text);
    this.registerFileExtension(
      ".csv",
      "Comma-Separated Values (CSV)",
      FileMediaType.Text,
    );
    this.registerFileExtension(
      ".md",
      "Markdown Documentation",
      FileMediaType.Text,
    );
    this.registerFileExtension(
      ".json",
      "Javascript Object Notation",
      FileMediaType.Text,
    );

    this.registerFileExtension(
      ".pdf",
      "Portable Document Format (PDF)",
      FileMediaType.PDF,
    );

    this.registerFileExtension(".zip", "ZIP Archive", FileMediaType.Archive);
    this.registerFileExtension(
      ".tar",
      "Tarball Archive",
      FileMediaType.Archive,
    );
    this.registerFileExtension(
      ".gz",
      "Gzip Compressed Archive",
      FileMediaType.Archive,
    );
    this.registerFileExtension(
      ".rar",
      "Roshal Archive (RAR)",
      FileMediaType.Archive,
    );
    this.registerFileExtension(
      ".7z",
      "7-Zip Compressed Archive",
      FileMediaType.Archive,
    );

    this.registerFileExtension(
      ".docx",
      "Microsoft Word Document",
      FileMediaType.RichOfficeDocument,
    );
    this.registerFileExtension(
      ".doc",
      "Microsoft Word Document (Legacy)",
      FileMediaType.RichOfficeDocument,
    );
    this.registerFileExtension(
      ".xlsx",
      "Microsoft Excel Spreadsheet",
      FileMediaType.RichOfficeDocument,
    );
    this.registerFileExtension(
      ".xls",
      "Microsoft Excel Spreadsheet (Legacy)",
      FileMediaType.RichOfficeDocument,
    );
    this.registerFileExtension(
      ".pptx",
      "Microsoft PowerPoint Presentation",
      FileMediaType.RichOfficeDocument,
    );

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
