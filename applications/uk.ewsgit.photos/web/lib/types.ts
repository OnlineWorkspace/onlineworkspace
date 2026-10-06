import type { MediaItem } from "../../backend/index";

export type { MediaItem };

export interface AlbumSummary {
  id: number;
  name: string;
  count: number;
  cover: { id: number; version: number } | null;
}

export type MediaScope = "all" | "favorites" | "videos" | "screenshots" | "archive" | "trash" | "album" | "memory" | "person";

export interface MediaQuery {
  scope: MediaScope;
  albumId?: number;
  personId?: number;
  memoryId?: string;
  query?: string;
  place?: string;
}

export type ShareTarget = { albumId: number; imageId?: undefined } | { imageId: number; albumId?: undefined };
