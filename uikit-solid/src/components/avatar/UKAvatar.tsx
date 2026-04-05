import clsx from "clsx";
import type { Component } from "solid-js";
import styles from "./UKAvatar.module.scss";

const UKAvatar: Component<{
  size: "xs" | "s" | "m" | "l" | "xl" | "2xl";
  username: string;
  avatar: string;
  class?: string;
  onClick?: (e: MouseEvent) => void;
}> = (props) => {
  return (
    <button class={styles.root} type="button" onClick={props.onClick}>
      <img draggable={false} src={props.avatar} class={clsx(styles.image, props.class)} alt={`${props.username}'s avatar`} data-size={props.size}></img>
    </button>
  );
};

export default UKAvatar;
