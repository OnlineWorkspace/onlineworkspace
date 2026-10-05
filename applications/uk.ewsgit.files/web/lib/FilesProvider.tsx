import CREATE_NEW_FOLDER_ICON from "@material-symbols/svg-700/outlined/create_new_folder.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import DRIVE_FILE_MOVE_ICON from "@material-symbols/svg-700/outlined/drive_file_move.svg";
import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import NOTE_ADD_ICON from "@material-symbols/svg-700/outlined/note_add.svg";
import OPEN_IN_NEW_ICON from "@material-symbols/svg-700/outlined/open_in_new.svg";
import SHARE_ICON from "@material-symbols/svg-700/outlined/share.svg";
import STAR_ICON from "@material-symbols/svg-700/outlined/star.svg";
import UPLOAD_FILE_ICON from "@material-symbols/svg-700/outlined/upload_file.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKListItem from "@ewsgit/uikit-solid/src/components/list/UKListItem.tsx";
import UKMenu, { type MenuItem } from "@ewsgit/uikit-solid/src/components/menu/UKMenu.tsx";
import UKSnackbar from "@ewsgit/uikit-solid/src/components/snackbar/UKSnackbar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import { useNavigate } from "@solidjs/router";
import { createResource, createSignal, For, type ParentProps, Show, Suspense } from "solid-js";
import DestinationDialogContent from "../components/DestinationDialog";
import { FilesContext, type FilesContextValue, type Place } from "./context";
import { pluralise } from "./format";
import { routes } from "./routes";
import trpc, { APPLICATION_ID } from "./trpc";
import type { Entry } from "./types";
import styles from "./FilesProvider.module.scss";

type DialogState =
  | { type: "name"; title: string; label: string; initial: string; confirmLabel: string; onSubmit: (name: string) => Promise<void> }
  | { type: "confirm"; title: string; body: string; confirmLabel: string; onConfirm: () => Promise<void> }
  | { type: "destination"; mode: "move" | "copy"; entries: Entry[] }
  | { type: "places" };

type MenuState = { x: number; y: number; align: "right" };

const MENU_WIDTH = 248;
const MENU_ITEM_HEIGHT = 44;

// UKMenu does not keep itself on screen, so a position near an edge is pulled back inwards
const placeMenu = (x: number, y: number, itemCount: number): MenuState => ({
  x: Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8)),
  y: Math.max(8, Math.min(y, window.innerHeight - itemCount * MENU_ITEM_HEIGHT - 24)),
  align: "right",
});

const SNACKBAR_MS = 4000;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

