import type { Component } from "solid-js";
import styles from "./UKAvatar.module.scss";
import clsx from "clsx";

const UKAvatar: Component<{
    size: "xs" | "s" | "m" | "l" | "xl" | "2xl";
    username: string;
    avatar: string;
    class?: string;
    onClick?: () => void;
}> = (props) => {
    return (
        <img
            onClick={props.onClick}
            draggable={false}
            src={props.avatar}
            class={clsx(styles.root, props.class)}
            alt={`${props.username}'s avatar`}
            data-size={props.size}
        ></img>
    );
};

export default UKAvatar;
