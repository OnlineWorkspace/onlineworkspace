import UKLinearProgressIndicator from "@onlineworkspace/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createSignal, onCleanup, onMount } from "solid-js";
import styles from "./Quota.module.scss";

const Quota: Component = () => {
  const [used, setUsed] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setUsed((u) => {
        if (u + 1 > 10) {
          return 0;
        } else {
          return u + 1;
        }
      });
    }, 500);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return (
    <div class={styles.root}>
      <UKLinearProgressIndicator start={0} stop={10} value={used()} />
      <UKText role={"label"} size={"m"}>
        {used()} of 10GB Used
      </UKText>
    </div>
  );
};

export default Quota;
