import { type Component, createEffect, type JSX } from "solid-js";
import { applyTheme } from "../core/design/tokens.ts";
import { baselineTheme } from "../core/design/themes/baseline.ts";
import { createMediaQuery } from "@solid-primitives/media";
import styles from "./Root.module.scss";
import clsx from "clsx";

const UIKitRoot: Component<{ children?: JSX.Element, class?: string }> = (props) => {
    const isLightMode = createMediaQuery("(prefers-color-scheme: light)");
    let elem!: HTMLDivElement;

    createEffect(() => {
        if (!elem) return;

        applyTheme(baselineTheme, elem, isLightMode() ? "light" : "dark");
    });

    return (
        <div class={clsx(styles.root, props.class)} ref={elem}>
            <style data-uikit-styles></style>
            {props.children}
        </div>
    );
};

export default UIKitRoot;
