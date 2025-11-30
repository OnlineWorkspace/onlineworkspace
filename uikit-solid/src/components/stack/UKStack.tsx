import { type Component } from "solid-js";
import styles from "./UKStack.module.scss";
import clsx from "clsx";
import type { ParentProps } from "solid-js";

const UKStack: Component<ParentProps<{ class?: string }>> = (props) => {
    return <div class={clsx(styles.root, props.class)}>{props.children}</div>;
};

export default UKStack;
