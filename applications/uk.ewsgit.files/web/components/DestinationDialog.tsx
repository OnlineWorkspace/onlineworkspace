import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKListItem from "@ewsgit/uikit-solid/src/components/list/UKListItem.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createResource, createSignal, For, Show } from "solid-js";
import { parentOf } from "../lib/routes";
import trpc from "../lib/trpc";
import type { Entry } from "../lib/types";
import styles from "./DestinationDialog.module.scss";

/** Lets the user walk the folder tree and pick where moved / copied items should go. */
const DestinationDialogContent: Component<{
  mode: "move" | "copy";
  entries: Entry[];
  onCancel: () => void;
  onConfirm: (destination: string) => void;
}> = (props) => {
  const [directory, setDirectory] = createSignal(parentOf(props.entries[0]?.path ?? "/"));
  const [listing] = createResource(directory, (path) => trpc.list.query({ path }).catch(() => undefined));

  const movingPaths = () => props.entries.map((entry) => entry.path);
  // a folder can't be put inside of itself, so its subtree is not offered
  const folders = () => listing.latest?.entries.filter((entry) => entry.kind === "directory" && !movingPaths().includes(entry.path)) ?? [];
  const label = () => (props.entries.length === 1 ? `"${props.entries[0]!.name}"` : `${props.entries.length} items`);

  return (
    <div class={styles.root}>
      <UKText role="title" size="l">
        {props.mode === "move" ? "Move" : "Copy"} {label()} to…
      </UKText>
      <div class={styles.location}>
        <UKIconButton
          color="standard"
          icon={ARROW_BACK_ICON}
          alt="Up one folder"
          disabled={directory() === "/"}
          onClick={() => setDirectory(parentOf(directory()))}
        />
        <UKText role="label" size="l" class={styles.locationLabel}>
          {directory() === "/" ? "Home" : directory()}
        </UKText>
      </div>
      <UKDivider direction="horizontal" />
      <div class={styles.folders}>
        <Show when={!listing.loading} fallback={<UKCircularProgressIndicator class={styles.spinner} />}>
          <For each={folders()} fallback={<UKText role="body" size="m" class={styles.empty}>No folders here</UKText>}>
            {(folder) => (
              <UKListItem
                labelText={folder.name}
                supportingText={`${folder.itemCount ?? 0} items`}
                leading={{ type: "icon", value: FOLDER_ICON }}
                lines={2}
                onClick={() => setDirectory(folder.path)}
              />
            )}
          </For>
        </Show>
      </div>
      <UKDivider direction="horizontal" />
      <div class={styles.buttons}>
        <UKButton color="standard" onClick={props.onCancel}>
          Cancel
        </UKButton>
        <UKButton color="filled" disabled={listing.loading} onClick={() => props.onConfirm(directory())}>
          {props.mode === "move" ? "Move here" : "Copy here"}
        </UKButton>
      </div>
    </div>
  );
};

export default DestinationDialogContent;
