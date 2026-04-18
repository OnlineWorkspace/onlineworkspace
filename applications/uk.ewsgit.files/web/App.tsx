import { Route } from "@solidjs/router";
import { type Accessor, type Component, createSignal, lazy, onMount } from "solid-js";
import { createStore, type Store } from "solid-js/store";
import { AppContext } from "./appContext.ts";
import trpc from "./lib/trpc.ts";
import Redirect from "./Redirect.tsx";

const Layout = lazy(() => import("./layout/Layout.tsx"));
const WelcomePage = lazy(() => import("./pages/welcome/Index.tsx"));

interface AppContextType {
  isAdministrator: Accessor<boolean>;
  shootYourselfInTheFoot: Accessor<boolean>;
  userPreferences: Store<{
    showWelcome: boolean;
    homePath: string;
    pinnedDirectories: string[];
  }>;
}

export type { AppContextType };

const App: Component = () => {
  const [hasLoaded, setHasLoaded] = createSignal<boolean>(false);
  const [userPreferences, setUserPreferences] = createStore<AppContextType["userPreferences"]>({
    showWelcome: true,
    homePath: "/Users/1/fs/",
    pinnedDirectories: ["/home"],
  });

  onMount(async () => {
    const userServerPreferences = await trpc.userPreferences.get.query();

    setUserPreferences("showWelcome", userServerPreferences.showWelcome);
    setUserPreferences("homePath", userServerPreferences.homePath);
    setUserPreferences("pinnedDirectories", userServerPreferences.pinnedDirectories);

    setHasLoaded(true);
  });

  return (
    <AppContext.Provider
      value={{
        isAdministrator: () => false,
        shootYourselfInTheFoot: () => false,
        userPreferences: userPreferences,
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
        <Route path={"/dir"} component={() => "Dir View"} />
      </Route>
      {/*<Route component={Layout}>*/}
      {/*  <Route path={"/dir"} component={ViewContainer} />*/}
      {/*  <Route path={"/dir/*currentPath"} component={ViewContainer} />*/}
      {/*</Route>*/}
    </AppContext.Provider>
  );
};

export default App;
