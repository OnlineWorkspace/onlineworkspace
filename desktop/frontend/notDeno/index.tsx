import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type { Component } from "solid-js";
import styles from "./index.module.scss";

const NotDeno: Component = () => {
  return (
    <UKCard color="outlined" class={styles.root}>
      <UKText size="l" role="title">
        Achievement Get!
      </UKText>
      <UKText size="l" role="display" emphasized>
        How did we get here?
      </UKText>
      <UKText size="m" role="body">
        Congratulations, you have opened the frontend for an OnlineWorkspace
        Desktop application in a web browser. (Btw, you shouldn't do this)
      </UKText>
    </UKCard>
  );
};

export default NotDeno;
