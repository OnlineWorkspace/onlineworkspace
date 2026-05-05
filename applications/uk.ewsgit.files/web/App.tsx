import {Route} from "@solidjs/router";
import {type Accessor, type Component, createSignal, lazy, onMount, type Setter} from "solid-js";
import {createStore, type SetStoreFunction, type Store} from "solid-js/store";
import {AppContext} from "./appContext.ts";
import ActionBar from "./layout/components/ActionBar/ActionBar.tsx";
import layoutStyles from "./layout/Layout.module.scss";
import trpc from "./lib/trpc.ts";
import View from "./pages/dir/View.tsx";
import type {ViewItem} from "./pages/dir/viewItem.ts";
import Redirect from "./Redirect.tsx";

const Layout = lazy(() => import("./layout/Layout.tsx"));
const WelcomePage = lazy(() => import("./pages/welcome/Index.tsx"));

interface UserPreferences {
  showWelcome: boolean;
  homePath: string;
  pinnedDirectories: string[];
  viewType: "grid" | "details" | "gallery";
  showPreview: boolean;
  zoomPercentage: number;
  showHidden: boolean;
}

interface ViewState {
  viewItems: ViewItem[];
  selectedItems: string[];
  lastSelectionTime: number;
  lastSelectedItem: string | undefined;
  viewId: number;
  isLoading: boolean;
  isRenaming: string | undefined;
}

interface GlobalState {
  showPreview: boolean;
  disableShortcuts: boolean;
}

interface AppContextType {
  isAdministrator: Accessor<boolean>;
  shootYourselfInTheFoot: Accessor<boolean>;
  userPreferences: Store<UserPreferences>;
  setUserPreferences: SetStoreFunction<UserPreferences>;
  viewState: Store<ViewState>;
  setViewState: SetStoreFunction<ViewState>;
  globalState: Store<GlobalState>;
  setGlobalState: SetStoreFunction<GlobalState>;
  deletedItemCount: number;
  isDesktopApp: boolean;
  tasks: Accessor<Task[]>;
  setTasks: Setter<Task[]>;
}

interface Task {
  parent: `view${number}` | string,
  max: number,
  current: number,
  // replaces %m with max and %c with current
  message: string,
  id: string,
  type: string,

  // Internal use only
  invalid?: boolean
}

export type {AppContextType, Task};

const App: Component = () => {
  const [ hasLoaded, setHasLoaded ] = createSignal<boolean>(false);
  const [ userPreferences, setUserPreferences ] = createStore<AppContextType[ "userPreferences" ]>({
    showWelcome: true,
    homePath: "remote:/users",
    pinnedDirectories: [ "remote:/users" ],
    viewType: "details",
    showPreview: false,
    zoomPercentage: 1,
    showHidden: false
  });
  const [ viewState, setViewState ] = createStore<AppContextType[ "viewState" ]>({
    viewItems: [],
    selectedItems: [],
    lastSelectionTime: -1,
    lastSelectedItem: undefined,
    viewId: 0,
    isLoading: true,
    isRenaming: undefined
  });
  const [ globalState, setGlobalState ] = createStore<GlobalState>({
    showPreview: false,
    disableShortcuts: false,
  })
  const [ taskStatus, setTaskStatus ] = createSignal<Task[]>([])

  onMount(async () => {
    const userServerPreferences = await trpc.userPreferences.get.query();

    setUserPreferences("showWelcome", userServerPreferences.showWelcome);
    setUserPreferences("homePath", userServerPreferences.homePath);
    setUserPreferences("pinnedDirectories", userServerPreferences.pinnedDirectories);

    setHasLoaded(true);
  });

  return (
    <Route
      component={(props) => {
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
              deletedItemCount: 24,
              isDesktopApp: localStorage.getItem("onlineworkspace_workspace_desktop_app") === "true",
              tasks: taskStatus,
              setTasks: setTaskStatus
            }}
          >
            {props.children}
          </AppContext.Provider>
        );
      }}
    >
      {!hasLoaded() && <Route path={"*"} component={() => "Loading..."} />}
      <Route
        path={"/"}
        component={() => (
          <Redirect to={userPreferences.showWelcome ? "/app/uk.ewsgit.files/welcome" : `/app/uk.ewsgit.files/dir?path=${userPreferences.homePath}`} />
        )}
      />
      <Route path={"/welcome"} component={WelcomePage} />
      <Route component={Layout}>
        <Route
          path={"/dir"}
          component={() => (
            <>
              <div class={layoutStyles.actionBar}>
                <ActionBar />
              </div>
              <View />
            </>
          )}
        />
        <Route
          component={(props) => (
            <>
              <div class={layoutStyles.actionBar} />
              {props.children}
            </>
          )}
        >
          <Route path={"/shared"} component={() => "Shared with me page"} />
          <Route path={"/bin"} component={() => "Bin page"} />
        </Route>
      </Route>
    </Route>
  );
};

export default App;
