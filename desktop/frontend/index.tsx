/* @refresh reload */
import { lazy, type Component, type ParentProps } from "solid-js";
import { render } from "solid-js/web";
import "./index.scss";
import { UIKitRoot } from "@ewsgit/uikit-solid/src/index.tsx";
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import styles from "./index.module.scss";
import Redirect from "./redirect.tsx";

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

export default function createApp(appId: string, Comp: Component) {
  const root = document.getElementById("root");

  render(
    () => (
      <OWApplication>
        <Route path="ow_desktop_integration">
          <Route path="auth">
            <Route path="flow" component={lazy(() => import("./auth/flow/index.tsx"))} />
          </Route>
        </Route>
        <Route path={`/app/${appId}`}>
          <Comp />
        </Route>
        <Route path={"/"} component={() => <Redirect to={`/app/${appId}`}/>}/>
      </OWApplication>
    ),
    root!,
  );
}