const FilesProvider = (props: ParentProps) => {
  const navigate = useNavigate();

  const [places] = createResource<Place[]>(async () => ((await trpc.places.query().catch(() => [])) as Place[]));
  const [version, setVersion] = createSignal(0);
  const [currentDirectory, setCurrentDirectory] = createSignal("/");
  const [message, setMessage] = createSignal<string | undefined>();
  const [dialog, setDialog] = createSignal<DialogState | undefined>();
  const [dialogName, setDialogName] = createSignal("");
  const [newMenu, setNewMenu] = createSignal<(MenuState & { directory: string }) | false>(false);
  const [entryMenu, setEntryMenu] = createSignal<(MenuState & { entries: Entry[] }) | false>(false);

  let snackbarTimeout: ReturnType<typeof setTimeout> | undefined;

  const notify = (text: string) => {
    clearTimeout(snackbarTimeout);
    setMessage(text);
    snackbarTimeout = setTimeout(() => setMessage(undefined), SNACKBAR_MS);
  };

  const refresh = () => setVersion((v) => v + 1);

  /** Runs a change, reloads listings afterwards and reports any failure. */
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

  const describe = (entries: Entry[]) => (entries.length === 1 ? `"${entries[0]!.name}"` : pluralise(entries.length, "item"));

  const closeDialog = () => setDialog(undefined);

  const openDialog = (state: DialogState) => {
    setDialogName(state.type === "name" ? state.initial : "");
    setDialog(state);
  };

  const fileUrl = async (entry: Entry) => trpc.fileUrl.query({ path: entry.path });

  const actions: FilesContextValue["actions"] = {
    open(entry) {
      if (entry.kind === "directory") {
        navigate(routes.browse(entry.path));
        return;
      }

      // the tab has to be opened inside the click handler or popup blockers swallow it
      const tab = window.open("", "_blank");

      fileUrl(entry).then(
        (url) => {
          if (tab) tab.location.href = url;
          else window.location.href = url;
        },
        (error) => {
          tab?.close();
          notify(errorMessage(error));
        },
      );
    },

    newFolder(directory = currentDirectory()) {
      openDialog({
        type: "name",
        title: "New folder",
        label: "Folder name",
        initial: "Untitled folder",
        confirmLabel: "Create",
        onSubmit: (name) => attempt(() => trpc.createFolder.mutate({ path: directory, name })).then(() => undefined),
      });
    },

    newFile(directory = currentDirectory()) {
      openDialog({
        type: "name",
        title: "New file",
        label: "File name",
        initial: "Untitled.txt",
        confirmLabel: "Create",
        onSubmit: (name) => attempt(() => trpc.createFile.mutate({ path: directory, name })).then(() => undefined),
      });
    },

    pickAndUpload(directory = currentDirectory()) {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.onchange = () => {
        if (input.files?.length) void actions.uploadFiles([...input.files], directory);
      };
      input.click();
    },

    async uploadFiles(files, directory = currentDirectory()) {
      if (files.length === 0) return;

      setMessage(`Uploading ${pluralise(files.length, "file")}…`);
      clearTimeout(snackbarTimeout);

      let failed = 0;
      let lastError = "";

      for (const file of files) {
        try {
          const response = await fetch(
            `/api/${APPLICATION_ID}/upload?${new URLSearchParams({ path: directory, name: file.name, lastModified: String(file.lastModified) })}`,
            { method: "POST", body: file, credentials: "include" },
          );

          if (!response.ok) throw new Error(((await response.json().catch(() => undefined)) as { message?: string } | undefined)?.message ?? "Upload failed");
        } catch (error) {
          failed++;
          lastError = errorMessage(error);
        }
      }

      refresh();
      notify(failed === 0 ? `Uploaded ${pluralise(files.length, "file")}` : `${failed} of ${files.length} uploads failed: ${lastError}`);
    },

    rename(entry) {
      openDialog({
        type: "name",
        title: "Rename",
        label: "Name",
        initial: entry.name,
        confirmLabel: "Rename",
        onSubmit: async (name) => {
          if (name !== entry.name) await attempt(() => trpc.rename.mutate({ path: entry.path, name }));
        },
      });
    },

    trash(entries) {
      openDialog({
        type: "confirm",
        title: "Move to trash?",
        body: `${describe(entries)} will be moved to the trash. You can restore ${entries.length === 1 ? "it" : "them"} from there.`,
        confirmLabel: "Delete",
        onConfirm: () => attempt(() => trpc.delete.mutate({ paths: entries.map((e) => e.path) }), `Moved ${describe(entries)} to the trash`).then(() => undefined),
      });
    },

    moveOrCopy(entries, mode) {
      openDialog({ type: "destination", mode, entries });
    },

    async setStarred(entries, starred) {
      await attempt(() => trpc.starred.set.mutate({ paths: entries.map((e) => e.path), starred }), starred ? `Starred ${describe(entries)}` : `Unstarred ${describe(entries)}`);
    },

    async share(entry) {
      try {
        const url = new URL(await fileUrl(entry), window.location.origin).toString();

        if (navigator.share) {
          await navigator.share({ title: entry.name, url });
        } else {
          await navigator.clipboard.writeText(url);
          notify("Link copied. Only people signed in to this workspace can open it.");
        }
      } catch (error) {
        // the user dismissing the share sheet is not an error
        if (error instanceof DOMException && error.name === "AbortError") return;
        notify(errorMessage(error));
      }
    },

    async download(entry) {
      try {
        const link = document.createElement("a");
        link.href = await fileUrl(entry);
        link.download = entry.name;
        link.click();
      } catch (error) {
        notify(errorMessage(error));
      }
    },

    openNewMenu(x, y, directory = currentDirectory()) {
      setNewMenu({ ...placeMenu(x, y, 4), directory });
    },

    openEntryMenu(entries, x, y) {
      if (entries.length > 0) setEntryMenu({ ...placeMenu(x, y, entryMenuItems(entries).length), entries });
    },

    openPlaces() {
      openDialog({ type: "places" });
    },
  };

  const newMenuItems = (directory: string): MenuItem[] => [
    { type: "button", leadingIcon: CREATE_NEW_FOLDER_ICON, label: "New folder", onClick: () => actions.newFolder(directory) },
    { type: "button", leadingIcon: NOTE_ADD_ICON, label: "New file", onClick: () => actions.newFile(directory) },
    { type: "divider" },
    { type: "button", leadingIcon: UPLOAD_FILE_ICON, label: "Upload files", onClick: () => actions.pickAndUpload(directory) },
  ];

  const entryMenuItems = (entries: Entry[]): (MenuItem | undefined)[] => {
    const single = entries.length === 1 ? entries[0]! : undefined;
    const allStarred = entries.every((entry) => entry.starred);

    return [
      single ? { type: "button", leadingIcon: single.kind === "directory" ? FOLDER_ICON : OPEN_IN_NEW_ICON, label: "Open", onClick: () => actions.open(single) } : undefined,
      { type: "button", leadingIcon: STAR_ICON, label: allStarred ? "Remove star" : "Add star", onClick: () => actions.setStarred(entries, !allStarred) },
      single?.kind === "file" ? { type: "button", leadingIcon: SHARE_ICON, label: "Share", onClick: () => actions.share(single) } : undefined,
      single?.kind === "file" ? { type: "button", leadingIcon: DOWNLOAD_ICON, label: "Download", onClick: () => actions.download(single) } : undefined,
      { type: "divider" },
      single ? { type: "button", leadingIcon: EDIT_ICON, label: "Rename", onClick: () => actions.rename(single) } : undefined,
      { type: "button", leadingIcon: CONTENT_COPY_ICON, label: "Copy to…", onClick: () => actions.moveOrCopy(entries, "copy") },
      { type: "button", leadingIcon: DRIVE_FILE_MOVE_ICON, label: "Move to…", onClick: () => actions.moveOrCopy(entries, "move") },
      { type: "divider" },
      { type: "button", leadingIcon: DELETE_ICON, label: "Delete", onClick: () => actions.trash(entries) },
    ];
  };

  const context: FilesContextValue = { places: places as FilesContextValue["places"], version, refresh, currentDirectory, setCurrentDirectory, notify, actions };

  const submitName = async () => {
    const state = dialog();
    const name = dialogName().trim();

    if (state?.type !== "name" || name === "") return;

    closeDialog();
    await state.onSubmit(name);
  };

  return (
    <FilesContext.Provider value={context}>
      {props.children}

      <UKMenu items={newMenuItems((newMenu() || undefined)?.directory ?? "/")} showMenu={newMenu} closeMenu={() => setNewMenu(false)} />
      <UKMenu items={entryMenuItems((entryMenu() || undefined)?.entries ?? [])} showMenu={entryMenu} closeMenu={() => setEntryMenu(false)} />

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
                <UKTextField color="outlined" label={state.label} defaultValue={state.initial} onValueChange={setDialogName} onSubmit={submitName} onEscape={closeDialog} />
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

          if (state.type === "destination") {
            return (
              <DestinationDialogContent
                mode={state.mode}
                entries={state.entries}
                onCancel={closeDialog}
                onConfirm={async (destination) => {
                  closeDialog();
                  const mutation = state.mode === "move" ? trpc.move : trpc.copy;
                  await attempt(() => mutation.mutate({ paths: state.entries.map((e) => e.path), destination }), `${state.mode === "move" ? "Moved" : "Copied"} ${describe(state.entries)}`);
                }}
              />
            );
          }

          return (
            <div class={styles.dialog}>
              <UKText role="title" size="l">
                Places
              </UKText>
              <Suspense>
              <For each={places.latest ?? []}>
                {(place) => (
                  <UKListItem
                    labelText={place.label}
                    supportingText={place.path === "/" ? "All of your files" : place.path}
                    leading={{ type: "icon", value: FOLDER_ICON }}
                    lines={2}
                    onClick={() => {
                      closeDialog();
                      navigate(routes.browse(place.path));
                    }}
                  />
                )}
              </For>
              </Suspense>
              <UKListItem
                labelText="Trash"
                supportingText="Deleted items"
                leading={{ type: "icon", value: DELETE_ICON }}
                lines={2}
                onClick={() => {
                  closeDialog();
                  navigate(routes.trash());
                }}
              />
            </div>
          );
        })()}
      </UKDialog>

      <Show when={message()}>
        {(text) => (
          <div class={styles.snackbar}>
            <UKSnackbar message={text()} onDismiss={() => setMessage(undefined)} />
          </div>
        )}
      </Show>
    </FilesContext.Provider>
  );
};

export default FilesProvider;
