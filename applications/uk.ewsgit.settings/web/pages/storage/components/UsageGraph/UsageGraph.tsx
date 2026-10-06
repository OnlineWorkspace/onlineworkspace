import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createResource, For, Show } from "solid-js";
import NoticeMessage from "../../../../components/noticeMessage/NoticeMessage.js";
import trpc from "../../../../lib/trpc";
import { formatSize } from "../../formatSize";
import styles from "./UsageGraph.module.scss";

const UsageGraph: Component = () => {
  const [usage] = createResource(() => trpc.storage.usage.query());

  // the backend's percentages don't account for the quota unit, so they are worked out here from the sizes
  const categories = () => [...(usage()?.categories ?? [])].sort((a, b) => b.size - a.size);
  const used = () => categories().reduce((total, category) => total + category.size, 0);
  const quota = () => usage()?.quota || 1;
  const usedFraction = () => Math.min(used() / quota(), 1);
  const nearlyFull = () => used() > quota() - 1024 || usedFraction() > 0.9;

  return (
    <>
      <Show when={usage() && nearlyFull()}>
        <NoticeMessage
          title={"Quota nearly full"}
          body={"You have nearly used all of your allocated quota. If you would like more, you can send a request to the server's administrator."}
          actions={[
            {
              label: "Request increased quota",
              cb() {
                alert("Implement me later");
              },
            },
          ]}
        />
      </Show>
      <UKCard class={styles.root}>
        <div class={styles.summary}>
          <UKText role="display" size="s" emphasized align="start" class={styles.used}>
            {formatSize(used())}
          </UKText>
          <UKText role="body" size="l" align="start" class={styles.quota}>
            used of {formatSize(quota())} ({Math.round(usedFraction() * 100)}%)
          </UKText>
        </div>
        <div class={styles.bar} role="img" aria-label={`${formatSize(used())} of ${formatSize(quota())} used`}>
          <For each={categories()}>
            {(category) => <div class={styles.segment} style={{ width: `${(category.size / quota()) * 100}%`, "background-color": category.color }} title={category.displayName} />}
          </For>
        </div>
        <Show when={categories().length > 0} fallback={<UKText role="body" size="m" align="start" class={styles.quota}>No files stored yet.</UKText>}>
          <ul class={styles.list}>
            <For each={categories()}>
              {(category) => (
                <li class={styles.row}>
                  <span class={styles.dot} style={{ "background-color": category.color }} />
                  <UKText role="body" size="l" align="start" class={styles.name}>
                    {category.displayName}
                  </UKText>
                  <UKText role="label" size="l" class={styles.size}>
                    {formatSize(category.size)}
                  </UKText>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </UKCard>
    </>
  );
};

export default UsageGraph;
