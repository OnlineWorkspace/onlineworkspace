import { type Component, createSignal, onMount, type ParentProps } from "solid-js";
import { createStore } from "solid-js/store";
import { AppContext, type AppContextType } from "./appContext";
import type { Task } from "./layout/components/StatusBar/task";
import trpc from "./lib/trpc";

export interface Preferences {
  showWelcome: boolean;
  homePath: string;
  pinnedDirectories: string[];
  viewType: "grid" | "details" | "gallery";
  showPreview: boolean;
  zoomPercentage: number;
  showHidden: boolean;
}

export interface GlobalState {
  showPreview: boolean;
  disableShortcuts: boolean;
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
  const [globalState, setGlobalState] = createStore<GlobalState>({
    showPreview: false,
    disableShortcuts: false,
  });
  const [taskStatus, setTaskStatus] = createSignal<Task[]>([]);

  onMount(async () => {
    const userServerPreferences = await trpc.userPreferences.get.query();

    setUserPreferences("showWelcome", userServerPreferences.showWelcome);
    setUserPreferences("homePath", userServerPreferences.homePath);
    setUserPreferences("pinnedDirectories", userServerPreferences.pinnedDirectories);
  });

  return (
    <AppContext.Provider
      value={{
        isAdministrator: () => false,
        shootYourselfInTheFoot: () => false,
        userPreferences: userPreferences,
        setUserPreferences: setUserPreferences,
        globalState: globalState,
        setGlobalState: setGlobalState,
        deletedItemCount: 24,
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
