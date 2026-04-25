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
  detailsViewIconSize: number;
  gridViewIconSize: number;
  showHidden: boolean;
}

interface ViewState {
  viewItems: ViewItem[];
  selectedItems: string[];
  lastSelectionTime: number;
  viewId: number;
}

interface AppContextType {
  isAdministrator: Accessor<boolean>;
  shootYourselfInTheFoot: Accessor<boolean>;
  userPreferences: Store<UserPreferences>;
  setUserPreferences: SetStoreFunction<UserPreferences>;
  viewState: Store<ViewState>;
  setViewState: SetStoreFunction<ViewState>;
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

  // Internal use only
  invalid?: boolean
}

export type {AppContextType, Task};

const App: Component = () => {
  const [ hasLoaded, setHasLoaded ] = createSignal<boolean>(false);
  const [ userPreferences, setUserPreferences ] = createStore<AppContextType[ "userPreferences" ]>({
    showWelcome: true,
    homePath: "remote:/users/1/fs/",
    pinnedDirectories: [ "remote:/users/1/fs/" ],
    viewType: "details",
    showPreview: false,
    detailsViewIconSize: 32,
    gridViewIconSize: 128,
    showHidden: false
  });
  const [ viewState, setViewState ] = createStore<AppContextType[ "viewState" ]>({
    viewItems: [],
    selectedItems: [],
    lastSelectionTime: -1,
    viewId: 0,
  });
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
