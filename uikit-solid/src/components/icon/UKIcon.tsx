import clsx from "clsx";
import type { Component } from "solid-js";
import styles from "./UKIcon.module.scss";

const UKIcon: Component<{ children: string; class?: string; onClick?: () => void }> = (props) => {
  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: icon lmao */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: icon lmao */}
      <div
        onClick={props.onClick}
        data-clickable={!!props.onClick}
        class={clsx(styles.root, props.class)}
        style={{
          "mask-image": `url("${props.children ?? "oops"}")`,
        }}
      />
    </>
  );
};

export default UKIcon;
