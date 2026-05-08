import { type Component, createSignal, onMount, type ParentProps } from "solid-js";
import { createStore } from "solid-js/store";
import { AppContext, type AppContextType } from "./appContext";
import type { Task } from "./layout/components/StatusBar/task";
import type { UniformResourceLocator } from "./lib/filesystemInterface";
import trpc from "./lib/trpc";
import type { ViewState } from "./pages/dir/View";

export interface Preferences {
  showWelcome: boolean;
  homePath: UniformResourceLocator;
  pinnedDirectories: string[];
  viewType: "grid" | "details" | "gallery";
  showPreview: boolean;
  zoomPercentage: number;
  showHidden: boolean;
}

export interface GlobalState {
  showPreview: boolean;
  disableShortcuts: boolean;
  deletedItemCount: number;
  activeViewId: number;
}

const Core: Component<ParentProps> = (props) => {
  const [userPreferences, setUserPreferences] = createStore<AppContextType["userPreferences"]>({
    showWelcome: true,
    homePath: "remote:/users",
    pinnedDirectories: ["remote:/users"],
    viewType: "details",
    showPreview: false,
    zoomPercentage: 1,
    showHidden: false,
  });
  const [viewState, setViewState] = createStore<{ [viewId: number]: ViewState }>({
    0: {
      pathUrl: "remote:/",
      viewItems: [],
      selectedItems: [],
      lastSelectionTime: -1,
      lastSelectedItem: undefined,
      viewId: 0,
      isLoading: true,
      isRenaming: undefined,
    },
    1: {
      pathUrl: "remote:/",
      viewItems: [],
      selectedItems: [],
      lastSelectionTime: -1,
      lastSelectedItem: undefined,
      viewId: 0,
      isLoading: true,
      isRenaming: undefined,
    },
  });
  const [globalState, setGlobalState] = createStore<GlobalState>({
    showPreview: false,
    disableShortcuts: false,
    deletedItemCount: 0,
    activeViewId: 0,
  });
  const [taskStatus, setTaskStatus] = createSignal<Task[]>([]);

  onMount(async () => {
    const userServerPreferences = await trpc.userPreferences.get.query();

    setUserPreferences("showWelcome", userServerPreferences.showWelcome);
    setUserPreferences("homePath", userServerPreferences.homePath as UniformResourceLocator);
    setUserPreferences("pinnedDirectories", userServerPreferences.pinnedDirectories);
  });

  return (
    <AppContext.Provider
      value={{
        isAdministrator: () => false,
        shootYourselfInTheFoot: () => false,
        userPreferences: userPreferences,
        setUserPreferences: setUserPreferences,
        viewState: viewState,
        setViewState: setViewState,
        globalState: globalState,
        setGlobalState: setGlobalState,
        isDesktopApp: localStorage.getItem("onlineworkspace_workspace_desktop_app") === "true",
        tasks: taskStatus,
        setTasks: setTaskStatus,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default Core;
