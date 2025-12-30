export interface WorkspacesApplicationServiceStatus {
    service: "docker" | "web" | "bun";
    status: "online" | "warning" | "error" | "unknown" | "offline";
}
