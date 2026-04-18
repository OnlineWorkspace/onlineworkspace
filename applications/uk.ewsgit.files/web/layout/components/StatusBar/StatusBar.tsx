import UKLinearProgressIndicator from "@onlineworkspace/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";
import styles from "./StatusBar.module.scss";

const StatusBar: Component = () => {
  return (
    <div class={styles.root}>
      <UKText role={"label"} size={"m"}>
        29 Folders, 16 Files (256KB)
      </UKText>
      <div class={styles.margin}></div>
      <UKLinearProgressIndicator class={styles.progressBar} start={0} stop={100} value={37} />
      <UKText role={"label"} size={"m"}>
        Status Message
      </UKText>
    </div>
  );
};

export default StatusBar;
