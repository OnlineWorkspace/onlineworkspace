import fs from "node:fs/promises";
import path from "node:path";
import ApplicationRepository, { type RepositoryApplication, type RepositoryApplicationSummary } from "./applicationRepository.ts";

export default class LocalApplicationRepository extends ApplicationRepository {
  id = "local";

  async getApplicationById(applicationId: string): Promise<RepositoryApplication | undefined> {
    if (!(await fs.exists(path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId, "manifest.json")))) return undefined;

    const applicationManifest = JSON.parse(
      (await fs.readFile(path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId, "manifest.json"))).toString(),
    );

    return {
      displayName: applicationManifest.displayName,
      authors: applicationManifest.authors,
      description: applicationManifest.description,
      icon:
        applicationManifest.icon.type === "image"
          ? {
              type: "image",
              value: path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId, applicationManifest.icon.value),
            }
          : {
              type: "icon",
              value: path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId, applicationManifest.icon.value),
            },
      id: applicationId,
      modules: Object.keys(applicationManifest.modules),
      bannerImage: applicationManifest.bannerImage
        ? path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId, applicationManifest.bannerImage)
        : undefined,
    };
  }

  async searchForApplicationIds(query?: string): Promise<string[]> {
    return (await fs.readdir(path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/"))).filter((a) =>
      query !== undefined ? a.includes(query) : true,
    );
  }

  async getApplicationSummaryById(applicationId: string): Promise<RepositoryApplicationSummary | undefined> {
    const app = await this.getApplicationById(applicationId);

    if (!app) return undefined;

    return {
      id: applicationId,
      authors: app.authors,
      displayName: app.displayName,
      icon: app.icon,
      bannerImage: app.bannerImage,
      description: app.description,
    };
  }

  async getPromotedApplications(): Promise<string[]> {
    return ["uk.ewsgit.dashboard", "uk.ewsgit.settings", "uk.ewsgit.ghostty"];
  }

  async getInstallURI(applicationId: string): Promise<string> {
    return `local:${applicationId}`;
  }

  async getSourcePath(applicationId: string): Promise<string> {
    return path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId);
  }
}
