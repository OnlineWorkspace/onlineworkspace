export interface ViewItem {
    name: string;
    path: string;
    type: "directory" | "file" | "alias" | "ghost";
    icon?: string;
}
