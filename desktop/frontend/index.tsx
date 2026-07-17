/* @refresh reload */
import type { Component, ParentProps } from "solid-js";
import { render } from "solid-js/web";
import "./index.scss";
import { UIKitRoot } from "@ewsgit/uikit-solid/src/index.tsx";
import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import styles from "./index.module.scss";

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

export default function createApp(Comp: Component) {
  const root = document.getElementById("root");

  render(
    () => (
      <OWApplication>
        <Comp />
      </OWApplication>
    ),
    root!,
  );
}
