import CREATE_NEW_FOLDER_ICON from "@material-symbols/svg-700/outlined/create_new_folder.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKMenu, { type MenuItem } from "@ewsgit/uikit-solid/src/components/menu/UKMenu.tsx";
import UKSnackbar from "@ewsgit/uikit-solid/src/components/snackbar/UKSnackbar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { useNavigate } from "@solidjs/router";
import { createResource, createSignal, onCleanup, onMount, type ParentProps, Show } from "solid-js";
import AlbumPickerDialog from "../components/AlbumPickerDialog";
import ShareDialog from "../components/ShareDialog";
import { type PhotosActions, PhotosContext, type PhotosContextValue } from "./context";
import { pluralise } from "./format";
import { errorMessage } from "./media";
import { routes } from "./routes";
import trpc, { APPLICATION_ID } from "./trpc";
import type { MediaItem, ShareTarget } from "./types";
import styles from "./PhotosProvider.module.scss";

type DialogState =
  | { type: "name"; title: string; label: string; initial: string; confirmLabel: string; allowEmpty?: boolean; onSubmit: (name: string) => Promise<void> }
  | { type: "confirm"; title: string; body: string; confirmLabel: string; onConfirm: () => Promise<void> }
  | { type: "albumPicker"; ids: number[] }
  | { type: "share"; target: ShareTarget };

type MenuState = { x: number; y: number; align: "right" };

const MENU_WIDTH = 248;
const MENU_ITEM_HEIGHT = 44;
const SNACKBAR_MS = 5000;

// UKMenu does not keep itself on screen, so a position near an edge is pulled back inwards
const placeMenu = (x: number, y: number, itemCount: number): MenuState => ({
  x: Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8)),
  y: Math.max(8, Math.min(y, window.innerHeight - itemCount * MENU_ITEM_HEIGHT - 24)),
  align: "right",
});

const describe = (count: number) => (count === 1 ? "1 item" : pluralise(count, "item"));

