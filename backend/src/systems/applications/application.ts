export interface OnlineWorkspaceApplication {
  id: string;
  // if undefined, just the id is used
  displayName?: string;
  icon?: {
    type: "icon" | "image";
    value: string;
  };
  bannerImage?: string;
  description?: string;
  authors: { name: string, link: string }[];
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
    // load a typescript module directly into the main process (These modules are unsafe as they have control over everything within the OnlineWorkspace instance)
    internal?: { path: string };
    // run a deno process with the requested permissions
    deno?: { path: string, permissions: ("run" | "read" | "write" | "net" | "env" | "sys" | "ffi")[] };
    // run ./[path]
    external?: { path: string };
  };
  version?: string;
}
