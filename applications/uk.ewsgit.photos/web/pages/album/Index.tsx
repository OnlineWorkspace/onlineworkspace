import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import MORE_VERT_ICON from "@material-symbols/svg-700/outlined/more_vert.svg";
import PHOTO_ALBUM_ICON from "@material-symbols/svg-700/outlined/photo_album.svg";
import SHARE_ICON from "@material-symbols/svg-700/outlined/share.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKMenu from "@ewsgit/uikit-solid/src/components/menu/UKMenu.tsx";
import { Navigate, useParams } from "@solidjs/router";
import { type Component, createSignal } from "solid-js";
import CollectionPage from "../../components/CollectionPage";
import { usePhotos } from "../../lib/context";
import { menuBelow } from "../../lib/menu";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";
import styles from "./Index.module.scss";

const AlbumPage: Component = () => {
  const params = useParams();
  const photos = usePhotos();
  const [menu, setMenu] = createSignal<ReturnType<typeof menuBelow> | false>(false);

  const albumId = () => {
    const id = Number(params.id);
    return Number.isInteger(id) && id > 0 ? id : undefined;
  };

  const album = createQuery(albumId, (id) => trpc.albums.get.query({ id }));

  return (
    <>
      {albumId() === undefined && <Navigate href={routes.albums()} />}

      <CollectionPage
        title={album.data()?.name ?? "Album"}
        query={albumId() === undefined ? undefined : { scope: "album", albumId: albumId() }}
        kind="album"
        albumId={albumId()}
        backTo={routes.albums()}
        empty={{ icon: PHOTO_ALBUM_ICON, title: "This album is empty", body: "Select photos in your library and choose “Add to album” to put them here." }}
        trailing={
          <>
            <UKIconButton color="standard" icon={SHARE_ICON} alt="Share album" onClick={() => {
              const id = albumId();
              if (id !== undefined) photos.actions.share({ albumId: id });
            }} />
            <UKIconButton color="standard" icon={MORE_VERT_ICON} alt="More options" onClick={(event) => setMenu(menuBelow(event.currentTarget))} />
            <UKMenu
              showMenu={menu}
              closeMenu={() => setMenu(false)}
              class={styles.menu}
              items={[
                { type: "button", leadingIcon: EDIT_ICON, label: "Rename album", onClick: () => {
                    const id = albumId();
                    if (id !== undefined) photos.actions.renameAlbum(id, album.data()?.name ?? "");
                  },
                },
                { type: "button", leadingIcon: DELETE_ICON, label: "Delete album", onClick: () => {
                    const id = albumId();
                    if (id !== undefined) photos.actions.deleteAlbum(id, album.data()?.name ?? "this album");
                  },
                },
              ]}
            />
          </>
        }
      />
    </>
  );
};

export default AlbumPage;
