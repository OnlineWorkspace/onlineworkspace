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

        return {};
    }

    searchForApplicationIds(query?: string) {
        return (await fs.readdir(path.join(instance.subSystems.filesystem.SRC_ROOT, "../../applications/"))).filter((a) =>
            query !== undefined ? a.includes(query) : true,
        );
    }

    getApplicationSummaryById(applicationId: string) {}

    getPromotedApplications() {
        return [];
    }
}