const PhotosProvider = (props: ParentProps) => {
  const navigate = useNavigate();

  const [version, setVersion] = createSignal(0);
  const [message, setMessage] = createSignal<{ text: string; action?: { label: string; onClick: () => void } } | undefined>();
  const [dialog, setDialog] = createSignal<DialogState | undefined>();
  const [dialogName, setDialogName] = createSignal("");
  const [newMenu, setNewMenu] = createSignal<MenuState | false>(false);
  const [viewerItems, setItems] = createSignal<MediaItem[]>([]);

  let viewerOwner: symbol | undefined;
  let snackbarTimeout: ReturnType<typeof setTimeout> | undefined;

  const refresh = () => setVersion((current) => current + 1);

  const notify: PhotosContextValue["notify"] = (text, action) => {
    clearTimeout(snackbarTimeout);
    setMessage({ text, action });
    snackbarTimeout = setTimeout(() => setMessage(undefined), SNACKBAR_MS);
  };

  const [counts] = createResource(version, () => trpc.library.counts.query().catch(() => undefined));

  /** Runs a change, reloads everything afterwards and reports a failure instead of throwing. */
  const attempt = async (work: () => Promise<unknown>, success?: string): Promise<boolean> => {
    try {
      await work();
      refresh();
      if (success) notify(success);
      return true;
    } catch (error) {
      notify(errorMessage(error));
      return false;
    }
  };

  const openDialog = (state: DialogState) => {
    setDialogName(state.type === "name" ? state.initial : "");
    setDialog(state);
  };

  const closeDialog = () => setDialog(undefined);

  const actions: PhotosActions = {
    pickAndUpload() {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/quicktime,video/webm";
      input.onchange = () => {
        if (input.files?.length) void actions.uploadFiles([...input.files]);
      };
      input.click();
    },

    async uploadFiles(files) {
      if (files.length === 0) return;

      setMessage({ text: `Uploading ${pluralise(files.length, "file")}…` });
      clearTimeout(snackbarTimeout);

      let failed = 0;
      let lastError = "";

      for (const file of files) {
        try {
          const response = await fetch(`/api/${APPLICATION_ID}/upload?${new URLSearchParams({ name: file.name, lastModified: String(file.lastModified) })}`, {
            method: "POST",
            body: file,
            credentials: "include",
          });

          if (!response.ok) throw new Error(((await response.json().catch(() => undefined)) as { message?: string } | undefined)?.message ?? "Upload failed");
        } catch (error) {
          failed++;
          lastError = errorMessage(error);
        }
      }

      refresh();
      notify(failed === 0 ? `Uploaded ${pluralise(files.length, "file")}` : `${failed} of ${files.length} uploads failed: ${lastError}`);
    },

    async setFavorite(ids, value) {
      await attempt(() => trpc.media.setFavorite.mutate({ ids, value }), value ? `Added ${describe(ids.length)} to favorites` : `Removed ${describe(ids.length)} from favorites`);
    },

    async setArchived(ids, value) {
      await attempt(() => trpc.media.setArchived.mutate({ ids, value }), value ? `Archived ${describe(ids.length)}` : `Moved ${describe(ids.length)} back to your photos`);
    },

    async trash(ids) {
      let moved = false;

      await attempt(async () => {
        await trpc.media.trash.mutate({ ids });
        moved = true;
      });

      if (moved) {
        notify(`Moved ${describe(ids.length)} to the trash`, {
          label: "Undo",
          onClick: () => {
            setMessage(undefined);
            void actions.restore(ids);
          },
        });
      }

      return moved;
    },

    async restore(ids) {
      await attempt(() => trpc.media.restore.mutate({ ids }), `Restored ${describe(ids.length)}`);
    },

    deletePermanently(ids) {
      openDialog({
        type: "confirm",
        title: "Delete forever?",
        body: `${describe(ids.length)} will be deleted permanently. This cannot be undone.`,
        confirmLabel: "Delete forever",
        onConfirm: async () => {
          await attempt(() => trpc.media.deletePermanently.mutate({ ids }), `Deleted ${describe(ids.length)} permanently`);
        },
      });
    },

    emptyTrash() {
      openDialog({
        type: "confirm",
        title: "Empty trash?",
        body: "Everything in the trash will be deleted permanently. This cannot be undone.",
        confirmLabel: "Empty trash",
        onConfirm: async () => {
          await attempt(() => trpc.media.emptyTrash.mutate(), "Emptied the trash");
        },
      });
    },

    addToAlbum(ids) {
      openDialog({ type: "albumPicker", ids });
    },

    async removeFromAlbum(albumId, ids) {
      await attempt(() => trpc.albums.removeMedia.mutate({ id: albumId, ids }), `Removed ${describe(ids.length)} from the album`);
    },

    async setAlbumCover(albumId, imageId) {
      await attempt(() => trpc.albums.setCover.mutate({ id: albumId, imageId }), "Album cover changed");
    },

    createAlbum(ids) {
      openDialog({
        type: "name",
        title: "New album",
        label: "Album name",
        initial: "",
        confirmLabel: "Create",
        onSubmit: async (name) => {
          let createdId: number | undefined;

          const ok = await attempt(async () => {
            createdId = (await trpc.albums.create.mutate({ name, ids })).id;
          });

          if (ok && createdId !== undefined) navigate(routes.album(createdId));
        },
      });
    },

    renameAlbum(albumId, currentName) {
      openDialog({
        type: "name",
        title: "Rename album",
        label: "Album name",
        initial: currentName,
        confirmLabel: "Rename",
        onSubmit: async (name) => {
          if (name !== currentName) await attempt(() => trpc.albums.rename.mutate({ id: albumId, name }));
        },
      });
    },

    renamePerson(personId, currentName) {
      openDialog({
        type: "name",
        title: "Name this person",
        label: "Name",
        initial: currentName,
        confirmLabel: "Save",
        allowEmpty: true,
        onSubmit: async (name) => {
          await attempt(() => trpc.faces.rename.mutate({ id: personId, name }));
        },
      });
    },

    deleteAlbum(albumId, name) {
      openDialog({
        type: "confirm",
        title: "Delete album?",
        body: `"${name}" will be deleted. The photos in it stay in your library.`,
        confirmLabel: "Delete album",
        onConfirm: async () => {
          if (await attempt(() => trpc.albums.delete.mutate({ id: albumId }), "Album deleted")) navigate(routes.albums());
        },
      });
    },

    editLocation(ids, current) {
      openDialog({
        type: "name",
        title: "Location",
        label: "Location name",
        initial: current ?? "",
        confirmLabel: "Save",
        allowEmpty: true,
        onSubmit: async (location) => {
          await attempt(() => trpc.media.setLocation.mutate({ ids, location }), location === "" ? "Location removed" : "Location saved");
        },
      });
    },

    share(target) {
      openDialog({ type: "share", target });
    },

    openNewMenu(x, y) {
      setNewMenu(placeMenu(x, y, 2));
    },
  };

  const newMenuItems: (MenuItem | undefined)[] = [
    { type: "button", leadingIcon: UPLOAD_ICON, label: "Upload photos & videos", onClick: () => actions.pickAndUpload() },
    { type: "button", leadingIcon: CREATE_NEW_FOLDER_ICON, label: "New album", onClick: () => actions.createAlbum() },
  ];

  const clearViewerItems = (owner: symbol) => {
    if (viewerOwner === owner) {
      viewerOwner = undefined;
      setItems([]);
    }
  };

  const submitName = async () => {
    const state = dialog();
    const name = dialogName().trim();

    if (state?.type !== "name" || (name === "" && !state.allowEmpty)) return;

    closeDialog();
    await state.onSubmit(name);
  };

  // the first look at the library also finds files that were added elsewhere, such as through the Files app
  onMount(() => {
    trpc.library.sync
      .mutate()
      .then((result) => {
        if (result.added > 0) refresh();
      })
      .catch(() => undefined);
  });

  onCleanup(() => clearTimeout(snackbarTimeout));

  const context: PhotosContextValue = {
    version,
    refresh,
    notify,
    dialogOpen: () => dialog() !== undefined,
    counts: () => counts.latest ?? undefined,
    viewerItems,
    setViewerItems(owner, items) {
      viewerOwner = owner;
      setItems(items);
    },
    clearViewerItems,
    actions,
  };

  return (
    <PhotosContext.Provider value={context}>
      {props.children}

      <UKMenu items={newMenuItems} showMenu={newMenu} closeMenu={() => setNewMenu(false)} />

      <UKDialog show={() => dialog() !== undefined} onClose={closeDialog} maxWidth="28rem" adaptToMobile>
        {(() => {
          const state = dialog();

          if (!state) return null;

          if (state.type === "name") {
            return (
              <div class={styles.dialog}>
                <UKText role="title" size="l">
                  {state.title}
                </UKText>
                <UKTextField color="outlined" label={state.label} defaultValue={state.initial} onValueChange={setDialogName} onSubmit={submitName} onEscape={closeDialog} maximumCharacterCount={state.allowEmpty ? 200 : 120} />
                <div class={styles.buttons}>
                  <UKButton color="standard" onClick={closeDialog}>
                    Cancel
                  </UKButton>
                  <UKButton color="filled" onClick={submitName}>
                    {state.confirmLabel}
                  </UKButton>
                </div>
              </div>
            );
          }

          if (state.type === "confirm") {
            return (
              <div class={styles.dialog}>
                <UKText role="title" size="l">
                  {state.title}
                </UKText>
                <UKText role="body" size="l">
                  {state.body}
                </UKText>
                <div class={styles.buttons}>
                  <UKButton color="standard" onClick={closeDialog}>
                    Cancel
                  </UKButton>
                  <UKButton
                    color="filled"
                    onClick={async () => {
                      closeDialog();
                      await state.onConfirm();
                    }}
                  >
                    {state.confirmLabel}
                  </UKButton>
                </div>
              </div>
            );
          }

          if (state.type === "albumPicker") {
            return (
              <AlbumPickerDialog
                onCancel={closeDialog}
                onNewAlbum={() => {
                  closeDialog();
                  actions.createAlbum(state.ids);
                }}
                onPick={async (album) => {
                  closeDialog();
                  await attempt(() => trpc.albums.addMedia.mutate({ id: album.id, ids: state.ids }), `Added ${describe(state.ids.length)} to ${album.name}`);
                }}
              />
            );
          }

          return <ShareDialog target={state.target} onClose={closeDialog} notify={notify} onChanged={refresh} />;
        })()}
      </UKDialog>

      <Show when={message()}>
        {(current) => (
          <div class={styles.snackbar}>
            <UKSnackbar message={current().text} action={current().action} onDismiss={() => setMessage(undefined)} />
          </div>
        )}
      </Show>
    </PhotosContext.Provider>
  );
};

export default PhotosProvider;
