import { createMediaQuery } from "@solid-primitives/media";
import clsx from "clsx";
import { type Component, createEffect, type JSX } from "solid-js";
import { baselineTheme } from "../core/design/themes/baseline.ts";
import { applyTheme } from "../core/design/tokens.ts";
import { RootContext } from "../rootContext.ts";
import styles from "./Root.module.scss";

const UIKitRoot: Component<{ children?: JSX.Element; class?: string }> = (props) => {
  const isLightMode = createMediaQuery("(prefers-color-scheme: light)");
  let elem!: HTMLDivElement;

  createEffect(() => {
    if (!elem) return;

    const closestElement = elem.closest("[data-uikit-root]");

    if (!closestElement || closestElement === elem) {
      if (!document.head.querySelector("[data-uikit-root-styles]")) {
        const styleElement = document.createElement("style");
        styleElement.setAttribute("data-uikit-root-styles", "true");
        styleElement.innerHTML = `:root {
  background-color: ${baselineTheme.sys.color[isLightMode() ? "lightMode" : "darkMode"].background};
}`;
        document.head.appendChild(styleElement);
      }
    }

    applyTheme(baselineTheme, elem, isLightMode() ? "light" : "dark");
  });

  return (
    <div class={clsx(styles.root, props.class)} ref={elem} data-uikit-root={true}>
      <style data-uikit-styles></style>
      <RootContext.Provider
        value={{
          root: elem,
        }}
      >
        {props.children}
      </RootContext.Provider>
    </div>
  );
};

export default UIKitRoot;
