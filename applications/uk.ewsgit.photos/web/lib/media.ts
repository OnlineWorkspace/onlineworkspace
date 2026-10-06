import { APPLICATION_ID } from "./routes";

// what the server makes previews in, a request is rounded up to the next one so that the cache stays small
const THUMBNAIL_SIZES = [256, 512, 1024, 2048] as const;

export const thumbnailSize = (cssPixels: number) => {
  const pixels = cssPixels * (window.devicePixelRatio || 1);
  return THUMBNAIL_SIZES.find((size) => size >= pixels) ?? THUMBNAIL_SIZES[THUMBNAIL_SIZES.length - 1]!;
};

const base = (id: number) => `/api/${APPLICATION_ID}/media/${id}`;

export const thumbnailUrl = (id: number, version: number, size: number) => `${base(id)}/thumbnail?size=${size}&v=${version}`;

export const fileUrl = (id: number, version: number, download = false) => `${base(id)}/file?v=${version}${download ? "&download=1" : ""}`;

export const shareUrl = (token: string) => `${window.location.origin}/api/${APPLICATION_ID}/s/${token}`;

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

export const faceUrl = (faceId: number, size: number) => `/api/${APPLICATION_ID}/faces/${faceId}/crop?size=${size}`;
