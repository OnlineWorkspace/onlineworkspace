import type { MediaItem } from "../lib/types";

/** What `media.get` returns: the list entry plus everything the info panel shows. */
export interface MediaDetail extends MediaItem {
  name: string;
  folder: string;
  size: number;
  description: string;
  location: string | null;
  camera: string | null;
  exposure: string | null;
  archived: boolean;
  deleted: boolean;
  albums: { id: number; name: string }[];
}
