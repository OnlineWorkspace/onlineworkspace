import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import type { Component } from "solid-js";
import styles from "./ApplicationIcon.module.scss";

/** An application's icon, which is either an image or a material symbol. */
const ApplicationIcon: Component<{ icon?: { type: "icon" | "image"; value: string }; size: "m" | "l" }> = (props) => (
  <div class={styles.root} data-size={props.size}>
    {props.icon?.type === "icon" ? (
      <UKIcon class={styles.icon}>{props.icon.value}</UKIcon>
    ) : (
      <img alt="" class={styles.icon} draggable={false} src={props.icon?.value || "/assets/onlineworkspace/online_workspace_logo.svg"} />
    )}
  </div>
);

export default ApplicationIcon;
