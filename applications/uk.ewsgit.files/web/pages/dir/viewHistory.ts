import path from "path-browserify";
import type { UniformResourceLocator } from "../../lib/filesystemInterface";
import filesystemInterface from "../../lib/filesystemInterface";

export function canViewNavigateUp(url: UniformResourceLocator) {
  const parsedUrl = filesystemInterface.urlToPath(url);

  if (parsedUrl.type === "invalid") return false;

  const prePath = parsedUrl.path;
  const newPath = path.join(parsedUrl.path, "..");

  if (prePath === newPath) return false;

  return true;
}

export function viewNavigateUp(setPath: (path: string) => void, url: UniformResourceLocator) {
  const parsedUrl = filesystemInterface.urlToPath(url);

  if (parsedUrl.type === "invalid") return;

  setPath(`${parsedUrl.type}:${path.join(parsedUrl.path, "..")}`);
}
