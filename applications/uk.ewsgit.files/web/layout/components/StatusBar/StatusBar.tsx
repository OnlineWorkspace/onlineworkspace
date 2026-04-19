import UKLinearProgressIndicator from "@onlineworkspace/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createSignal, onCleanup, onMount } from "solid-js";
import styles from "./StatusBar.module.scss";

const StatusBar: Component = () => {
  const [statusProgression, setStatusProgression] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setStatusProgression((u) => {
        if (u + 10 > 100) {
          return 0;
        } else {
          return u + 10;
        }
      });
    }, 500);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return (
    <div class={styles.root}>
      <UKText role={"label"} size={"m"}>
        29 Folders, 16 Files (256KB)
      </UKText>
      <div class={styles.margin}></div>
      <UKLinearProgressIndicator class={styles.progressBar} start={0} stop={100} value={statusProgression()} />
      <UKText role={"label"} size={"m"}>
        Status Message
      </UKText>
    </div>
  );
};

export default StatusBar;
