import UKLinearProgressIndicator from "@onlineworkspace/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";
import styles from "./Quota.module.scss";

const Quota: Component = () => {
  return (
    <div class={styles.root}>
      <UKLinearProgressIndicator start={0} stop={10} value={4} thickness={4} />
      <UKText role={"label"} size={"m"}>
        4 of 10GB Used
      </UKText>
    </div>
  );
};

export default Quota;
