import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import ApplicationRepository, {
  type RepositoryApplication,
  type RepositoryApplicationSummary,
} from "../applicationRepository.ts";
import { OnlineWorkspaceApplication } from "@onlineworkspace/workspace-backend/src/systems/applications/application.ts";

export default class LocalApplicationRepository extends ApplicationRepository {
  id = "local";

  async getApplicationById(
    applicationId: string,
  ): Promise<RepositoryApplication | undefined> {
    const manifestPath = path.join(
      instance.sys.filesystem.SRC_ROOT,
      "../../applications/",
      applicationId,
      "manifest.json",
    );

    if (!existsSync(manifestPath)) return undefined;

    const applicationManifest = JSON.parse(
      await fs.readFile(manifestPath, "utf8"),
    ) as OnlineWorkspaceApplication;

    return {
      displayName: applicationManifest.displayName || "Not Defined",
      authors: applicationManifest.authors,
      description: applicationManifest.description || "Not Defined",
      icon: {
        type: applicationManifest.icon?.type === "image" ? "image" : "icon",
        value: (await this.getIconPath(applicationId)) ?? "",
      },
      id: applicationId,
      modules: Object.keys(applicationManifest.modules),
      bannerImage: applicationManifest.bannerImage
        ? path.join(
          instance.sys.filesystem.APPLICATIONS_ROOT,
          applicationId,
          applicationManifest.bannerImage,
        )
        : undefined,
      permissions:
        (!!applicationManifest.modules.internal ||
            !!applicationManifest.modules.external)
          ? ["All"]
          : applicationManifest.modules.bun
          ? applicationManifest.modules.bun.permissions || []
          : [],
    };
  }

  async searchForApplicationIds(query?: string): Promise<string[]> {
    let applicationIds: string[] = [];
    const entries = await fs.readdir(
      path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/"),
    );

    for (const entry of entries) {
      if (query === undefined) {
        applicationIds.push(entry);
        continue;
      }

      if (entry.includes(query)) {
        applicationIds.push(entry);
      }
    }

    return applicationIds;
  }

  async getApplicationSummaryById(
    applicationId: string,
  ): Promise<RepositoryApplicationSummary | undefined> {
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

  async getIconPath(applicationId: string): Promise<string | undefined> {
    const manifestPath = path.join(this.getApplicationRoot(applicationId), "manifest.json");

    if (!existsSync(manifestPath)) return undefined;

    const icon = (JSON.parse(await fs.readFile(manifestPath, "utf8")) as OnlineWorkspaceApplication).icon;

    if (!icon) return undefined;

    const iconPath = icon.type === "material-symbol"
      ? path.join(instance.sys.filesystem.SRC_ROOT, "../../node_modules/@material-symbols/svg-700/outlined/", `${icon.value}.svg`)
      : path.join(this.getApplicationRoot(applicationId), icon.value);

    try {
      return await fs.realpath(iconPath);
    } catch (_) {
      return undefined;
    }
  }

  private getApplicationRoot(applicationId: string): string {
    return path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId);
  }

  async getInstallURI(applicationId: string): Promise<string> {
    return `local:${applicationId}`;
  }

  async getSourcePath(applicationId: string): Promise<string> {
    return path.join(
      instance.sys.filesystem.SRC_ROOT,
      "../../applications/",
      applicationId,
    );
  }
}
