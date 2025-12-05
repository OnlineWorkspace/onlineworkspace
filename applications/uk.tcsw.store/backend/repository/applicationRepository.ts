export interface RepositoryApplication {
    id: string;
    displayName: string;
    icon: string;
    description: string;
    authors: { name: string; link: string }[];
    modules: string[];
}
export interface RepositoryApplicationSummary {}

export default abstract class ApplicationRepository {
    abstract getApplicationById(applicationId: string): Promise<RepositoryApplication>;
    abstract searchForApplicationIds(query: string): Promise<string[]>;
    abstract getApplicationSummaryById(applicationId: string): Promise<RepositoryApplicationSummary>;
    abstract getPromotedApplications(): Promise<string[]>;
}
