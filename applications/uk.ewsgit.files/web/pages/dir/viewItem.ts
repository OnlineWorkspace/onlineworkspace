type ViewItem = {
  path: string;
  type: "file" | "directory" | "link";
  thumbnail?: string;
  shared?: boolean;
};

export type { ViewItem };
