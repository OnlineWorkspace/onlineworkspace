import { type Component, createSignal, type ParentProps } from "solid-js";
import PathBar from "./components/PathBar/PathBar.tsx";
import SideBar from "./components/SideBar/SideBar.tsx";
import StatusBar from "./components/StatusBar/StatusBar.tsx";
import { ViewContext } from "./components/ViewContainer/ViewContext.ts";
import styles from "./Layout.module.scss";

const Layout: Component<ParentProps> = (props) => {
  const [selectedItems, setSelectedItems] = createSignal<string[]>([]);
  const [lastSelectionIndex, setLastSelectionIndex] = createSignal<number | undefined>(undefined);
  const [viewItems, setViewItems] = createSignal<
    { name: string; path: string; type: "directory" | "file" | "alias" }[]
  >([]);
  const [viewType, setViewType] = createSignal<"grid" | "list">("grid");
  const [renameEntry, setRenameEntry] = createSignal<string | undefined>(undefined);
  const [cutItems, setCutItems] = createSignal<string[]>([]);
  const [copyItems, setCopyItems] = createSignal<string[]>([]);
  const [reload, setReload] = createSignal<number>(0);
  const [activeTasks, setActiveTasks] = createSignal<{ taskId: string; message: string }[]>([]);

  return (
    <ViewContext.Provider
      value={{
        selectedItems: selectedItems,
        setSelectedItems: setSelectedItems,
        lastSelectionIndex: lastSelectionIndex,
        setLastSelectionIndex: setLastSelectionIndex,
        viewItems: viewItems,
        setViewItems: setViewItems,
        renameEntry: renameEntry,
        setRenameEntry: setRenameEntry,
        viewType: viewType,
        setViewType: setViewType,
        cutItems: cutItems,
        setCutItems: setCutItems,
        copyItems: copyItems,
        setCopyItems: setCopyItems,
        reload: reload,
        setReload: () => setReload((pv) => pv + 1),
        activeTasks: activeTasks,
        setActiveTasks: setActiveTasks,
      }}
    >
      <div class={styles.root}>
        <PathBar />
        <SideBar />
        <div class={styles.view}>{props.children}</div>
        <StatusBar />
      </div>
    </ViewContext.Provider>
  );
};

export default Layout;
