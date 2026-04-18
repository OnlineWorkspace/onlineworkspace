import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import UKCircularProgressIndicator from "@onlineworkspace/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import type { RouteSectionProps } from "@solidjs/router";
import { type Component, Suspense } from "solid-js";
import backend from "../../lib/backend";
import styles from "./Layout.module.scss";

const UserSelectLayout: Component<RouteSectionProps<unknown>> = (props) => {
  return (
    <div class={styles.root}>
      <img class={styles.background} alt="" src={backend("/api/instance/login/background")} />
      <img alt="" class={styles.banner} src={backend("/api/instance/login/banner")} />
      <Suspense fallback={<UKCircularProgressIndicator />}>{props.children}</Suspense>
      <UKCard color={"outlined"} class={styles.copyrightContainer}>
        <UKText role={"title"} size={"m"} emphasized={true}>
          Online Workspace Alpha
        </UKText>
        <UKText href="https://ewsgit.uk" role={"body"} size={"s"} emphasized={true}>
          Copyright 2025-2026 Ewsgit
        </UKText>
      </UKCard>
    </div>
  );
};

export default UserSelectLayout;
