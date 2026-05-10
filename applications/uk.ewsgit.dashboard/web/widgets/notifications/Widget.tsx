import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";
import styles from "./Widget.module.scss";

const Widget: Component = () => {
  return (
    <UKCard class={styles.root}>
      <UKText role={"title"} size={"l"}>
        Notifications
      </UKText>
      <UKDivider direction={"horizontal"} />
      <UKText role={"body"} size={"l"}>
        You have no notifications (Unimplemented)
      </UKText>
    </UKCard>
  );
};

export default Widget;
