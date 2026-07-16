import { A, useSearchParams } from "@solidjs/router";
import { type Component, createSignal, onMount } from "solid-js";
import UKDivider from "../../../../../uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "../../../../../uikit-solid/src/components/text/UKText.tsx";
import styles from "./flow.module.scss";

const AuthAppFlowPage: Component = () => {
  const [searchParams] = useSearchParams();
  const [appDisplayName, setAppDisplayName] = createSignal(
    searchParams["app_id"],
  );

  onMount(() => {
    setAppDisplayName("Files");
  });

  return (
    <div class={styles.root}>
      <div class={styles.sidePanel}>
        <UKText role="display" size="l" emphasized>
          Sign in
        </UKText>
        <UKText role="label" size="l">
          To authorize '{appDisplayName()}'
        </UKText>
        <UKText role="label" size="l" class={styles.footer}>
          OnlineWorkspace @ <A href="">next.alys.cloud</A>
        </UKText>
      </div>
      <UKDivider direction="vertical" />
      <div>
        Place Login UI Component Here
      </div>
    </div>
  );
};

export default AuthAppFlowPage;
