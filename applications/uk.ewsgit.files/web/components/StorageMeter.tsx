import { type Component, createResource, For } from "solid-js";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import clsx from "clsx";
import { useFiles } from "../lib/context";
import { formatBytes } from "../lib/format";
import trpc from "../lib/trpc";
import styles from "./StorageMeter.module.scss";

const SEGMENTS = [
  { key: "images", label: "Images" },
  { key: "videos", label: "Videos" },
  { key: "documents", label: "Documents" },
  { key: "other", label: "Other" },
] as const;

/** Segmented usage bar. `compact` is the slim sidebar version, otherwise the large home-page card with a legend. */
const StorageMeter: Component<{ compact?: boolean; class?: string; action?: { label: string; onClick: () => void } }> = (props) => {
  const files = useFiles();
  const [storage] = createResource(files.version, () => trpc.storage.query().catch(() => undefined));

  const percent = (bytes: number) => {
    const total = storage.latest?.total ?? 0;
    return total > 0 ? Math.min((bytes / total) * 100, 100) : 0;
  };

  return (
    <div class={clsx(styles.root, props.class)} data-compact={!!props.compact}>
      <div class={styles.header}>
        <UKText role="label" size="l" class={styles.title}>
          This device
        </UKText>
        {props.action ? (
          <button type="button" class={styles.action} onClick={props.action.onClick}>
            {props.action.label}
          </button>
        ) : null}
      </div>
      {props.compact ? null : (
        <div class={styles.headline}>
          <span class={styles.used}>{formatBytes(storage.latest?.used ?? 0)}</span>
          <span class={styles.total}>of {formatBytes(storage.latest?.total ?? 0)} used</span>
        </div>
      )}
      <div class={styles.bar} role="img" aria-label={`${formatBytes(storage.latest?.used ?? 0)} of ${formatBytes(storage.latest?.total ?? 0)} used`}>
        <For each={SEGMENTS}>{(segment) => <div class={styles.segment} data-segment={segment.key} style={{ width: `${percent(storage.latest?.[segment.key] ?? 0)}%` }} />}</For>
      </div>
      {props.compact ? (
        <UKText role="body" size="s" class={styles.caption}>
          {formatBytes(storage.latest?.used ?? 0)} of {formatBytes(storage.latest?.total ?? 0)} used
        </UKText>
      ) : (
        <div class={styles.legend}>
          <For each={SEGMENTS}>
            {(segment) => (
              <div class={styles.legendItem}>
                <span class={styles.dot} data-segment={segment.key} />
                <UKText role="label" size="m">
                  {segment.label}
                </UKText>
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  );
};

export default StorageMeter;
