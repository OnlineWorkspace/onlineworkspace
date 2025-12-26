import { randomUUIDv7 } from "bun";
import { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import sharp from "sharp";
import * as nodePath from "path";

export default class ImageSubsystem extends SubSystem {
    _internalImages: Map<
        string,
        {
            [resolution: string]: {
                userId: number;
                path: string;
                validUntil: number;
                public?: boolean;
                resize?: {
                    dimensions: { width: number; height: number };
                    changeFormatTo?: "avif" | "jpeg" | "png";
                    position?:
                        | "top"
                        | "right top"
                        | "right"
                        | "right bottom"
                        | "bottom"
                        | "left bottom"
                        | "left"
                        | "left top"
                        | "centre";
                    fit?: "cover" | "contain" | "fill";
                    background?: string;
                };
            };
        }
    >;
    _internalImagePaths: Map<string, string>;

    constructor(instance: Instance) {
        super("image", instance);

        this._internalImages = new Map();
        this._internalImagePaths = new Map();

        return this;
    }

    // returns an endpoint where the image located at the provided path can be loaded from on the client
    // defaults to 3hrs validity
    async serveImage(
        userId: number,
        path: string,
        options?: {
            isPublic?: boolean;
            dontCachePath?: boolean;
            validMs?: number;
            resize?: {
                dimensions:
                    | { width: number; height: number }
                    | ((originalSize: { width: number; height: number }) => {
                          width: number;
                          height: number;
                      });
                changeFormatTo?: "avif" | "jpeg" | "png";
                position?:
                    | "top"
                    | "right top"
                    | "right"
                    | "right bottom"
                    | "bottom"
                    | "left bottom"
                    | "left"
                    | "left top"
                    | "centre";
                fit?: "cover" | "contain" | "fill";
                background?: string;
            };
        },
    ): Promise<string> {
        const opts = {
            isPublic: false,
            dontCachePath: false,
            validMs: 21600000,
            ...options,
        };

        if (options?.resize?.dimensions) {
            if (typeof options?.resize?.dimensions === "function") {
                const sharpInstance = sharp(path);
                opts.resize!.dimensions = options?.resize?.dimensions(
                    await sharpInstance.metadata(),
                );
            }
        }

        if (!opts.dontCachePath) {
            const existingImageId = this._internalImagePaths.get(path);

            if (existingImageId) {
                const existingImage = this._internalImages.get(existingImageId);

                if (existingImage) {
                    const requestResolution = opts.resize
                        ? // @ts-ignore
                          opts.resize.dimensions.width + "x" + opts.resize.dimensions.height
                        : "raw";

                    const existingImageOfResolution = existingImage[requestResolution];

                    if (existingImageOfResolution) {
                        existingImageOfResolution!.validUntil = Date.now() + opts.validMs;

                        return `/api/asset/image/${existingImageId}/${requestResolution}`;
                    }
                }
            }
        }

        const imageId = randomUUIDv7();

        const requestResolution = opts.resize
            ? // @ts-ignore
              opts.resize.dimensions.width + "x" + opts.resize.dimensions.height
            : "raw";

        if (this._internalImages.has(imageId)) {
            let currentImage = this._internalImages.get(imageId)!;

            currentImage[requestResolution] = {
                path: path,
                userId: userId,
                validUntil: Date.now() + opts.validMs,
                public: opts.isPublic,
                // @ts-ignore
                resize: opts.resize,
            };

            this._internalImages.set(imageId, currentImage);
        } else {
            let currentImage = {
                [requestResolution]: {
                    path: path,
                    userId: userId,
                    validUntil: Date.now() + opts.validMs,
                    public: opts.isPublic,
                    resize: opts.resize,
                },
            };

            // @ts-ignore
            this._internalImages.set(imageId, currentImage);

            this._internalImagePaths.set(path, imageId);
        }

        this.log.info(
            `Serving image at '${nodePath.relative(this.instance.subSystems.filesystem.FS_ROOT, path)}' as '${imageId}'`,
        );

        return `/api/asset/image/${imageId}/${requestResolution}`;
    }

    async resizeImage(
        inputPath: string,
        outputPath: string,
        dimensions:
            | { width: number; height: number }
            | ((originalSize: { width: number; height: number }) => {
                  width: number;
                  height: number;
              }),
        options?: {
            changeFormatTo?: "avif" | "jpeg" | "png";
            position?:
                | "top"
                | "right top"
                | "right"
                | "right bottom"
                | "bottom"
                | "left bottom"
                | "left"
                | "left top"
                | "centre";
            fit?: "cover" | "contain" | "fill";
            background?: string;
        },
    ): Promise<boolean> {
        const sharpInstance = sharp(inputPath);

        if (typeof dimensions === "function") {
            dimensions = dimensions(await sharpInstance.metadata());
        }

        sharpInstance.resize(dimensions.width, dimensions.height, {
            withoutEnlargement: true,
            position: options?.position,
            fit: options?.fit,
            background: options?.background,
        });

        if (options) {
            if (options.changeFormatTo) {
                sharpInstance.toFormat(options.changeFormatTo, { progressive: true });
            }
        }

        await sharpInstance.toFile(outputPath);

        return true;
    }
}
