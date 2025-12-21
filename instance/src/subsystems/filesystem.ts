import path from "path";
import type { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import fs from "fs";
import { randomUUIDv7 } from "bun";

export default class FilesystemSubsystem extends SubSystem {
    readonly SRC_ROOT = path.resolve("./instance/src/");
    readonly FS_ROOT = path.resolve("./fs/");
    readonly CACHE_PATH = path.join(this.FS_ROOT, "cache");

    _internalAssets: Map<string, { userId: number; path: string; validUntil: number; public?: boolean }>;
    _internalAssetPaths: Map<string, string>;

    constructor(instance: Instance) {
        super("filesystem", instance);

        fs.mkdirSync(this.FS_ROOT, { recursive: true });
        fs.mkdirSync(this.CACHE_PATH, { recursive: true });

        this._internalAssets = new Map();
        this._internalAssetPaths = new Map();

        return this;
    }

    getApplicationSrc(applicationId: string) {
        console.log(this.instance.subSystems.applications.availableApplications.find((a) => a.manifest?.id === applicationId)?.path);

        return this.instance.subSystems.applications.availableApplications.find((a) => a.manifest?.id === applicationId)?.path;
    }

    // Create a directory if it does not already exist
    // @returns {true} if created
    // @returns {false} if already exists
    async createDirectoryIfNotExists(path: string): Promise<boolean> {
        if (await fs.promises.exists(path)) {
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
                return "plaintext";
        }

        this.log.warning(`Unknown file format: '${path}' ext: '${extension}'`);

        return undefined;
    }

    // returns an endpoint where the asset located at the provided path can be loaded from on the client
    // defaults to 3hrs validity
    serveFile(userId: number, path: string, isPublic: boolean = false, dontCachePath = false, validMs: number = 21600000): string {
        if (!dontCachePath) {
            const existingAsset = this._internalAssetPaths.get(path);

            if (existingAsset) {
                this._internalAssets.get(existingAsset)!.validUntil = Date.now() + validMs;

                return `/api/asset/raw/${existingAsset}`;
            }
        }

        const assetId = randomUUIDv7();

        this._internalAssets.set(assetId, {
            path: path,
            userId: userId,
            validUntil: Date.now() + validMs,
            public: isPublic,
        });
        this._internalAssetPaths.set(path, assetId);

        this.log.info(`Serving asset at '${path}' as '${assetId}'`);

        return `/api/asset/raw/${assetId}`;
    }
}
