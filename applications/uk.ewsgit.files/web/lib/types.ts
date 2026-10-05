import type { ListedEntry } from "../../backend/index";

export type Entry = ListedEntry;
export type FileGroup = "images" | "videos" | "audio" | "documents";
export type SortKey = "name" | "modified" | "size";

export const GROUPS: { id: FileGroup; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "documents", label: "Docs" },
];
