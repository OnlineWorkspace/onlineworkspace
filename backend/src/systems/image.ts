import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas, Image } from "@gfx/canvas";
import sharp from "sharp";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { FileMediaType } from "./filesystem.ts";

export type ImageFormat = "avif" | "jpeg" | "png" | "webp";

export type ImagePosition =
  | "top"
  | "right top"
  | "right"
  | "right bottom"
  | "bottom"
  | "left bottom"
  | "left"
  | "left top"
  | "centre";

export interface Dimensions {
  width: number;
  height: number;
}

export interface ResizeOptions {
  dimensions?: Dimensions | ((original: Dimensions) => Dimensions);
  changeFormatTo?: ImageFormat;
  position?: ImagePosition;
  fit?: "cover" | "contain" | "fill";
  background?: string;
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ServeImageOptions {
  isPublic?: boolean;
  evadeCache?: boolean;
  validMs?: number;
  crop?: CropOptions;
  resize?: ResizeOptions;
}

export interface ImageCacheEntry {
  userId: number;
  path?: string;
  buffer?: Buffer;
  validUntil: number;
  public?: boolean;
  resize?: {
    dimensions?: Dimensions;
    changeFormatTo: ImageFormat;
    position: ImagePosition;
    fit: "cover" | "contain" | "fill";
    background: string;
  };
}

export default class ImageSystem extends System {
  private _internalImages = new Map<string, Record<string, ImageCacheEntry>>();
  private _internalImagePaths = new Map<string, string>();

  constructor(instance: Instance) {
    super("image", instance);
  }

  private async _internalGetResKey(
    source: string | Buffer,
    options: ServeImageOptions
  ): Promise<{ resolutionKey: string; dimensions?: Dimensions }> {
    let dimensions: Dimensions | undefined;

    if (options.resize?.dimensions) {
      if (typeof options.resize.dimensions === "function") {
        const metadata = await sharp(source).metadata();
        dimensions = options.resize.dimensions({
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
        });
      } else {
        dimensions = options.resize.dimensions;
      }
    }

    const cropKey = options.crop
      ? `crop_${options.crop.x}_${options.crop.y}_${options.crop.width}_${options.crop.height}`
      : "";

    let resolutionKey = dimensions ? `${dimensions.width}x${dimensions.height}` : "raw";
    if (cropKey) resolutionKey += `_${cropKey}`;

    return { resolutionKey, dimensions };
  }

  async serveImage(
    userId: number,
    filePath: string,
    options: ServeImageOptions = {}
  ): Promise<string> {
    const validMs = options.validMs ?? 21600000; // 6 hours
    const isPublic = options.isPublic ?? false;

    const { resolutionKey, dimensions } = await this._internalGetResKey(filePath, options);

    if (!options.evadeCache) {
      const existingImageId = this._internalImagePaths.get(filePath);
      if (existingImageId) {
        const cachedVariant = this._internalImages.get(existingImageId)?.[resolutionKey];
        if (cachedVariant) {
          cachedVariant.validUntil = Date.now() + validMs;
          return this._internalGetResponseUrl(existingImageId, resolutionKey);
        }
      }
    }

    const imageId = crypto.randomUUID();

    this._internalImages.set(imageId, {
      [resolutionKey]: {
        path: filePath,
        userId,
        validUntil: Date.now() + validMs,
        public: isPublic,
        resize: {
          dimensions,
          changeFormatTo: options.resize?.changeFormatTo ?? "jpeg",
          position: options.resize?.position ?? "top",
          fit: options.resize?.fit ?? "cover",
          background: options.resize?.background ?? "white",
        },
      },
    });

    this._internalImagePaths.set(filePath, imageId);

    const relativePath = path.relative(this.instance.sys.filesystem.FS_ROOT, filePath);
    this.log.info(`Serving image at '${relativePath}' as '${this.log.emphasis(imageId)}'`);

    return this._internalGetResponseUrl(imageId, resolutionKey);
  }

