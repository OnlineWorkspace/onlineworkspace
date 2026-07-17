import { createContext, type Accessor } from "solid-js";
import type { ViewItem } from "./viewItem.ts";

export const ViewContext = createContext<{
    selectedItems: Accessor<string[]>;
    setSelectedItems(items: string[]): void;
    lastSelectionIndex: Accessor<number | undefined>;
    setLastSelectionIndex(index: number | undefined): void;
    viewItems: Accessor<ViewItem[]>;
    setViewItems(items: ViewItem[]): void;
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
    activeTasks: Accessor<{ taskId: string; message: string }[]>;
    setActiveTasks(tasks: { taskId: string; message: string }[]): void;
}>();
