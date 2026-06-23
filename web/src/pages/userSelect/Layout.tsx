import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type { RouteSectionProps } from "@solidjs/router";
import { type Component, Suspense } from "solid-js";
import backend from "../../lib/backend";
import styles from "./Layout.module.scss";

const UserSelectLayout: Component<RouteSectionProps<unknown>> = (props) => {
  return (
    <div class={styles.root}>
      <Suspense fallback={<UKCircularProgressIndicator />}>
        <img class={styles.background} alt="" src={backend("/api/instance/login/background")} />
        <img alt="" class={styles.banner} src={backend("/api/instance/login/banner")} />
        {props.children}
      </Suspense>
      <UKCard color={"outlined"} class={styles.copyrightContainer}>
        <UKText href="https://ewsgit.uk" role={"body"} size={"s"} emphasized={true}>
          Copyright © 2025-2026 Ewsgit
        </UKText>
      </UKCard>
    </div>
  );
};

export default UserSelectLayout;
