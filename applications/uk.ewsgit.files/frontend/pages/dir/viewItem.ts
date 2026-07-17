type ViewItem = {
  path: string;
  type: "file" | "directory" | "link";
  thumbnail?: string;
  shared?: boolean;
  size?: number;
  hidden?: boolean;
  createdAt?: number;
  modifiedAt?: number;
};

export type { ViewItem };
