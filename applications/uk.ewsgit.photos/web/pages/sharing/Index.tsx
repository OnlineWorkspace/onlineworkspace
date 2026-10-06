import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import GROUP_ICON from "@material-symbols/svg-700/outlined/group.svg";
import LINK_OFF_ICON from "@material-symbols/svg-700/outlined/link_off.svg";
import STACKS_ICON from "@material-symbols/svg-700/outlined/stacks.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, For, Show } from "solid-js";
import EmptyState from "../../components/EmptyState";
import { usePhotos } from "../../lib/context";
import { pluralise, shortDate } from "../../lib/format";
import { errorMessage, shareUrl, thumbnailSize, thumbnailUrl } from "../../lib/media";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";
import styles from "./Index.module.scss";

const SharingPage: Component = () => {
  const photos = usePhotos();
  const navigate = useNavigate();

  const shares = createQuery(
    () => true,
    () => trpc.shares.list.query(),
  );

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      photos.notify("Link copied");
    } catch {
      photos.notify("Could not copy the link");
    }
  };

  const stop = async (id: number) => {
    try {
      await trpc.shares.revoke.mutate({ id });
      photos.refresh();
      photos.notify("Sharing turned off");
    } catch (error) {
      photos.notify(errorMessage(error));
    }
  };

  return (
    <>
      <UKTopAppBar type="small" headline="Sharing" />

      <div class={styles.page}>
        <Show
          when={!shares.loading()}
          fallback={
            <div class={styles.centered}>
              <UKCircularProgressIndicator />
            </div>
          }
        >
          <Show
            when={(shares.data()?.shares.length ?? 0) > 0}
            fallback={
              <EmptyState
                icon={GROUP_ICON}
                title={shares.error() ? "Could not load your shared links" : "Nothing shared yet"}
                body={shares.error() ?? "Share an album or a photo to get a link that anyone can open. Everything you share is listed here, and you can turn a link off at any time."}
              />
            }
          >
            <UKText role="body" size="m" class={styles.intro}>
              Anyone with one of these links can view what is shared.
            </UKText>

            <div class={styles.list}>
              <For each={shares.data()?.shares}>
                {(share) => (
                  <div class={styles.row}>
                    <button
                      type="button"
                      class={styles.open}
                      onClick={() => navigate(share.kind === "album" && share.albumId !== null ? routes.album(share.albumId) : `${routes.photos()}?photo=${share.imageId}`)}
                    >
                      <div class={styles.cover}>
                        <Show when={share.cover} fallback={<UKIcon>{STACKS_ICON}</UKIcon>}>
                          {(cover) => <img src={thumbnailUrl(cover().id, cover().version, thumbnailSize(56))} alt="" loading="lazy" decoding="async" draggable={false} />}
                        </Show>
                      </div>
                      <div class={styles.text}>
                        <UKText role="title" size="m" class={styles.title}>
                          {share.title}
                        </UKText>
                        <UKText role="body" size="m" class={styles.supporting}>
                          {share.kind === "album" ? `Album · ${pluralise(share.count, "item")}` : "Photo"} · shared {shortDate(share.createdAt)}
                        </UKText>
                      </div>
                    </button>
                    <UKIconButton color="standard" icon={CONTENT_COPY_ICON} alt={`Copy the link to ${share.title}`} onClick={() => void copy(share.token)} />
                    <UKIconButton color="standard" icon={LINK_OFF_ICON} alt={`Stop sharing ${share.title}`} onClick={() => void stop(share.id)} />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </>
  );
};

export default SharingPage;
