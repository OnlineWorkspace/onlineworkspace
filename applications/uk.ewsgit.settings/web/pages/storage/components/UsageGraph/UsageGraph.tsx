import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import {type Component, createResource, For} from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./UsageGraph.module.scss";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.js";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.js";

const UsageGraph: Component = () => {
  const [storageUsage] = createResource(() => trpc.storage.usage.query());

  return (
    <>
      <UKStackLabel>Storage Quota Usage</UKStackLabel>
      <div class={styles.paddingContainer}>
        <div class={styles.bar}>
          <For each={storageUsage()}>
            {(category) => {
              return (
                <div class={styles.barSegment} style={{width: `${category.percentage * 100}%`, "background-color": category.color}}/>
              );
            }}
          </For>
        </div>
        <div>
          <UKText role={"label"} size={"l"}>
            {storageUsage()?.reduce((acc, curr) => acc + curr.size, 0)}MB / {storageUsage()?.reduce((acc, curr) => acc + curr.size, 0)}MB
          </UKText>
        </div>
      </div>
      <UKStackLabel>Usage By File Types</UKStackLabel>
      <div class={styles.paddingContainer}>
        <For each={storageUsage()}>
          {(category) => {
            return (
              <div class={styles.barLabel}>
                <div class={styles.barLabelColorIndicator} style={{"background-color": category.color}}></div>
                <UKText role={"label"} size={"m"}>{category.displayName} - {category.size}MB</UKText>
              </div>
            );
          }}
        </For>
      </div>
      <UKDivider class={styles.divider} direction={"horizontal"}/>
    </>
  )
    ;
};

export default UsageGraph;
