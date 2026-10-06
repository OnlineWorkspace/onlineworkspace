import ARCHIVE_ICON from "@material-symbols/svg-700/outlined/archive.svg";
import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DELETE_FOREVER_ICON from "@material-symbols/svg-700/outlined/delete_forever.svg";
import IMAGE_ICON from "@material-symbols/svg-700/outlined/image.svg";
import PHOTO_ALBUM_ICON from "@material-symbols/svg-700/outlined/photo_album.svg";
import RESTORE_FROM_TRASH_ICON from "@material-symbols/svg-700/outlined/restore_from_trash.svg";
import PLAYLIST_REMOVE_ICON from "@material-symbols/svg-700/outlined/playlist_remove.svg";
import STAR_ICON from "@material-symbols/svg-700/outlined/star.svg";
import STAR_FILL_ICON from "@material-symbols/svg-700/outlined/star-fill.svg";
import UNARCHIVE_ICON from "@material-symbols/svg-700/outlined/unarchive.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createEffect, createMemo, type JSX, on, onCleanup, Show } from "solid-js";
import { type PhotosContextValue, usePhotos } from "../lib/context";
import type { Selection } from "../lib/selection";
import type { MediaItem } from "../lib/types";
import { useViewer } from "../lib/viewer";
import EmptyState from "./EmptyState";
import MediaGrid from "./MediaGrid";
import type { SelectionAction } from "./SelectionBar";
import styles from "./MediaCollection.module.scss";

/** What picking photos on a page offers, which depends on what the page lists. */
export function selectionActions(options: {
  photos: PhotosContextValue;
  selection: Selection;
  items: MediaItem[];
  kind: "library" | "archive" | "trash" | "album";
  albumId?: number;
}): SelectionAction[] {
  const { photos, selection } = options;
  const ids = () => selection.ids();
  const done = () => selection.clear();

  if (options.kind === "trash") {
    return [
      { icon: RESTORE_FROM_TRASH_ICON, label: "Restore", onClick: () => void photos.actions.restore(ids()).then(done) },
      { icon: DELETE_FOREVER_ICON, label: "Delete forever", onClick: () => { photos.actions.deletePermanently(ids()); done(); } },
    ];
  }

  const favorites = new Set(options.items.filter((item) => item.favorite).map((item) => item.id));
  const allFavorite = ids().length > 0 && ids().every((id) => favorites.has(id));

  return [
    { icon: PHOTO_ALBUM_ICON, label: "Add to album", onClick: () => { photos.actions.addToAlbum(ids()); done(); } },
    { icon: allFavorite ? STAR_FILL_ICON : STAR_ICON, label: allFavorite ? "Remove from favorites" : "Add to favorites", onClick: () => void photos.actions.setFavorite(ids(), !allFavorite).then(done) },
    ...(options.kind === "album" && options.albumId !== undefined
      ? [{ icon: PLAYLIST_REMOVE_ICON, label: "Remove from album", onClick: () => void photos.actions.removeFromAlbum(options.albumId!, ids()).then(done) }]
      : []),
    ...(options.kind === "album" && options.albumId !== undefined && ids().length === 1
      ? [{ icon: IMAGE_ICON, label: "Set as album cover", onClick: () => void photos.actions.setAlbumCover(options.albumId!, ids()[0]!).then(done) }]
      : []),
    { icon: options.kind === "archive" ? UNARCHIVE_ICON : ARCHIVE_ICON, label: options.kind === "archive" ? "Unarchive" : "Archive", onClick: () => void photos.actions.setArchived(ids(), options.kind !== "archive").then(done) },
    { icon: DELETE_ICON, label: "Move to trash", onClick: () => void photos.actions.trash(ids()).then(done) },
  ];
}

/**
 * A grid of photos with its loading, error and empty states. It also tells the viewer which photos are on screen,
 * so that the viewer can move between them.
 */
const MediaCollection: Component<{
  items: MediaItem[] | undefined;
  loading: boolean;
  error?: string;
  selection: Selection;
  density?: "comfortable" | "compact";
  scrubber?: boolean;
  empty: { icon: string; title: string; body?: string; action?: JSX.Element };
  class?: string;
}> = (props) => {
  const photos = usePhotos();
  const viewer = useViewer();
  const owner = Symbol("collection");

  const items = createMemo(() => props.items ?? []);

  createEffect(() => photos.setViewerItems(owner, items()));
  onCleanup(() => photos.clearViewerItems(owner));

  // what was picked must not outlive the photos it points at (moved to trash, say)
  createEffect(
    on(items, (current) => {
      const present = new Set(current.map((item) => item.id));
      const stale = props.selection.ids().filter((id) => !present.has(id));

      if (stale.length > 0) props.selection.set(props.selection.ids().filter((id) => present.has(id)));
    }),
  );

  return (
    <Show
      when={!props.loading}
      fallback={
        <div class={styles.centered}>
          <UKCircularProgressIndicator />
        </div>
      }
    >
      <Show
        when={props.error === undefined || items().length > 0}
        fallback={
          <EmptyState icon={ERROR_ICON} title="Could not load your photos" body={props.error}>
            <UKButton color="tonal" onClick={photos.refresh}>
              Try again
            </UKButton>
          </EmptyState>
        }
      >
        <Show
          when={items().length > 0}
          fallback={
            <EmptyState icon={props.empty.icon} title={props.empty.title} body={props.empty.body}>
              {props.empty.action}
            </EmptyState>
          }
        >
          <div class={styles.grid}>
            <MediaGrid items={items()} onOpen={viewer.open} selection={props.selection} density={props.density} scrubber={props.scrubber} class={props.class} />
          </div>
          <UKText role="label" size="m" class={styles.count}>
            {items().length.toLocaleString()} {items().length === 1 ? "item" : "items"}
          </UKText>
        </Show>
      </Show>
    </Show>
  );
};

export default MediaCollection;
