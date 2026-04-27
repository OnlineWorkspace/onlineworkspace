import UKLinearProgressIndicator from "@onlineworkspace/uikit-solid/src/components/linearProgressIndicator/UKLinearProgressIndicator.tsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import {type Component, createSignal, onCleanup, onMount} from "solid-js";
import styles from "./Quota.module.scss";
import filesystemInterface from "../../../lib/filesystemInterface";
import humanReadableSize from "../../../lib/humanReadableSize";

const Quota: Component = () => {
  const [ used, setUsed ] = createSignal(0);
  const [ maxUsed, setMaxUsed ] = createSignal(0);

  onMount(async () => {
    const quota = await filesystemInterface.getQuota("remote")

    setUsed(quota.currentUsage)
    setMaxUsed(quota.maximum)
  });

  return (
    <div class={styles.root}>
      <UKLinearProgressIndicator class={styles.linearProgressIndicator} start={0} stop={maxUsed()} value={used()} />
      <UKText role={"label"} size={"m"}>
        {humanReadableSize(used())} of {humanReadableSize(maxUsed())} Used
      </UKText>
    </div>
  );
};

export default Quota;
