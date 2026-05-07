export interface WorkspacesApplication {
  id: string;
  // if undefined, just the id is used
  displayName?: string;
  icon?: {
    type: "icon" | "image";
    value: string;
  };
  description?: string;
  authors: string[];
  license: string;
  source?: string;
  dependsOn?: {
    applications: {
      id: string;
      repository?: string;
    }[];
  };
  graphicsAcceleration?: string;
  modules: {
    // located at /app/[id]/
    web?: { path: string };
    // run bun ./[path.ts]
    internal?: { path: string };
    // run ./[path]
    external?: { path: string };
  };
  version?: string;
}
