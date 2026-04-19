import { Route } from "@solidjs/router";
import { type Accessor, type Component, createSignal, lazy, onMount } from "solid-js";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";
import { AppContext } from "./appContext.ts";
import trpc from "./lib/trpc.ts";
import View from "./pages/dir/View.tsx";
import type { ViewItem } from "./pages/dir/viewItem.ts";
import Redirect from "./Redirect.tsx";

const Layout = lazy(() => import("./layout/Layout.tsx"));
const WelcomePage = lazy(() => import("./pages/welcome/Index.tsx"));

interface UserPreferences {
  showWelcome: boolean;
  homePath: string;
  pinnedDirectories: string[];
  viewType: "grid" | "details" | "gallery";
}

interface ViewState {
  viewItems: ViewItem[];
  selectedItems: string[];
}

interface AppContextType {
  isAdministrator: Accessor<boolean>;
  shootYourselfInTheFoot: Accessor<boolean>;
  userPreferences: Store<UserPreferences>;
  setUserPreferences: SetStoreFunction<UserPreferences>;
  viewState: Store<ViewState>;
  setViewState: SetStoreFunction<ViewState>;
  deletedItemCount: number;
}

export type { AppContextType };

const App: Component = () => {
  const [hasLoaded, setHasLoaded] = createSignal<boolean>(false);
  const [userPreferences, setUserPreferences] = createStore<AppContextType["userPreferences"]>({
    showWelcome: true,
    homePath: "/Users/1/fs/",
    pinnedDirectories: ["/home"],
    viewType: "details",
  });
  const [viewState, setViewState] = createStore<AppContextType["viewState"]>({
    viewItems: [],
    selectedItems: [],
  });

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
        <Route path={"/dir"} component={View} />
        <Route path={"/shared"} component={() => "Shared with me page"} />
        <Route path={"/bin"} component={() => "Bin page"} />
      </Route>
    </Route>
  );
};

export default App;
