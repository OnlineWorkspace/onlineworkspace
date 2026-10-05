import type { Entry, SortKey } from "./types";

export type TypeFilter = "images" | "videos" | "audio" | "documents" | "archives";
export type SizeFilter = "small" | "medium" | "large";

export interface Filters {
  type?: TypeFilter;
  recentOnly: boolean;
  size?: SizeFilter;
}

export const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "audio", label: "Audio" },
  { id: "documents", label: "Documents" },
  { id: "archives", label: "Archives" },
];

export const SIZE_FILTERS: { id: SizeFilter; label: string }[] = [
  { id: "small", label: "Under 1 MB" },
  { id: "medium", label: "1 – 100 MB" },
  { id: "large", label: "Over 100 MB" },
];

const DAY = 24 * 60 * 60 * 1000;
const MB = 1_000_000;

const matchesType = (entry: Entry, type: TypeFilter) => {
  switch (type) {
    case "images":
      return entry.category === "image";
    case "videos":
      return entry.category === "video";
    case "audio":
      return entry.category === "audio";
    case "archives":
      return entry.category === "archive";
    case "documents":
      return ["pdf", "spreadsheet", "document", "presentation", "text"].includes(entry.category);
  }
};

/** Filters only ever apply to files, folders always stay visible. */
export function filterFiles(files: Entry[], filters: Filters, now = Date.now()): Entry[] {
  return files.filter((file) => {
    if (filters.type && !matchesType(file, filters.type)) return false;
    if (filters.recentOnly && now - file.modified > 30 * DAY) return false;
    if (filters.size === "small" && file.size >= MB) return false;
    if (filters.size === "medium" && (file.size < MB || file.size > 100 * MB)) return false;
    if (filters.size === "large" && file.size <= 100 * MB) return false;
    return true;
  });
}

export function sortEntries(entries: Entry[], key: SortKey, descending: boolean): Entry[] {
  const direction = descending ? -1 : 1;

  return [...entries].sort((a, b) => {
    const primary = key === "name" ? 0 : key === "modified" ? a.modified - b.modified : a.size - b.size;

    return (primary || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })) * direction;
  });
}

export const hasActiveFilters = (filters: Filters) => !!filters.type || filters.recentOnly || !!filters.size;
