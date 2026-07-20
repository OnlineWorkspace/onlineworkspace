/* @refresh reload */
import { type Component, lazy, type ParentProps } from "solid-js";
import { render } from "solid-js/web";
import "./index.scss";
import { UIKitRoot } from "@ewsgit/uikit-solid/src/index.tsx";
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import styles from "./index.module.scss";
import Redirect from "./redirect.tsx";
import {
  type AppConfiguration,
  CORE_BINDING_PREFIX,
  CoreBindingEndpoints,
} from "../desktop/index.ts";

// import "solid-devtools";

const OWApplication: Component<ParentProps> = (props) => {
  return (
    <UIKitRoot class={styles.root}>
      <MetaProvider>
        <Router>{props.children}</Router>
      </MetaProvider>
    </UIKitRoot>
  );
};

export default async function createApp(appId: string, Comp: Component) {
  let appConfiguration: AppConfiguration | undefined;

  // @ts-ignore
  if ("bindings" in window) {
    // @ts-ignore
    appConfiguration = await bindings
      [`${CORE_BINDING_PREFIX}${CoreBindingEndpoints.GetConfiguration}`]();
  } else {
    if (window.location.pathname !== "/ow_desktop_integration/not-deno")
    window.location.replace(`${window.location.protocol}//${window.location.host}/ow_desktop_integration/not-deno`)
  }
  const root = document.getElementById("root");

  render(
    () => (
      <OWApplication>
        <Route path="ow_desktop_integration">
          <Route
            path="not-deno"
            component={lazy(() => import("./notDeno/index.tsx"))}
          />
          {appConfiguration?.handleAuthentication && (
            <Route path="auth">
              <Route
                path="flow"
                component={lazy(() => import("./auth/flow/index.tsx"))}
              />
            </Route>
          )}
        </Route>
        <Route path={`/app/${appId}`}>
          <Comp />
        </Route>
        <Route path={"/"} component={() => <Redirect to={`/app/${appId}`} />} />
      </OWApplication>
    ),
    root!,
  );
}
