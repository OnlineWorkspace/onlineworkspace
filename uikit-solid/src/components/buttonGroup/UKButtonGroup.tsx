import clsx from "clsx";
import type { Component, JSX } from "solid-js";
import type { ButtonSize } from "../button/lib/size.ts";
import styles from "./UKButtonGroup.module.scss";

// FIXME: this is not correctly implemented according to the MV3 Spec

const UKButtonGroup: Component<{
  children: JSX.Element;
  size: ButtonSize;
  connected?: boolean;
  align?: "start" | "end";
  class?: string;
}> = (props) => {
  return (
    <div data-size={props.size} data-connected={props.connected} class={clsx(styles.root, props.class)} data-align={props.align}>
      {props.children}
    </div>
  );
};

export default UKButtonGroup;
