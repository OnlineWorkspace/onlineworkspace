import { type Component, createEffect, type JSX } from "solid-js";
import { applyTheme } from "../core/design/tokens.ts";
import { baselineTheme } from "../core/design/themes/baseline.ts";
import { createMediaQuery } from "@solid-primitives/media";
import styles from "./Root.module.scss";

const UIKitRoot: Component<{ children?: JSX.Element }> = ({ children }) => {
    const isLightMode = createMediaQuery("(prefers-color-scheme: light)");
    let elem!: HTMLDivElement;

    createEffect(() => {
        if (!elem) return;

        applyTheme(baselineTheme, elem, isLightMode() ? "light" : "dark");
    });

    return (
        <div class={styles.root} ref={elem}>
            <style data-uikit-styles></style>
            {children}
        </div>
    );
};

export default UIKitRoot;
