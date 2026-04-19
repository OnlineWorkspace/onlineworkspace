type ViewItem = {
  path: string;
  type: "file" | "directory" | "link";
  thumbnail?: string;
  shared?: boolean;
  size?: number;
};

export type { ViewItem };
