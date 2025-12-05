import path from "path";
import ApplicationRepository, { type RepositoryApplication, type RepositoryApplicationSummary } from "./applicationRepository";
import fs from "fs/promises";

class LocalApplicationRepository extends ApplicationRepository {
    constructor() {
        super();
        return this;
    }

    async getApplicationById(applicationId: string): Promise<RepositoryApplication> {
        let applicationManifest = JSON.parse(
            (
                await fs.readFile(path.join(instance.subSystems.filesystem.SRC_ROOT, "../../applications/", applicationId, "manifest.json"))
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
            icon: applicationManifest.icon,
            id: applicationId,
            modules: Object.keys(applicationManifest.modules),
        };
    }

    async searchForApplicationIds(query?: string): Promise<string[]> {
        return (await fs.readdir(path.join(instance.subSystems.filesystem.SRC_ROOT, "../../applications/"))).filter((a) =>
            query !== undefined ? a.includes(query) : true,
        );
    }

    async getApplicationSummaryById(applicationId: string): Promise<RepositoryApplicationSummary> {
        let app = this.getApplicationById(applicationId);

        return {
            id: applicationId,
            authors: (await app).authors.map((a) => a.name),
            displayName: (await app).displayName,
            icon: (await app).icon,
        };
    }

    async getPromotedApplications(): Promise<string[]> {
        return [];
    }
}
