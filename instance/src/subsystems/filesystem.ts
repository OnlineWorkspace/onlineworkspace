import path from "path";
import type { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import fs from "fs";

export default class FilesystemSubsystem extends SubSystem {
    readonly SRC_ROOT = path.resolve("./instance/src/");
    readonly FS_ROOT = path.resolve("./fs/");
    readonly CACHE_PATH = path.join(this.FS_ROOT, "cache");

    constructor(instance: Instance) {
        super("filesystem", instance);

        fs.mkdirSync(this.FS_ROOT, { recursive: true });
        fs.mkdirSync(this.CACHE_PATH, { recursive: true });

        return this;
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
}
