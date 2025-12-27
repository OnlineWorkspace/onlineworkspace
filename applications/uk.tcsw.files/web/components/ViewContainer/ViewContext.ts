import { createContext, type Accessor } from "solid-js";

export const ViewContext = createContext<{
    selectedItems: Accessor<string[]>;
    setSelectedItems(items: string[]): void;
    lastSelectionIndex: Accessor<number | undefined>;
    setLastSelectionIndex(index: number | undefined): void;
    viewItems: Accessor<string[]>;
    setViewItems(items: string[]): void;
    renameEntry: Accessor<string | undefined>;
    setRenameEntry(path: string | undefined): void;
    viewType: Accessor<"grid" | "list">;
    setViewType(viewType: "grid" | "list"): void;
}>();
