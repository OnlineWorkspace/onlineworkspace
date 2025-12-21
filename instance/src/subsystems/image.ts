import { randomUUIDv7 } from "bun";
import { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import sharp from "sharp";
import fs from "fs/promises";

export default class ImageSubsystem extends SubSystem {
    _internalImages: Map<string, { userId: number; path: string; validUntil: number; public?: boolean }>;
    _internalImagePaths: Map<string, string>;

    constructor(instance: Instance) {
        super("image", instance);

        this._internalImages = new Map();
        this._internalImagePaths = new Map();

        return this;
    }

    // returns an endpoint where the image located at the provided path can be loaded from on the client
    // defaults to 3hrs validity
    serveImage(userId: number, path: string, isPublic: boolean = false, dontCachePath = false, validMs: number = 21600000): string {
        if (!dontCachePath) {
            const existingImage = this._internalImagePaths.get(path);

            if (existingImage) {
                this._internalImages.get(existingImage)!.validUntil = Date.now() + validMs;

                return `/api/asset/image/${existingImage}`;
            }
        }

        const imageId = randomUUIDv7();

        this._internalImages.set(imageId, {
            path: path,
            userId: userId,
            validUntil: Date.now() + validMs,
            public: isPublic,
        });
        this._internalImagePaths.set(path, imageId);

        this.log.info(`Serving image at '${path}' as '${imageId}'`);

        return `/api/asset/image/${imageId}`;
    }

    async resizeImage(
        inputPath: string,
        outputPath: string,
        dimensions:
            | { width: number; height: number }
            | ((originalSize: { width: number; height: number }) => { width: number; height: number }),
        changeFormatTo?: "avif" | "jpeg" | "png",
    ): Promise<boolean> {
        const sharpInstance = sharp(inputPath);

        if (typeof dimensions === "function") {
            dimensions = dimensions(await sharpInstance.metadata());
        }

        sharpInstance.resize(dimensions.width, dimensions.height, { withoutEnlargement: true });

        if (changeFormatTo) {
            sharpInstance.toFormat(changeFormatTo, { progressive: true });
        }

        await sharpInstance.toFile(outputPath);

        return true;
    }
}
