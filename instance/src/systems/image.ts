import * as nodePath from "node:path";
import { randomUUIDv7 } from "bun";
import sharp from "sharp";
import type { Instance } from "../index.js";
import System from "../system.js";

export default class ImageSystem extends System {
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
          position?: "top" | "right top" | "right" | "right bottom" | "bottom" | "left bottom" | "left" | "left top" | "centre";
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
    } & (
      | {
          crop?: {
            x: number;
            y: number;
            width: number;
            height: number;
          };
        }
      | {
          resize?: {
            dimensions:
              | { width: number; height: number }
              | ((originalSize: { width: number; height: number }) => {
                  width: number;
                  height: number;
                });
            changeFormatTo?: "avif" | "jpeg" | "png";
            position?: "top" | "right top" | "right" | "right bottom" | "bottom" | "left bottom" | "left" | "left top" | "centre";
            fit?: "cover" | "contain" | "fill";
            background?: string;
          };
        }
    ),
  ): Promise<string> {
    const opts = {
      isPublic: options?.isPublic ?? false,
      dontCachePath: options?.dontCachePath ?? false,
      validMs: options?.validMs ?? 21600000,
      crop: options && "crop" in options ? options.crop : undefined,
      resize: options && "resize" in options ? options.resize : undefined,
    };

    if (opts.resize?.dimensions) {
      if (typeof opts.resize.dimensions === "function") {
        const sharpInstance = sharp(path);
        const metadata = await sharpInstance.metadata();
        opts.resize.dimensions = opts.resize.dimensions({
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
        });
      }
    }

    let cropKey = "";
    if (opts.crop) {
      cropKey = `crop_${opts.crop.x}_${opts.crop.y}_${opts.crop.width}_${opts.crop.height}`;
    }

    let requestResolution = "raw";
    if (opts.resize?.dimensions && typeof opts.resize.dimensions !== "function") {
      requestResolution = `${opts.resize.dimensions.width}x${opts.resize.dimensions.height}`;
    }
    if (cropKey) {
      requestResolution += `_${cropKey}`;
    }

    if (!opts.dontCachePath) {
      const existingImageId = this._internalImagePaths.get(path);
      if (existingImageId) {
        const existingImage = this._internalImages.get(existingImageId);
        if (existingImage) {
          const existingImageOfResolution = existingImage[requestResolution];
          if (existingImageOfResolution) {
            existingImageOfResolution.validUntil = Date.now() + opts.validMs;
            return `/api/asset/image/${existingImageId}/${requestResolution}`;
          }
        }
      }
    }

    const imageId = randomUUIDv7();

    this._internalImages.set(imageId, {
      [requestResolution]: {
        path: path,
        userId: userId,
        validUntil: Date.now() + opts.validMs,
        public: opts.isPublic,
        resize: {
          dimensions: opts.resize?.dimensions as {
            width: number;
            height: number;
          },
          changeFormatTo: opts.resize?.changeFormatTo ?? "jpeg",
          position: opts.resize?.position ?? "top",
          fit: opts.resize?.fit ?? "cover",
          background: opts.resize?.background ?? "white",
        },
      },
    });

    this._internalImagePaths.set(path, imageId);

    this.log.info(`Serving image at '${nodePath.relative(this.instance.sys.filesystem.FS_ROOT, path)}' as '${imageId}'`);

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
      changeFormatTo?: "avif" | "jpeg" | "png" | "webp";
      position?: "top" | "right top" | "right" | "right bottom" | "bottom" | "left bottom" | "left" | "left top" | "centre";
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
