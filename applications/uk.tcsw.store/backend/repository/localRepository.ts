import path from "path";
import ApplicationRepository, {
    type RepositoryApplication,
    type RepositoryApplicationSummary,
} from "./applicationRepository";
import fs from "fs/promises";

export default class LocalApplicationRepository extends ApplicationRepository {
    id = "local";

    constructor() {
        super();
        return this;
    }

    async getApplicationById(applicationId: string): Promise<RepositoryApplication | undefined> {
        if (
            !(await fs.exists(
                path.join(
                    instance.sys.filesystem.SRC_ROOT,
                    "../../applications/",
                    applicationId,
                    "manifest.json",
                ),
            ))
        )
            return undefined;

        let applicationManifest = JSON.parse(
            (
                await fs.readFile(
                    path.join(
                        instance.sys.filesystem.SRC_ROOT,
                        "../../applications/",
                        applicationId,
                        "manifest.json",
                    ),
                )
            ).toString(),
        );

        return {
            displayName: applicationManifest.displayName,
            authors: applicationManifest.authors.map((a: string) => {
                return {
                    name: a,
                    link: "[not implemented for this application repository]",
                };
            }),
            description: applicationManifest.description,
            icon:
                applicationManifest.icon.type === "image"
                    ? {
                          type: "image",
                          value: path.join(
                              instance.sys.filesystem.SRC_ROOT,
                              "../../applications/",
                              applicationId,
                              applicationManifest.icon.value,
                          ),
                      }
                    : applicationManifest.icon,
            id: applicationId,
            modules: Object.keys(applicationManifest.modules),
            bannerImage: applicationManifest.bannerImage
                ? path.join(
                      instance.sys.filesystem.SRC_ROOT,
                      "../../applications/",
                      applicationId,
                      applicationManifest.bannerImage,
                  )
                : undefined,
        };
    }

    async searchForApplicationIds(query?: string): Promise<string[]> {
        return (
            await fs.readdir(path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/"))
        ).filter((a) => (query !== undefined ? a.includes(query) : true));
    }

    async getApplicationSummaryById(
        applicationId: string,
    ): Promise<RepositoryApplicationSummary | undefined> {
        let app = await this.getApplicationById(applicationId);

        if (!app) return undefined;

        return {
            id: applicationId,
            authors: app.authors.map((a) => a.name),
            displayName: app.displayName,
            icon: app.icon,
            bannerImage: app.bannerImage,
        };
    }

    async getPromotedApplications(): Promise<string[]> {
        return ["uk.tcsw.dashboard", "uk.tcsw.settings", "uk.tcsw.ghostty"];
    }

    async getInstallURI(applicationId: string): Promise<string> {
        return `local:${applicationId}`;
    }

    async getSourcePath(applicationId: string): Promise<string> {
        return path.join(instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationId);
    }
}
