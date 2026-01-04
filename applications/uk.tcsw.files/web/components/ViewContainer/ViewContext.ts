import { createContext, type Accessor } from "solid-js";

export const ViewContext = createContext<{
    selectedItems: Accessor<string[]>;
    setSelectedItems(items: string[]): void;
    lastSelectionIndex: Accessor<number | undefined>;
    setLastSelectionIndex(index: number | undefined): void;
    viewItems: Accessor<{ name: string; path: string; type: "directory" | "file" | "alias" }[]>;
    setViewItems(items: { name: string; path: string; type: "directory" | "file" | "alias" }[]): void;
    renameEntry: Accessor<string | undefined>;
    setRenameEntry(path: string | undefined): void;
    viewType: Accessor<"grid" | "list">;
    setViewType(viewType: "grid" | "list"): void;
    cutItems: Accessor<string[]>;
    setCutItems(items: string[]): void;
    copyItems: Accessor<string[]>;
    setCopyItems(items: string[]): void;
    reload: Accessor<number>;
    setReload(): void;
    activeTasks: Accessor<{ [id: string]: string }>;
    setActiveTasks(tasks: { [id: string]: string }): void;
}>();
