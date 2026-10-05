import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import DELETE_FOREVER_ICON from "@material-symbols/svg-700/outlined/delete_forever.svg";
import RESTORE_ICON from "@material-symbols/svg-700/outlined/restore_from_trash.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import { useNavigate } from "@solidjs/router";
import { type Component, createSignal, For, Show } from "solid-js";
import FileBadge from "../../components/FileBadge";
import { useFiles } from "../../lib/context";
import { formatBytes, formatModified } from "../../lib/format";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createListing } from "../../lib/useListing";
import styles from "./Index.module.scss";

const TrashPage: Component = () => {
  const files = useFiles();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [confirmEmpty, setConfirmEmpty] = createSignal(false);

  const listing = createListing(
    () => true,
    () => trpc.trash.list.query(),
  );

  const run = async (work: () => Promise<unknown>, success: string) => {
    try {
      await work();
      files.refresh();
      files.notify(success);
    } catch (error) {
      files.notify(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div class={styles.root}>
      <div class={styles.header}>
        <Show when={isMobile()}>
          <UKIconButton color="standard" icon={ARROW_BACK_ICON} alt="Back" onClick={() => navigate(routes.home())} />
        </Show>
        <UKText role="headline" size="s" class={styles.title}>
          Trash
        </UKText>
        <UKButton color="tonal" disabled={!listing.data()?.length} onClick={() => void setConfirmEmpty(true)}>
          Empty trash
        </UKButton>
      </div>

      <Show when={!listing.loading() || listing.data()} fallback={<UKCircularProgressIndicator class={styles.status} />}>
        <Show when={!listing.error()} fallback={<UKText role="body" size="l" class={styles.status}>{listing.error()}</UKText>}>
          <For each={listing.data()} fallback={<UKText role="body" size="l" class={styles.status}>The trash is empty.</UKText>}>
            {(record) => (
              <div class={styles.row}>
                <FileBadge entry={{ kind: record.kind, category: record.category, extension: record.extension }} size="s" />
                <div class={styles.text}>
                  <UKText role="label" size="l" class={styles.ellipsis}>
                    {record.name}
                  </UKText>
                  <UKText role="body" size="s" class={styles.muted}>
                    Deleted {formatModified(record.deletedAt)} · {record.kind === "file" ? `${formatBytes(record.size)} · ` : ""}from {record.originalPath.split("/").slice(0, -1).join("/") || "Home"}
                  </UKText>
                </div>
                <UKIconButton color="standard" icon={RESTORE_ICON} alt={`Restore ${record.name}`} onClick={() => run(() => trpc.trash.restore.mutate({ ids: [record.id] }), `Restored "${record.name}"`)} />
                <UKIconButton color="standard" icon={DELETE_FOREVER_ICON} alt={`Delete ${record.name} forever`} onClick={() => run(() => trpc.trash.deletePermanently.mutate({ ids: [record.id] }), `Permanently deleted "${record.name}"`)} />
              </div>
            )}
          </For>
        </Show>
      </Show>

      <UKDialog show={confirmEmpty} onClose={() => setConfirmEmpty(false)} maxWidth="28rem" adaptToMobile>
        <div class={styles.dialog}>
          <UKText role="title" size="l">
            Empty the trash?
          </UKText>
          <UKText role="body" size="l">
            Everything in the trash will be permanently deleted. This cannot be undone.
          </UKText>
          <div class={styles.dialogButtons}>
            <UKButton color="standard" onClick={() => void setConfirmEmpty(false)}>
              Cancel
            </UKButton>
            <UKButton
              color="filled"
              onClick={async () => {
                setConfirmEmpty(false);
                await run(() => trpc.trash.empty.mutate(), "Trash emptied");
              }}
            >
              Empty trash
            </UKButton>
          </div>
        </div>
      </UKDialog>
    </div>
  );
};

export default TrashPage;