  async serveImageBuffer(
    userId: number,
    buffer: Buffer,
    options: ServeImageOptions = {}
  ): Promise<string> {
    const validMs = options.validMs ?? 21600000;
    const isPublic = options.isPublic ?? false;

    const { resolutionKey, dimensions } = await this._internalGetResKey(buffer, options);
    const imageId = crypto.randomUUID();

    this._internalImages.set(imageId, {
      [resolutionKey]: {
        buffer,
        userId,
        validUntil: Date.now() + validMs,
        public: isPublic,
        resize: {
          dimensions,
          changeFormatTo: options.resize?.changeFormatTo ?? "jpeg",
          position: options.resize?.position ?? "top",
          fit: options.resize?.fit ?? "cover",
          background: options.resize?.background ?? "white",
        },
      },
    });

    return this._internalGetResponseUrl(imageId, resolutionKey);
  }

  async resizeImage(
    inputPath: string,
    outputPath: string,
    dimensions: Dimensions | ((original: Dimensions) => Dimensions),
    options?: Omit<ResizeOptions, "dimensions">
  ): Promise<boolean> {
    const t0 = performance.now();
    const sharpInstance = sharp(inputPath);
    const metadata = await sharpInstance.metadata();

    const originalDimensions: Dimensions = {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };

    const targetDimensions =
      typeof dimensions === "function" ? dimensions(originalDimensions) : dimensions;

    const useCubic =
      originalDimensions.width / 2 > targetDimensions.width ||
      originalDimensions.height / 2 > targetDimensions.height;

    sharpInstance.resize(targetDimensions.width, targetDimensions.height, {
      withoutEnlargement: true,
      position: options?.position,
      fit: options?.fit,
      background: options?.background,
      kernel: useCubic ? "cubic" : "mks2021",
    });

    if (options?.changeFormatTo) {
      sharpInstance.toFormat(options.changeFormatTo, { progressive: true });
    }

    await sharpInstance.toFile(outputPath);
    const t1 = performance.now();

    this.log.debug(
      `Resized ${inputPath} (${originalDimensions.width}x${originalDimensions.height}) -> ${outputPath} (${targetDimensions.width}x${targetDimensions.height}) in ${(t1 - t0).toFixed(2)}ms`
    );

    return true;
  }

  async getThumbnailBuffer(filePath: string, size: number = 128): Promise<Uint8Array> {
    if (this.instance.sys.filesystem.getFileType(filePath) === FileMediaType.Image) {
      return Buffer.from([0xdeadbeef]);
    }

    const fileExtension = path.extname(filePath).slice(1) || "file";
    const thumbCachePath = path.join(
      this.instance.sys.filesystem.CACHE_PATH,
      "fileicon",
      "filetype",
      `${fileExtension}x${size}.png`
    );

    try {
      return await fs.readFile(thumbCachePath);
    } catch {
      await fs.mkdir(path.dirname(thumbCachePath), { recursive: true });
    }

    const canvasPadding = 8;
    const canvasWidth = size;
    const canvasHeight = size;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    const placeholderPath = path.join(
      this.instance.sys.filesystem.SRC_ROOT,
      "assets/placeholder/file.png"
    );
    ctx.drawImage(Image.loadSync(placeholderPath), 0, 0, canvasWidth, canvasHeight);

    ctx.font = "24px Arial";
    ctx.textAlign = "end";
    ctx.textBaseline = "bottom";

    const labelPadding = { x: 4, y: 2 };
    const labelPos = {
      x: canvasWidth - canvasPadding,
      y: canvasHeight - canvasPadding,
    };

    const textContent = fileExtension.toUpperCase().slice(0, 5);
    const textSize = ctx.measureText(textContent);
    const textHeight = textSize.actualBoundingBoxAscent || 24;

    ctx.fillStyle = "#cc5588";
    ctx.fillRect(
      labelPos.x - (textSize.width + labelPadding.x * 2),
      labelPos.y - (textHeight + labelPadding.y * 2),
      textSize.width + labelPadding.x * 2,
      textHeight + labelPadding.y * 2
    );

    ctx.fillStyle = "white";
    ctx.fillText(textContent, labelPos.x - labelPadding.x, labelPos.y - labelPadding.y);

    canvas.save(thumbCachePath, "png", 100);

    return fs.readFile(thumbCachePath);
  }

  private _internalGetResponseUrl(imageId: string, resolutionKey: string): string {
    const protocol = this.instance.sys.configuration.proxy.secure ? "https" : "http";
    const hostname = this.instance.sys.configuration.proxy.hostname;
    return `${protocol}://${hostname}/api/asset/image/${imageId}/${resolutionKey}`;
  }
}
