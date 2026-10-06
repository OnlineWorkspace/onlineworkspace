import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import ARCHIVE_ICON from "@material-symbols/svg-700/outlined/archive.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import FACE_ICON from "@material-symbols/svg-700/outlined/face.svg";
import KID_STAR_ICON from "@material-symbols/svg-700/outlined/kid_star.svg";
import MORE_VERT_ICON from "@material-symbols/svg-700/outlined/more_vert.svg";
import STAR_ICON from "@material-symbols/svg-700/outlined/star.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKListItem from "@ewsgit/uikit-solid/src/components/list/UKListItem.tsx";
import UKMenu from "@ewsgit/uikit-solid/src/components/menu/UKMenu.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createSignal, For, Show } from "solid-js";
import AlbumCard from "../../components/AlbumCard";
import EmptyState from "../../components/EmptyState";
import { usePhotos } from "../../lib/context";
import { menuBelow } from "../../lib/menu";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";
import styles from "./Index.module.scss";

const AlbumsPage: Component = () => {
  const photos = usePhotos();
  const navigate = useNavigate();
  const [menu, setMenu] = createSignal<ReturnType<typeof menuBelow> | false>(false);

  const albums = createQuery(
    () => true,
    () => trpc.albums.list.query(),
  );

  const counts = () => photos.counts();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline="Albums"
        trailingElements={
          <>
            <UKIconButton color="standard" icon={ADD_ICON} alt="New album" onClick={() => photos.actions.createAlbum()} />
            <UKIconButton color="standard" icon={MORE_VERT_ICON} alt="More options" onClick={(event) => setMenu(menuBelow(event.currentTarget))} />
          </>
        }
      />

      <UKMenu
        showMenu={menu}
        closeMenu={() => setMenu(false)}
        items={[
          { type: "button", leadingIcon: UPLOAD_ICON, label: "Upload photos & videos", onClick: () => photos.actions.pickAndUpload() },
          { type: "button", leadingIcon: KID_STAR_ICON, label: "Memories", onClick: () => navigate(routes.memories()) },
        ]}
      />

      <div class={styles.page}>
        <UKText role="label" size="l" class={styles.heading}>
          Your albums
        </UKText>

        <Show
          when={!albums.loading()}
          fallback={
            <div class={styles.centered}>
              <UKCircularProgressIndicator />
            </div>
          }
        >
          <Show
            when={(albums.data()?.albums.length ?? 0) > 0}
            fallback={
              <Show
                when={albums.error() === undefined}
                fallback={
                  <EmptyState icon={ADD_ICON} title="Could not load your albums" body={albums.error()}>
                    <UKButton color="tonal" onClick={photos.refresh}>
                      Try again
                    </UKButton>
                  </EmptyState>
                }
              >
                <EmptyState icon={ADD_ICON} title="No albums yet" body="Albums group photos you want to keep together.">
                  <UKButton color="filled" leadingIcon={ADD_ICON} onClick={() => photos.actions.createAlbum()}>
                    New album
                  </UKButton>
                </EmptyState>
              </Show>
            }
          >
            <div class={styles.grid}>
              <For each={albums.data()?.albums}>{(album) => <AlbumCard album={album} onClick={() => navigate(routes.album(album.id))} />}</For>
            </div>
          </Show>
        </Show>

        <UKText role="label" size="l" class={styles.heading}>
          Utilities
        </UKText>

        <div class={styles.utilities}>
          <UKListItem
            labelText="Favorites"
            supportingText=""
            lines={1}
            leading={{ type: "icon", value: STAR_ICON }}
            trailing={counts() ? { type: "text", value: counts()!.favorites.toLocaleString() } : undefined}
            onClick={() => navigate(routes.favorites())}
          />
          <UKListItem labelText="Faces" supportingText="" lines={1} leading={{ type: "icon", value: FACE_ICON }} onClick={() => navigate(routes.faces())} />
          <UKListItem
            labelText="Archive"
            supportingText=""
            lines={1}
            leading={{ type: "icon", value: ARCHIVE_ICON }}
            trailing={counts() ? { type: "text", value: counts()!.archive.toLocaleString() } : undefined}
            onClick={() => navigate(routes.archive())}
          />
          <UKListItem
            labelText="Trash"
            supportingText=""
            lines={1}
            leading={{ type: "icon", value: DELETE_ICON }}
            trailing={counts() ? { type: "text", value: counts()!.trash.toLocaleString() } : undefined}
            onClick={() => navigate(routes.trash())}
          />
        </div>
      </div>
    </>
  );
};

export default AlbumsPage;
