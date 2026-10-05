import path from "node:path";

export type FileCategory = "image" | "video" | "audio" | "pdf" | "spreadsheet" | "document" | "presentation" | "text" | "code" | "archive" | "other";

// the grouping used by the "Categories" tiles on the home page
export type FileGroup = "images" | "videos" | "audio" | "documents";

interface TypeInfo {
  category: FileCategory;
  label: string;
}

const TYPES: Record<string, TypeInfo> = {};

const register = (category: FileCategory, label: string, extensions: string[]) => {
  for (const extension of extensions) TYPES[extension] = { category, label };
};

register("image", "Image", ["gif", "webp", "avif", "ico", "bmp", "tiff", "heic"]);
TYPES.png = { category: "image", label: "PNG image" };
TYPES.jpg = TYPES.jpeg = { category: "image", label: "JPEG image" };
TYPES.svg = { category: "image", label: "SVG image" };
register("video", "Video", ["mp4", "webm", "mkv", "mov", "avi", "m4v"]);
register("audio", "Audio", ["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus"]);
register("pdf", "PDF document", ["pdf"]);
register("spreadsheet", "Spreadsheet", ["xlsx", "xls", "ods", "csv"]);
register("document", "Word document", ["docx", "doc", "odt", "rtf"]);
register("presentation", "Presentation", ["pptx", "ppt", "odp"]);
register("text", "Plain text", ["txt", "log"]);
TYPES.md = { category: "text", label: "Markdown text" };
register("code", "Source code", ["ts", "tsx", "js", "jsx", "json", "html", "css", "scss", "rs", "py", "go", "c", "cpp", "h", "java", "sh", "yml", "yaml", "toml", "xml", "sql"]);
register("archive", "Compressed archive", ["zip", "tar", "gz", "rar", "7z", "bz2", "xz"]);

export function extensionOf(name: string): string {
  return path.extname(name).slice(1).toLowerCase();
}

export function describeFileType(name: string): TypeInfo & { extension: string } {
  const extension = extensionOf(name);
  const info = TYPES[extension];

  if (info) return { ...info, extension };

  return { category: "other", label: extension ? `${extension.toUpperCase()} file` : "File", extension };
}

export function groupOf(category: FileCategory): FileGroup | undefined {
  switch (category) {
    case "image":
      return "images";
    case "video":
      return "videos";
    case "audio":
      return "audio";
    case "pdf":
    case "spreadsheet":
    case "document":
    case "presentation":
    case "text":
      return "documents";
    default:
      return undefined;
  }
}
