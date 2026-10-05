import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import DRIVE_FILE_MOVE_ICON from "@material-symbols/svg-700/outlined/drive_file_move.svg";
import SHARE_ICON from "@material-symbols/svg-700/outlined/share.svg";
import STAR_ICON from "@material-symbols/svg-700/outlined/star.svg";
import STAR_FILL_ICON from "@material-symbols/svg-700/outlined/star-fill.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createResource, For, Show, Suspense } from "solid-js";
import { useFiles } from "../lib/context";
import { formatBytes, formatDate, formatModified, pluralise } from "../lib/format";
import trpc from "../lib/trpc";
import type { Entry } from "../lib/types";
import FileBadge from "./FileBadge";
import styles from "./DetailsPane.module.scss";

const parentLabel = (path: string) => {
  const segments = path.split("/").filter(Boolean).slice(0, -1);
  return segments.length === 0 ? "Home" : segments.join(" / ");
};

const SingleDetails: Component<{ entry: Entry }> = (props) => {
  const { actions } = useFiles();
  const [previewUrl] = createResource(
    () => (props.entry.category === "image" ? props.entry.path : undefined),
    (path) => trpc.fileUrl.query({ path }).catch(() => undefined),
  );

  const rows = () => [
    { label: props.entry.kind === "directory" ? "Contains" : "Size", value: props.entry.kind === "directory" ? pluralise(props.entry.itemCount ?? 0, "item") : formatBytes(props.entry.size) },
    { label: "Modified", value: formatModified(props.entry.modified, true) },
    { label: "Created", value: formatDate(props.entry.created) },
    { label: "Location", value: parentLabel(props.entry.path) },
  ];

  return (
    <>
      <div class={styles.preview} data-category={props.entry.category}>
        <Suspense fallback={<FileBadge class={styles.previewBadge} entry={props.entry} size="l" />}>
          <Show when={previewUrl.latest} fallback={<FileBadge class={styles.previewBadge} entry={props.entry} size="l" />}>
            {(url) => <img src={url()} alt={props.entry.name} class={styles.previewImage} />}
          </Show>
        </Suspense>
      </div>
      <div class={styles.heading}>
        <UKText role="headline" size="s" class={styles.name}>
          {props.entry.name}
        </UKText>
        <UKText role="body" size="m" class={styles.type}>
          {props.entry.typeLabel}
        </UKText>
      </div>
      <div class={styles.actions}>
        <UKButton color="filled" onClick={() => actions.open(props.entry)}>
          Open
        </UKButton>
        <Show when={props.entry.kind === "file"}>
          <UKButton color="tonal" leadingIcon={SHARE_ICON} onClick={() => actions.share(props.entry)}>
            Share
          </UKButton>
          <UKIconButton color="tonal" icon={DOWNLOAD_ICON} alt="Download" onClick={() => actions.download(props.entry)} />
        </Show>
        <UKIconButton
          color="tonal"
          icon={props.entry.starred ? STAR_FILL_ICON : STAR_ICON}
          alt={props.entry.starred ? "Remove star" : "Add star"}
          onClick={() => actions.setStarred([props.entry], !props.entry.starred)}
        />
      </div>
      <dl class={styles.metadata}>
        <For each={rows()}>
          {(row) => (
            <>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </>
          )}
        </For>
      </dl>
    </>
  );
};

const MultipleDetails: Component<{ entries: Entry[] }> = (props) => {
  const { actions } = useFiles();
  const totalSize = () => props.entries.reduce((sum, entry) => sum + entry.size, 0);
  const allStarred = () => props.entries.every((entry) => entry.starred);

  return (
    <>
      <div class={styles.heading}>
        <UKText role="headline" size="s" class={styles.name}>
          {pluralise(props.entries.length, "item")} selected
        </UKText>
        <UKText role="body" size="m" class={styles.type}>
          {formatBytes(totalSize())} in total
        </UKText>
      </div>
      <div class={styles.actions}>
        <UKButton color="tonal" leadingIcon={CONTENT_COPY_ICON} onClick={() => actions.moveOrCopy(props.entries, "copy")}>
          Copy
        </UKButton>
        <UKButton color="tonal" leadingIcon={DRIVE_FILE_MOVE_ICON} onClick={() => actions.moveOrCopy(props.entries, "move")}>
          Move
        </UKButton>
        <UKIconButton color="tonal" icon={allStarred() ? STAR_FILL_ICON : STAR_ICON} alt={allStarred() ? "Remove star" : "Add star"} onClick={() => actions.setStarred(props.entries, !allStarred())} />
        <UKIconButton color="tonal" icon={DELETE_ICON} alt="Delete" onClick={() => actions.trash(props.entries)} />
      </div>
    </>
  );
};

/** The right-hand pane on desktop: a preview and the facts for the selected item(s). */
const DetailsPane: Component<{ entries: Entry[] }> = (props) => {
  return (
    <aside class={styles.root} aria-label="Details">
      <Show when={props.entries.length === 1 ? props.entries[0] : undefined} fallback={<MultipleDetails entries={props.entries} />} keyed>
        {(entry) => <SingleDetails entry={entry} />}
      </Show>
    </aside>
  );
};

export default DetailsPane;
