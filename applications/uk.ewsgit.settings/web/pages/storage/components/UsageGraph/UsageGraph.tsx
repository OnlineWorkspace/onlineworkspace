import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import {type Component, createResource, For, Show} from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./UsageGraph.module.scss";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.js";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.js";
import clsx from "clsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.js";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.js";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.js";
import NoticeMessage from "../../../../components/noticeMessage/NoticeMessage.js";

const UsageGraph: Component = () => {
  const [storageUsage] = createResource(() => trpc.storage.usage.query());

  return (
    <>
      <UKStackLabel>Storage Quota Usage</UKStackLabel>
      <div class={styles.paddingContainer}>
        <div class={styles.bar}>
          <For each={storageUsage()?.categories}>
            {(category) => {
              return (
                <div class={styles.barSegment} style={{width: `${category.percentage * 100}%`, "min-width": "2px", "background-color": category.color}}/>
              );
            }}
          </For>
        </div>
        <div>
          <UKText role={"label"} size={"l"}>
            {storageUsage()?.categories.reduce((acc, curr) => acc + curr.size, 0)}MB / {storageUsage()?.quotaString}
          </UKText>
        </div>
      </div>
      <UKStackLabel>Usage By File Types</UKStackLabel>
      <div class={clsx(styles.paddingContainer, styles.labelContainer)}>
        <For each={storageUsage()?.categories}>
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
      <Show when={(storageUsage()?.categories.reduce((acc, curr) => acc + curr.size, 0) || 0) > ((storageUsage()?.quota || 0) - 1_048_576)}>
        <NoticeMessage title={"Quota Nearly Full"}
                       body={"You have nearly used all of your allocated quota, if you would like to request more, press the button below to send a request to the server's administrator for a quota increase."}
                       actions={[
                         {
                           label: "Request Increased Quota",
                           cb() {
                             alert("Implement me later")
                           }
                         }
                       ]}/>
      </Show>
    </>
  )
    ;
};

export default UsageGraph;
