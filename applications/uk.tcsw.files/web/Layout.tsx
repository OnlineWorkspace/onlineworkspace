import { createSignal, type Component, type ParentProps } from "solid-js";
import ActionsMenuBar from "./components/ActionsMenuBar/ActionsMenuBar.tsx";
import PathBar from "./components/PathBar/PathBar.tsx";
import SideBar from "./components/SideBar/SideBar.tsx";
import StatusBar from "./components/StatusBar/StatusBar.tsx";
import styles from "./Layout.module.scss";
import { ViewContext } from "./components/ViewContainer/ViewContext.ts";

const Layout: Component<ParentProps> = (props) => {
    const [selectedItems, setSelectedItems] = createSignal<string[]>([]);
    const [lastSelectionIndex, setLastSelectionIndex] = createSignal<number | undefined>(undefined);
    const [viewItems, setViewItems] = createSignal<string[]>([]);
    const [renameEntry, setRenameEntry] = createSignal<string | undefined>(undefined);

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
            }}
        >
            <div class={styles.root}>
                <ActionsMenuBar />
                <PathBar />
                <SideBar />
                <div class={styles.view}>{props.children}</div>
                <StatusBar />
            </div>
        </ViewContext.Provider>
    );
};

export default Layout;
