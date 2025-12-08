import type { Component } from "solid-js";
import styles from "./UKIcon.module.scss";
import clsx from "clsx";

const UKIcon: Component<{ children: string; class?: string; onClick?: () => void }> = (props) => {
    return (
        <div onClick={props.onClick} data-clickable={!!props.onClick} class={clsx(styles.root, props.class)}>
            {props.children}
        </div>
    );
};

export default UKIcon;
