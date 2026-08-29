import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import type {RouteSectionProps} from "@solidjs/router";
import {type Component, createResource, Show, Suspense} from "solid-js";
import backend from "../../lib/backend";
import styles from "./Layout.module.scss";
import UserSelectContext from "./userSelectContext.ts";
import trpc from "../../lib/trpc.ts";

const UserSelectLayout: Component<RouteSectionProps<unknown>> = (props) => {
  const [options] = createResource(() => trpc.userSelect.getOptions.query())

  return (
    <UserSelectContext.Provider value={options()!}>
      <div class={styles.root}>
        <Suspense fallback={<UKCircularProgressIndicator/>}>
          <Show when={options()?.showBackground}>
            <img class={styles.background} alt="" src={backend("/api/instance/login/background")}/>
          </Show>
          <Show when={options()?.showBanner}>
            <img class={styles.banner} alt="" src={backend("/api/instance/login/banner")}/>
          </Show>
          {props.children}
        </Suspense>
        <UKCard color={"outlined"} class={styles.copyrightAndTaglineContainer}>
          <UKText role={"body"} size={"m"}>
            {options()?.tagline}
          </UKText>
          <UKText href="https://ewsgit.uk" role={"body"} size={"s"} emphasized={true}>
            Copyright © 2025-2026 Ewsgit
          </UKText>
        </UKCard>
      </div>
    </UserSelectContext.Provider>
  );
};

export default UserSelectLayout;
