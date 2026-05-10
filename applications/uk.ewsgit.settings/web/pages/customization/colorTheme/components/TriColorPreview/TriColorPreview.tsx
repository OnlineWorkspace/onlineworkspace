import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.jsx";
import type { Component } from "solid-js";
import styles from "./TriColorPreview.module.scss";

const TriColorPreview: Component<{ colors: string[]; onClick(): void }> = (props) => {
  return (
    <UKCard color="filled" class={styles.root} onClick={props.onClick}>
      <div class={styles.colorOne} style={{ background: props.colors[0] }}></div>
      <div class={styles.colorTwo} style={{ background: props.colors[1] }}></div>
      <div class={styles.colorThree} style={{ background: props.colors[2] }}></div>
    </UKCard>
  );
};

export default TriColorPreview;
