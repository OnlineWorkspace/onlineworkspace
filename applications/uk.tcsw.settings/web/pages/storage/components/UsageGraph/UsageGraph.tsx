import { createResource, For, type Component } from "solid-js";
import styles from "./UsageGraph.module.scss";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import trpc from "../../../../lib/trpc";

const UsageGraph: Component = () => {
    const [storageUsage] = createResource(() => trpc.storage.usage.query());

    return (
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
            <UKText role="label" size="m">
                Storage Usage Visualisation
            </UKText>
        </UKCard>
    );
};

export default UsageGraph;
