import type { Component } from "solid-js";
import { DividerDirection } from "./lib/direction.ts";
import styles from "./UKDivider.module.scss";
import clsx from "clsx";

const UKDivider: Component<{
    direction: "horizontal" | "vertical" | DividerDirection;
    width?: "inset" | "middle-inset" | "full";
    class?: string;
}> = (props) => {
    if (props.width === "inset" && props.direction === DividerDirection.Vertical) {
        console.warn("A divider cannot be both vertical and inset");
    }

    return (
        <div
            data-direction={props.direction || DividerDirection.horizontal}
            data-width={props.width || "full"}
            class={clsx(styles.root, props.class)}
        />
    );
};

export default UKDivider;
