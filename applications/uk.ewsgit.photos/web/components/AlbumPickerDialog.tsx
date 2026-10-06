import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import STACKS_ICON from "@material-symbols/svg-700/outlined/stacks.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKListItem from "@ewsgit/uikit-solid/src/components/list/UKListItem.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For, Show } from "solid-js";
import { pluralise } from "../lib/format";
import { thumbnailSize, thumbnailUrl } from "../lib/media";
import trpc from "../lib/trpc";
import type { AlbumSummary } from "../lib/types";
import { createQuery } from "../lib/useQuery";
import styles from "./AlbumPickerDialog.module.scss";

/** The content of the "Add to album" dialog. */
const AlbumPickerDialog: Component<{ onPick: (album: AlbumSummary) => void; onNewAlbum: () => void; onCancel: () => void }> = (props) => {
  const albums = createQuery(
    () => true,
    () => trpc.albums.list.query(),
  );

  return (
    <div class={styles.root}>
      <UKText role="title" size="l">
        Add to album
      </UKText>

      <div class={styles.list}>
        <UKListItem labelText="New album" supportingText="Create an album with these photos" leading={{ type: "icon", value: ADD_ICON }} lines={2} onClick={props.onNewAlbum} />

        <For each={albums.data()?.albums ?? []}>
          {(album) => (
            <UKListItem
              labelText={album.name}
              supportingText={pluralise(album.count, "item")}
              leading={album.cover ? { type: "image", value: thumbnailUrl(album.cover.id, album.cover.version, thumbnailSize(56)) } : { type: "icon", value: STACKS_ICON }}
              lines={2}
              onClick={() => props.onPick(album)}
            />
          )}
        </For>

        <Show when={albums.error()}>
          <UKText role="body" size="m" class={styles.error}>
            {albums.error()}
          </UKText>
        </Show>
      </div>

      <div class={styles.buttons}>
        <UKButton color="standard" onClick={props.onCancel}>
          Cancel
        </UKButton>
      </div>
    </div>
  );
};

export default AlbumPickerDialog;
