import { type Component, type ParentProps } from "solid-js";
import type { WidgetSize } from "./widgets";
import styles from "./WidgetFrame.module.scss";

/**
 * Places a widget in the dashboard grid at its size. The dashboard and its editor both use this, so a widget occupies exactly the
 * same cells in each. The widget fills the frame.
 */
const WidgetFrame: Component<ParentProps<{ size: WidgetSize; class?: string }>> = (props) => (
  <div class={`${styles.frame} ${props.class ?? ""}`} style={{ "--cols": props.size.cols, "--rows": props.size.rows }}>
    {props.children}
  </div>
);

export default WidgetFrame;
