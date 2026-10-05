import { APPLICATION_ID } from "./trpc";
import type { FileGroup } from "./types";

const BASE = `/app/${APPLICATION_ID}`;

export const routes = {
  home: () => `${BASE}/`,
  browse: (virtualPath: string) => `${BASE}/browse${virtualPath === "/" ? "/" : virtualPath}`,
  recent: () => `${BASE}/recent`,
  starred: () => `${BASE}/starred`,
  trash: () => `${BASE}/trash`,
  group: (group: FileGroup) => `${BASE}/group/${group}`,
};

export function parentOf(virtualPath: string): string {
  const segments = virtualPath.split("/").filter(Boolean);
  return `/${segments.slice(0, -1).join("/")}`;
}

/** The splat of `/browse/*path` back into a virtual path. */
export function pathFromParam(param: string | undefined): string {
  return `/${(param ?? "").split("/").filter(Boolean).map(decodeURIComponent).join("/")}`;
}
