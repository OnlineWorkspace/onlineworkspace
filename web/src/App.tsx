import { UIKitRoot } from "@ewsgit/uikit-solid/src/index.tsx";
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { type Component, lazy } from "solid-js";
import styles from "./App.module.scss";
import ApplicationsRouter from "./ApplicationsRouter.tsx";
import MissingApp from "./MissingApp.tsx";
import AppIndex from "./pages/app/Index.tsx";

const App: Component = () => {
  return (
    <UIKitRoot class={styles.root}>
      <MetaProvider>
        <Router>
          <Route component={lazy(() => import("./pages/userSelect/Layout.tsx"))}>
            <Route path={"/"} component={lazy(() => import("./pages/userSelect/login/Login.tsx"))} />
            <Route path={"/signup"} component={lazy(() => import("./pages/userSelect/signup/Signup.tsx"))} />
            <Route path={"/forgot-password"} component={lazy(() => import("./pages/userSelect/forgotPassword/ForgotPassword.tsx"))} />
          </Route>
          <Route component={lazy(() => import("./pages/auth/app/flow.tsx"))} path="auth/app/flow" />
          <Route component={lazy(() => import("./pages/app/AuthCheck.tsx"))}>
            <Route component={lazy(() => import("./pages/app/Layout.tsx"))}>
              <Route path={"app"}>
                <Route path={"/"} component={AppIndex} />
                <ApplicationsRouter />
                <Route path={":applicationId"} component={MissingApp} />
              </Route>
              <Route path={"*"} component={lazy(() => import("./pages/notFound/Index.tsx"))} />
            </Route>
          </Route>
          <Route path={"*"} component={lazy(() => import("./pages/notFound/Index.tsx"))} />
        </Router>
      </MetaProvider>
    </UIKitRoot>
  );
};

export default App;
