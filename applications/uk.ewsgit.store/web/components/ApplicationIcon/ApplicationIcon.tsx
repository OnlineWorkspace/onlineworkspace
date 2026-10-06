import type { Component } from "solid-js";
import styles from "./ApplicationIcon.module.scss";

/**
 * An application's icon. Full colour images are shown as they are, while "icon" types (material symbols and the
 * missing icon placeholder) are monochrome artwork, so they are used as a mask and tinted to suit the current theme.
 */
const ApplicationIcon: Component<{ icon?: { type: "icon" | "image"; value: string }; size: "m" | "l" }> = (props) => (
  <div class={styles.root} data-size={props.size}>
    {props.icon?.type === "icon" ? (
      <span class={styles.glyph} style={{ "--icon-url": `url("${props.icon.value}")` }} />
    ) : (
      <img alt="" class={styles.icon} draggable={false} src={props.icon?.value || "/assets/onlineworkspace/online_workspace_logo.svg"} />
    )}
  </div>
);

export default ApplicationIcon;
