export interface WorkspacesApplication {
    id: string;
    // if undefined, just the id is used
    displayName?: string;
    icon?: {
        type: "icon" | "image";
        value: string;
    };
    description?: string;
    authors: string[];
    license: string;
    source?: string;
    modules: {
        // not yet supported
        docker?: {}[];
        // located at /app/[id]/
        web?: { path: string };
        // run bun ./[path.ts]
        bun?: { path: string };
        // run ./[path]
        script?: { path: string };
    };
    version?: string;
}
