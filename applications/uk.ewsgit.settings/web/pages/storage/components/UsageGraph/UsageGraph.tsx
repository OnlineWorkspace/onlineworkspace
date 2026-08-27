import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
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
                <div class={styles.barSegment} style={{ width: `${category.percentage * 100}%`, "background-color": category.color }}/>
              );
            }}
          </For>
        </div>

        <For each={storageUsage()}>
          {(category) => {
            return (
              <div>
                <UKText role={"label"} size={"m"}>{category.displayName} - {category.size}MB</UKText>
              </div>
            );
          }}
        </For>
      </UKCard>
    </div>
  );
};

export default UsageGraph;
