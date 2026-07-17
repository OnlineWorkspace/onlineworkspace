import { Route } from "@solidjs/router";
import { type Component, lazy, useContext } from "solid-js";
import styles from "./App.module.scss";
import { AppContext } from "./appContext.ts";
import Core from "./Core.tsx";
import ActionBar from "./layout/components/ActionBar/ActionBar.tsx";
import layoutStyles from "./layout/Layout.module.scss";
import View from "./pages/dir/View.tsx";
import Redirect from "./Redirect.tsx";

const Layout = lazy(() => import("./layout/Layout.tsx"));
const WelcomePage = lazy(() => import("./pages/welcome/Index.tsx"));

const App: Component = () => {
  return (
    <Route component={Core}>
      <Route
        path={"/"}
        component={() => {
          const appContext = useContext(AppContext);

          return (
            <Redirect
              to={
                appContext?.userPreferences.showWelcome
                  ? "/app/uk.ewsgit.files/welcome"
                  : `/app/uk.ewsgit.files/dir?path=${appContext?.userPreferences.homePath}`
              }
            />
          );
        }}
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
              <View viewId={0} />
            </>
          )}
        />
        <Route
          path={"/split-dir"}
          component={() => (
            <>
              <div class={layoutStyles.actionBar}>
                <ActionBar />
              </div>
              <div class={styles.splitView}>
                <View viewId={0} />
                <View viewId={1} />
              </div>
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
          <Route
            path={"/bin"}
            component={() => (
              <>
                <View viewId={0} pathOverride="remote:/users/1/recycle_bin" disallowCreation />
              </>
            )}
          />
        </Route>
      </Route>
    </Route>
  );
};

export default App;
