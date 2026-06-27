import * as fs from "@std/fs";
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
    if (
      !(await fs.exists(
        path.join(
          instance.sys.filesystem.SRC_ROOT,
          "../../applications/",
          applicationId,
          "manifest.json",
        ),
      ))
    ) return undefined;

    const decoder = new TextDecoder("utf-8");
    const applicationManifest = JSON.parse(
      decoder.decode(
        await Deno.readFile(
          path.join(
            instance.sys.filesystem.SRC_ROOT,
            "../../applications/",
            applicationId,
            "manifest.json",
          ),
        ),
      ),
    ) as OnlineWorkspaceApplication;

    return {
      displayName: applicationManifest.displayName || "Not Defined",
      authors: applicationManifest.authors,
      description: applicationManifest.description || "Not Defined",
      icon: applicationManifest.icon
        ? applicationManifest.icon.type === "image"
          ? {
            type: "image",
            value: path.join(
              instance.sys.filesystem.APPLICATIONS_ROOT,
              applicationId,
              applicationManifest.icon.value,
            ),
          }
          : {
            type: "icon",
            value: path.join(
              instance.sys.filesystem.APPLICATIONS_ROOT,
              applicationId,
              applicationManifest.icon.value,
            ),
          }
        : {
          type: "icon",
          value: path.join(
            instance.sys.filesystem.APPLICATIONS_ROOT,
            applicationId,
            "web/node_modules/@material-symbols/svg-700/outlined/broken_image.svg",
          ),
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
          : applicationManifest.modules.deno
          ? applicationManifest.modules.deno.permissions
          : [],
    };
  }

  async searchForApplicationIds(query?: string): Promise<string[]> {
    let applicationIds: string[] = [];

    for await (
      const entry of Deno.readDir(
        path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/"),
      )
    ) {
      if (query === undefined) {
        applicationIds.push(entry.name);
        continue;
      }

      if (entry.name.includes(query)) {
        applicationIds.push(entry.name);

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
