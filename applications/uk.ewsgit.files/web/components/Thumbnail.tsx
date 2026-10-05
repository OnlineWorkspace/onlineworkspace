import clsx from "clsx";
import { type Component, createEffect, createSignal, on, Show } from "solid-js";
import { APPLICATION_ID } from "../lib/trpc";
import type { Entry } from "../lib/types";
import FileBadge from "./FileBadge";
import styles from "./Thumbnail.module.scss";

// what the server can make previews of, everything else just keeps its badge
const PREVIEWABLE = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);

export const hasThumbnail = (entry: Pick<Entry, "kind" | "extension">) => entry.kind === "file" && PREVIEWABLE.has(entry.extension.toLowerCase());

export const thumbnailUrl = (entry: Pick<Entry, "path" | "modified">, size: number) =>
  `/api/${APPLICATION_ID}/thumbnail?${new URLSearchParams({ path: entry.path, size: String(size), v: String(entry.modified) })}`;

/**
 * A file's badge that is replaced by a preview of the image once that has loaded.
 * The badge stays underneath, so a slow or failed preview never leaves a gap.
 */
const Thumbnail: Component<{
  entry: Entry;
  size?: "s" | "m" | "l";
  // the largest edge the preview is shown at, in CSS pixels
  pixels: number;
  class?: string;
}> = (props) => {
  const [loaded, setLoaded] = createSignal(false);
  const [failed, setFailed] = createSignal(false);

  // a changed file gets a new url, so it starts over
  createEffect(
    on(
      () => props.entry.modified,
      () => {
        setLoaded(false);
        setFailed(false);
      },
      { defer: true },
    ),
  );

  return (
    <div class={clsx(styles.root, props.class)} data-size={props.size ?? "m"}>
      <FileBadge entry={props.entry} size={props.size} class={styles.badge} />
      <Show when={hasThumbnail(props.entry) && !failed()}>
        <img
          class={styles.image}
          data-loaded={loaded()}
          src={thumbnailUrl(props.entry, Math.ceil(props.pixels * (window.devicePixelRatio || 1)))}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </Show>
    </div>
  );
};

export default Thumbnail;
