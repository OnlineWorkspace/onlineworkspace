import UKLinearProgressIndicator from "@ewsgit/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import clsx from "clsx";
import { type Component, createSignal, onMount } from "solid-js";
import filesystemInterface from "../../../lib/filesystemInterface";
import humanReadableSize from "../../../lib/humanReadableSize";
import styles from "./Quota.module.scss";

const Quota: Component = () => {
  const [used, setUsed] = createSignal(0);
  const [maxUsed, setMaxUsed] = createSignal(0);

  onMount(async () => {
    const quota = await filesystemInterface.getQuota("remote");

    setUsed(quota.currentUsage);
    setMaxUsed(quota.maximum);
  });

  return (
    <div class={styles.root}>
      <UKLinearProgressIndicator
        class={clsx(styles.linearProgressIndicator, maxUsed() - used() < maxUsed() / 4 && styles.lowOnQuota)}
        start={0}
        stop={maxUsed()}
        value={used()}
      />
      <UKText role={"label"} size={"m"}>
        {humanReadableSize(used())} of {humanReadableSize(maxUsed())} Used
      </UKText>
    </div>
  );
};

export default Quota;
