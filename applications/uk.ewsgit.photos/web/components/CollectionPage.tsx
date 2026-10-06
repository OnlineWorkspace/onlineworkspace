import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, type JSX, Show } from "solid-js";
import { usePhotos } from "../lib/context";
import { createSelection } from "../lib/selection";
import trpc from "../lib/trpc";
import type { MediaQuery } from "../lib/types";
import { createQuery } from "../lib/useQuery";
import MediaCollection, { selectionActions } from "./MediaCollection";
import SelectionBar from "./SelectionBar";
import styles from "./CollectionPage.module.scss";

/** A page that is a titled grid of photos with a back button: favorites, the archive, the trash, an album, a memory. */
const CollectionPage: Component<{
  title: string;
  subtitle?: string;
  query: MediaQuery | undefined;
  kind: "library" | "archive" | "trash" | "album";
  albumId?: number;
  backTo: string;
  empty: { icon: string; title: string; body?: string; action?: JSX.Element };
  // extra buttons at the end of the top bar
  trailing?: JSX.Element;
  // shown between the top bar and the photos
  note?: string;
}> = (props) => {
  const photos = usePhotos();
  const navigate = useNavigate();
  const selection = createSelection();

  const media = createQuery(
    () => props.query,
    (input) => trpc.media.list.query(input),
  );

  return (
    <>
      <Show
        when={!selection.active()}
        fallback={
          <SelectionBar
            count={selection.count()}
            onClose={selection.clear}
            actions={selectionActions({ photos, selection, items: media.data()?.items ?? [], kind: props.kind, albumId: props.albumId })}
          />
        }
      >
        <UKTopAppBar
          type="small"
          headline={props.title}
          subtitle={props.subtitle}
          leadingButton={{ icon: ARROW_BACK_ICON, accessibleLabel: "Back", onClick: () => navigate(props.backTo) }}
          trailingElements={props.trailing}
        />
      </Show>

      <Show when={props.note}>
        <UKText role="body" size="m" class={styles.note}>
          {props.note}
        </UKText>
      </Show>

      <MediaCollection
        items={media.data()?.items}
        loading={media.loading()}
        error={media.error()}
        selection={selection}
        scrubber={props.kind !== "trash"}
        empty={props.empty}
      />
    </>
  );
};

export default CollectionPage;
