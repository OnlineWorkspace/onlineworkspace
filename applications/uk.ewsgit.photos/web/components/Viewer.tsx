import ARCHIVE_ICON from "@material-symbols/svg-700/outlined/archive.svg";
import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import CHEVRON_RIGHT_ICON from "@material-symbols/svg-700/outlined/chevron_right.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DELETE_FOREVER_ICON from "@material-symbols/svg-700/outlined/delete_forever.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import KEYBOARD_ARROW_UP_ICON from "@material-symbols/svg-700/outlined/keyboard_arrow_up.svg";
import INFO_ICON from "@material-symbols/svg-700/outlined/info.svg";
import INFO_FILL_ICON from "@material-symbols/svg-700/outlined/info-fill.svg";
import LOCATION_ON_ICON from "@material-symbols/svg-700/outlined/location_on.svg";
import MORE_VERT_ICON from "@material-symbols/svg-700/outlined/more_vert.svg";
import PHOTO_ALBUM_ICON from "@material-symbols/svg-700/outlined/photo_album.svg";
import PLAY_CIRCLE_ICON from "@material-symbols/svg-700/outlined/play_circle.svg";
import RESTORE_FROM_TRASH_ICON from "@material-symbols/svg-700/outlined/restore_from_trash.svg";
import SHARE_ICON from "@material-symbols/svg-700/outlined/share.svg";
import STAR_ICON from "@material-symbols/svg-700/outlined/star.svg";
import STAR_FILL_ICON from "@material-symbols/svg-700/outlined/star-fill.svg";
import TUNE_ICON from "@material-symbols/svg-700/outlined/tune.svg";
import UNARCHIVE_ICON from "@material-symbols/svg-700/outlined/unarchive.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKDialog from "@ewsgit/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKMenu, { type MenuItem } from "@ewsgit/uikit-solid/src/components/menu/UKMenu.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import { type Component, createEffect, createMemo, createSignal, For, type JSX, on, onCleanup, onMount, Show } from "solid-js";
import { usePhotos } from "../lib/context";
import { clockTime, viewerDay } from "../lib/format";
import { fileUrl, thumbnailSize, thumbnailUrl } from "../lib/media";
import { menuBelow } from "../lib/menu";
import trpc from "../lib/trpc";
import type { MediaItem } from "../lib/types";
import { createQuery } from "../lib/useQuery";
import EditDialog from "./EditDialog";
import InfoPanel from "./InfoPanel";
import styles from "./Viewer.module.scss";
import type { MediaDetail } from "./viewerTypes";

const INFO_KEY = "uk.ewsgit.photos.info";
const SWIPE_DISTANCE = 60;
const FILMSTRIP_RADIUS = 4;
const EDITABLE = new Set(["jpg", "jpeg", "png", "webp"]);

const readInfoOpen = () => {
  try {
    return localStorage.getItem(INFO_KEY) === "open";
  } catch {
    return false;
  }
};

const ActionButton: Component<{ icon: string; label: string; onClick: () => void; active?: boolean; disabled?: boolean }> = (props) => (
  <button type="button" class={styles.action} data-active={props.active ?? false} disabled={props.disabled} onClick={props.onClick}>
    <UKIcon>{props.icon}</UKIcon>
    <UKText role="label" size="m">
      {props.label}
    </UKText>
  </button>
);

/**
 * One photo or video filling the screen, with the photos around it a swipe, an arrow key or a click away.
 * The details open beside it on wide screens and as a sheet from the bottom on phones.
 */
