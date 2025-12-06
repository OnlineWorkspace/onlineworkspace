export interface RepositoryApplication {
    id: string;
    displayName: string;
    icon: { type: "icon" | "image"; value: string };
    description: string;
    authors: { name: string; link: string }[];
    modules: string[];
    bannerImage?: string;
}
export interface RepositoryApplicationSummary {
    id: string;
    displayName: string;
    icon: { type: "icon" | "image"; value: string };
    bannerImage?: string;
    authors: string[];
}

export default abstract class ApplicationRepository {
    abstract id: string;

    abstract getApplicationById(applicationId: string): Promise<RepositoryApplication | undefined>;
    abstract searchForApplicationIds(query: string): Promise<string[]>;
    abstract getApplicationSummaryById(applicationId: string): Promise<RepositoryApplicationSummary | undefined>;
    abstract getPromotedApplications(): Promise<string[]>;
    abstract getInstallPath(applicationId: string): Promise<string>;
}
