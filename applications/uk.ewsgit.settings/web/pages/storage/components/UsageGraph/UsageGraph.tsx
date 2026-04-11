import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./UsageGraph.module.scss";

const UsageGraph: Component = () => {
  const [storageUsage] = createResource(() => trpc.storage.usage.query());

  return (
    <div class={styles.paddingContainer}>
      <UKCard class={styles.root}>
        <div class={styles.bar}>
          <For each={storageUsage()}>
            {(category) => {
              return (
                <div class={styles.barSegment} style={{ width: `${category.percentage * 100}%` }}>
                  <UKText role="label" size="s" class={styles.barLabel}>
                    {category.displayName} {category.size.toFixed(1)}GB
                  </UKText>
                </div>
              );
            }}
          </For>
        </div>
      </UKCard>
    </div>
  );
};

export default UsageGraph;