const Viewer: Component<{
  id: number;
  items: MediaItem[];
  onShow: (id: number) => void;
  onClose: () => void;
  onOpenAlbum: (albumId: number) => void;
}> = (props) => {
  const photos = usePhotos();
  const isMobile = useIsMobile();

  let root!: HTMLDivElement;

  const [infoOpen, setInfoOpen] = createSignal(readInfoOpen());
  const [sheetOpen, setSheetOpen] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  const [menu, setMenu] = createSignal<ReturnType<typeof menuBelow> | false>(false);
  const [loaded, setLoaded] = createSignal(false);
  const [broken, setBroken] = createSignal(false);

  const query = createQuery(
    () => props.id,
    (id) => trpc.media.get.query({ id }),
  );

  // while the next photo's details load, the previous ones must not be shown for it
  const detail = createMemo<MediaDetail | undefined>(() => {
    const current = query.data() as MediaDetail | undefined;
    return current && current.id === props.id ? current : undefined;
  });

  const index = createMemo(() => props.items.findIndex((item) => item.id === props.id));
  const listed = () => props.items[index()];
  const previous = () => (index() > 0 ? props.items[index() - 1] : undefined);
  const next = () => (index() >= 0 ? props.items[index() + 1] : undefined);

  const item = (): MediaItem | undefined => detail() ?? listed();
  const deleted = () => detail()?.deleted ?? false;
  const favorite = () => item()?.favorite ?? false;
  const isVideo = () => item()?.kind === "video";
  const editable = () => {
    const current = detail();
    return current !== undefined && !current.deleted && current.kind === "image" && EDITABLE.has(current.name.split(".").pop()?.toLowerCase() ?? "");
  };

  createEffect(
    on(
      () => props.id,
      () => {
        setLoaded(false);
        setBroken(false);
      },
    ),
  );

  // the neighbours are fetched ahead of time so that moving to them is instant
  createEffect(() => {
    for (const neighbour of [next(), previous()]) {
      if (neighbour?.kind === "image") new Image().src = fileUrl(neighbour.id, neighbour.version);
    }
  });

  const setInfo = (open: boolean) => {
    setInfoOpen(open);

    try {
      localStorage.setItem(INFO_KEY, open ? "open" : "closed");
    } catch {
      // the choice just is not remembered
    }
  };

  const toggleInfo = () => {
    if (isMobile()) setSheetOpen((open) => !open);
    else setInfo(!infoOpen());
  };

  const go = (target: MediaItem | undefined) => {
    if (target) props.onShow(target.id);
  };

  // after the current photo is gone, the viewer carries on with a neighbour, or closes when it was the last one
  const leave = () => {
    const target = next() ?? previous();

    if (target) props.onShow(target.id);
    else props.onClose();
  };

  const trash = async () => {
    const target = next() ?? previous();

    if (await photos.actions.trash([props.id])) {
      if (target) props.onShow(target.id);
      else props.onClose();
    }
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = fileUrl(props.id, item()?.version ?? 0, true);
    link.download = detail()?.name ?? "";
    link.click();
  };

  const menuItems = (): (MenuItem | undefined)[] => {
    const current = detail();

    if (current?.deleted) {
      return [{ type: "button", leadingIcon: DOWNLOAD_ICON, label: "Download", onClick: download }];
    }

    return [
      { type: "button", leadingIcon: DOWNLOAD_ICON, label: "Download", onClick: download },
      { type: "button", leadingIcon: PHOTO_ALBUM_ICON, label: "Add to album", onClick: () => photos.actions.addToAlbum([props.id]) },
      { type: "button", leadingIcon: LOCATION_ON_ICON, label: "Edit location", onClick: () => photos.actions.editLocation([props.id], current?.location) },
      {
        type: "button",
        leadingIcon: current?.archived ? UNARCHIVE_ICON : ARCHIVE_ICON,
        label: current?.archived ? "Unarchive" : "Archive",
        onClick: () => {
          const archive = !current?.archived;
          void photos.actions.setArchived([props.id], archive).then(() => archive && leave());
        },
      },
    ];
  };

  const restore = async () => {
    const target = next() ?? previous();
    await photos.actions.restore([props.id]);

    if (target) props.onShow(target.id);
    else props.onClose();
  };

  const showMenu = (event: MouseEvent & { currentTarget: HTMLButtonElement }) => setMenu(menuBelow(event.currentTarget));

  // keys: arrows move, escape closes, "i" toggles the details
  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;

    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
    if (photos.dialogOpen() || editing() || menu() !== false) return;

    switch (event.key) {
      case "ArrowLeft":
        go(previous());
        break;
      case "ArrowRight":
        go(next());
        break;
      case "Escape":
        if (sheetOpen()) setSheetOpen(false);
        else props.onClose();
        break;
      case "i":
      case "I":
        toggleInfo();
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    root.focus({ preventScroll: true });

    // the page behind must not scroll while the viewer is up
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    });
  });

  // touch gestures: sideways moves between photos, up shows the details, down closes
  let gesture: { x: number; y: number } | undefined;

  const stageHandlers: JSX.HTMLAttributes<HTMLDivElement> = {
    onPointerDown(event) {
      gesture = event.pointerType === "touch" && !isVideo() ? { x: event.clientX, y: event.clientY } : undefined;
    },
    onPointerUp(event) {
      if (!gesture) return;

      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = undefined;

      if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx > 0 ? previous() : next());
      else if (dy < -SWIPE_DISTANCE && Math.abs(dy) > Math.abs(dx) * 1.5) setSheetOpen(true);
      else if (dy > SWIPE_DISTANCE * 1.5 && Math.abs(dy) > Math.abs(dx) * 1.5) props.onClose();
    },
    onPointerCancel() {
      gesture = undefined;
    },
  };

  const filmstrip = createMemo(() => {
    if (index() < 0) return [];

    const start = Math.max(0, Math.min(index() - FILMSTRIP_RADIUS, props.items.length - (FILMSTRIP_RADIUS * 2 + 1)));
    return props.items.slice(start, start + FILMSTRIP_RADIUS * 2 + 1);
  });

  const title = () => {
    const current = item();
    return current ? viewerDay(current.takenAt, !isMobile()) : "";
  };

  const stage = () => (
    <div class={styles.stage} {...stageHandlers}>
      <Show
        when={item()}
        fallback={
          <Show
            when={query.error()}
            fallback={<UKCircularProgressIndicator />}
          >
            <div class={styles.message}>
              <UKText role="title" size="l" align="center">
                This item is no longer available
              </UKText>
              <UKButton color="tonal" onClick={props.onClose}>
                Back
              </UKButton>
            </div>
          </Show>
        }
      >
        {(current) => (
          <Show
            when={current().kind === "image"}
            fallback={<video class={styles.media} src={fileUrl(current().id, current().version)} controls playsinline preload="metadata" />}
          >
            {/* the small preview is already cached by the grid, so something is on screen before the original arrives */}
            <img class={styles.placeholder} src={thumbnailUrl(current().id, current().version, thumbnailSize(512))} alt="" aria-hidden="true" draggable={false} data-hidden={loaded()} />
            <Show
              when={!broken()}
              fallback={
                <UKText role="body" size="l" class={styles.brokenMessage}>
                  This photo could not be shown
                </UKText>
              }
            >
              <img
                class={styles.media}
                src={fileUrl(current().id, current().version)}
                alt={detail()?.description || detail()?.name || "Photo"}
                draggable={false}
                data-loaded={loaded()}
                onLoad={() => setLoaded(true)}
                onError={() => setBroken(true)}
              />
            </Show>
          </Show>
        )}
      </Show>

      <Show when={!isMobile() && previous()}>
        <UKIconButton class={styles.previous} color="tonal" icon={CHEVRON_LEFT_ICON} alt="Previous" onClick={() => go(previous())} />
      </Show>
      <Show when={!isMobile() && next()}>
        <UKIconButton class={styles.next} color="tonal" icon={CHEVRON_RIGHT_ICON} alt="Next" onClick={() => go(next())} />
      </Show>
    </div>
  );

  const heading = () => (
    <div class={styles.title}>
      <UKText role="title" size="l" class={styles.titleText}>
        {title()}
      </UKText>
      <Show when={item()}>
        {(current) => (
          <UKText role="body" size="m" class={styles.subtitle}>
            {clockTime(current().takenAt)}
          </UKText>
        )}
      </Show>
    </div>
  );

  return (
    <div ref={root} class={styles.root} role="dialog" aria-modal="true" aria-label={title() || "Photo"} tabindex="-1" data-mobile={isMobile()} data-info={!isMobile() && infoOpen()}>
      <div class={styles.topBar}>
        <UKIconButton color="standard" icon={ARROW_BACK_ICON} alt="Back" onClick={props.onClose} />
        {heading()}

        <div class={styles.tools}>
          <Show
            when={!deleted()}
            fallback={
              <>
                <UKButton color="tonal" leadingIcon={RESTORE_FROM_TRASH_ICON} onClick={() => void restore()}>
                  Restore
                </UKButton>
                <UKButton color="standard" leadingIcon={DELETE_FOREVER_ICON} onClick={() => photos.actions.deletePermanently([props.id])}>
                  Delete forever
                </UKButton>
              </>
            }
          >
            <Show when={!isMobile()}>
              <UKIconButton color="standard" icon={SHARE_ICON} alt="Share" onClick={() => photos.actions.share({ imageId: props.id })} />
            </Show>
            <UKIconButton
              color="standard"
              icon={favorite() ? STAR_FILL_ICON : STAR_ICON}
              iconClass={favorite() ? styles.favorite : undefined}
              alt={favorite() ? "Remove from favorites" : "Add to favorites"}
              onClick={() => void photos.actions.setFavorite([props.id], !favorite())}
            />
            <Show when={!isMobile()}>
              <Show when={editable()}>
                <UKIconButton color="standard" icon={TUNE_ICON} alt="Edit" onClick={() => setEditing(true)} />
              </Show>
              <UKIconButton color={infoOpen() ? "tonal" : "standard"} icon={infoOpen() ? INFO_FILL_ICON : INFO_ICON} alt="Info" onClick={toggleInfo} />
              <UKIconButton color="standard" icon={DELETE_ICON} alt="Move to trash" onClick={() => void trash()} />
            </Show>
          </Show>
          <UKIconButton color="standard" icon={MORE_VERT_ICON} alt="More options" onClick={showMenu} />
        </div>
      </div>

      {stage()}

      <Show when={!isMobile() && filmstrip().length > 1}>
        <div class={styles.filmstrip} role="listbox" aria-label="Photos">
          <For each={filmstrip()}>
            {(entry) => (
              <button type="button" class={styles.filmstripItem} role="option" aria-selected={entry.id === props.id} data-current={entry.id === props.id} onClick={() => go(entry)}>
                <Show when={entry.kind === "image"} fallback={<UKIcon>{PLAY_CIRCLE_ICON}</UKIcon>}>
                  <img src={thumbnailUrl(entry.id, entry.version, thumbnailSize(56))} alt="" loading="lazy" draggable={false} />
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>

      <Show when={!isMobile() && infoOpen() && detail()}>
        {(current) => (
          <aside class={styles.panel} aria-label="Info">
            <InfoPanel detail={current()} onClose={() => setInfo(false)} onOpenAlbum={props.onOpenAlbum} />
          </aside>
        )}
      </Show>

      <Show when={isMobile()}>
        <div class={styles.bottom}>
          <button type="button" class={styles.handle} onClick={() => setSheetOpen(true)} aria-label="Show details">
            <span class={styles.handleBar} />
            <span class={styles.handleLabel}>
              <UKIcon>{KEYBOARD_ARROW_UP_ICON}</UKIcon>
              <UKText role="body" size="l">
                Swipe up for details
              </UKText>
            </span>
          </button>

          <div class={styles.actions}>
            <Show
              when={!deleted()}
              fallback={
                <>
                  <ActionButton icon={RESTORE_FROM_TRASH_ICON} label="Restore" onClick={() => void restore()} />
                  <ActionButton icon={DELETE_FOREVER_ICON} label="Delete" onClick={() => photos.actions.deletePermanently([props.id])} />
                </>
              }
            >
              <ActionButton icon={SHARE_ICON} label="Share" onClick={() => photos.actions.share({ imageId: props.id })} />
              <Show when={editable()}>
                <ActionButton icon={TUNE_ICON} label="Edit" onClick={() => setEditing(true)} />
              </Show>
              <ActionButton icon={INFO_ICON} label="Info" active={sheetOpen()} onClick={toggleInfo} />
              <ActionButton icon={DELETE_ICON} label="Delete" onClick={() => void trash()} />
            </Show>
          </div>
        </div>
      </Show>

      <UKMenu showMenu={menu} closeMenu={() => setMenu(false)} items={menuItems()} />

      <UKDialog show={() => isMobile() && sheetOpen() && detail() !== undefined} onClose={() => setSheetOpen(false)} maxWidth="32rem" adaptToMobile>
        <Show when={detail()}>{(current) => <InfoPanel detail={current()} onOpenAlbum={(albumId) => { setSheetOpen(false); props.onOpenAlbum(albumId); }} />}</Show>
      </UKDialog>

      <UKDialog show={editing} onClose={() => setEditing(false)} maxWidth="30rem" adaptToMobile>
        <Show when={editing() && item()}>
          {(current) => (
            <EditDialog
              item={current()}
              onClose={() => setEditing(false)}
              onError={(message) => photos.notify(message)}
              onSaved={(message, saved, mode) => {
                setEditing(false);
                photos.refresh();
                photos.notify(message);

                // a copy is a new photo, which is what the user wants to see next
                if (mode === "copy") props.onShow(saved.id);
              }}
            />
          )}
        </Show>
      </UKDialog>
    </div>
  );
};

export default Viewer;
