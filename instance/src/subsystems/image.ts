import { randomUUIDv7 } from "bun";
import { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import sharp from "sharp";
import fs from "fs/promises"

export default class ImageSubsystem extends SubSystem {
    _internalImages: Map<string, { userId: number; path: string; validUntil: number; public?: boolean }>;

    constructor(instance: Instance) {
        super("image", instance);

        this._internalImages = new Map();

        return this;
    }

    // returns an endpoint where the image located at the provided path can be loaded from on the client
    // defaults to 3hrs validity
    serveImage(userId: number, path: string, isPublic: boolean = false, validMs: number = 21600000): string {
        const imageId = randomUUIDv7();

        this._internalImages.set(imageId, {
            path: path,
            userId: userId,
            validUntil: Date.now() + validMs,
            public: isPublic,
        });

        return `/api/asset/image/${imageId}`;
    }

    async resizeImage(inputPath: string, outputPath: string, dimensions: { width: number; height: number }, changeFormatTo?: "avif" | "jpeg" | "png"): Promise<boolean> {
        let sharpInstance = sharp(inputPath).resize(dimensions.width, dimensions.height, { withoutEnlargement: true });

        if (changeFormatTo) {
            sharpInstance.toFormat(changeFormatTo)
        }

        await sharpInstance.toFile(outputPath);

        return true;
    }
}
