import BROKEN_IMAGE_ICON from "@material-symbols/svg-700/outlined/broken_image.svg";
import CHECK_CIRCLE_FILL_ICON from "@material-symbols/svg-700/outlined/check_circle-fill.svg";
import PLAY_CIRCLE_FILL_ICON from "@material-symbols/svg-700/outlined/play_circle-fill.svg";
import RADIO_BUTTON_UNCHECKED_ICON from "@material-symbols/svg-700/outlined/radio_button_unchecked.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import clsx from "clsx";
import { type Component, createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from "solid-js";
import { dayKey, dayLabel, shortMonth, viewerDay } from "../lib/format";
import { thumbnailSize, thumbnailUrl } from "../lib/media";
import type { Selection } from "../lib/selection";
import type { MediaItem } from "../lib/types";
import styles from "./MediaGrid.module.scss";

const GAP = 4;
const LONG_PRESS_MS = 450;
const MOBILE_WIDTH = 600;
const MAX_SCRUBBER_ENTRIES = 24;

interface Group {
  key: string;
  label: string;
  // the scrubber entry this group belongs to
  entry: string;
  items: MediaItem[];
}

interface ScrubberEntry {
  key: string;
  label: string;
}

const spanOf = (item: MediaItem, index: number, leading: boolean, groupSize: number, columns: number): { x: number; y: number } => {
  if (columns < 3) return { x: 1, y: 1 };

  // the first photo of the page is the feature tile
  if (leading && index === 0 && groupSize >= 4) return { x: 2, y: 2 };

  const aspect = item.width > 0 && item.height > 0 ? item.width / item.height : 1;

  if (aspect >= 1.7) return { x: 2, y: 1 };
  if (aspect <= 0.6) return { x: 1, y: 2 };

  return { x: 1, y: 1 };
};

/** The longest edge of a preview that fills a box of the given size without leaving gaps. */
const neededEdge = (box: { width: number; height: number }, aspect: number) => {
  const fitsHeight = aspect >= box.width / box.height;
  const width = fitsHeight ? box.height * aspect : box.width;
  const height = fitsHeight ? box.height : box.width / aspect;

  return Math.max(width, height);
};

const scrollParentOf = (element: HTMLElement): HTMLElement | undefined => {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY;
    if (overflow === "auto" || overflow === "scroll") return parent;
  }

  return undefined;
};

/**
 * Photos laid out on a grid of squares, grouped by day. Panoramas and portraits take two cells and the first photo is a feature tile.
 * A month scrubber on the right (wide screens) jumps through long libraries.
 */
const MediaGrid: Component<{
  items: MediaItem[];
  onOpen: (id: number) => void;
  selection?: Selection;
  density?: "comfortable" | "compact";
  // groups with a heading per day, off for a plain grid
  grouped?: boolean;
  scrubber?: boolean;
  class?: string;
}> = (props) => {
  let root!: HTMLDivElement;
  let scrollParent: HTMLElement | undefined;

  const [width, setWidth] = createSignal(0);
  const [activeEntry, setActiveEntry] = createSignal<string | undefined>();

  const grouped = () => props.grouped !== false;

  const columns = () => {
    const target = width() < MOBILE_WIDTH ? 120 : props.density === "compact" ? 180 : 280;
    return Math.max(3, Math.round(width() / target));
  };

  const cell = () => Math.max(1, (width() - GAP * (columns() - 1)) / columns());

  const groups = createMemo<Group[]>(() => {
    if (!grouped()) return [{ key: "all", label: "", entry: "", items: props.items }];

    const newestYear = props.items.length > 0 ? new Date(props.items[0]!.takenAt).getFullYear() : 0;
    const result: Group[] = [];
    let current: Group | undefined;

    for (const item of props.items) {
      const key = dayKey(item.takenAt);

      if (current?.key !== key) {
        const date = new Date(item.takenAt);
        current = { key, label: dayLabel(item.takenAt), entry: date.getFullYear() === newestYear ? `${date.getFullYear()}-${date.getMonth()}` : String(date.getFullYear()), items: [] };
        result.push(current);
      }

      current.items.push(item);
    }

    return result;
  });

  const scrubberEntries = createMemo<ScrubberEntry[]>(() => {
    if (!grouped() || !props.scrubber) return [];

    const entries: ScrubberEntry[] = [];
    const seen = new Set<string>();

    for (const group of groups()) {
      if (seen.has(group.entry)) continue;
      seen.add(group.entry);

      const timestamp = group.items[0]!.takenAt;
      entries.push({ key: group.entry, label: group.entry.includes("-") ? shortMonth(timestamp) : group.entry });
    }

    return entries.slice(0, MAX_SCRUBBER_ENTRIES);
  });

  const updateActiveEntry = () => {
    if (scrubberEntries().length === 0) return;

    const top = (scrollParent?.getBoundingClientRect().top ?? 0) + 160;
    let active: string | undefined;

    for (const heading of root.querySelectorAll<HTMLElement>("[data-entry]")) {
      if (heading.getBoundingClientRect().top > top) break;
      active = heading.dataset.entry;
    }

    setActiveEntry(active ?? scrubberEntries()[0]?.key);
  };

  onMount(() => {
    setWidth(root.clientWidth);

    const observer = new ResizeObserver(() => setWidth(root.clientWidth));
    observer.observe(root);

    scrollParent = scrollParentOf(root);

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveEntry);
    };

    scrollParent?.addEventListener("scroll", onScroll, { passive: true });

    onCleanup(() => {
      observer.disconnect();
      scrollParent?.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    });
  });

  createEffect(on(groups, () => queueMicrotask(updateActiveEntry)));

  const jumpTo = (key: string) => {
    root.querySelector<HTMLElement>(`[data-entry="${CSS.escape(key)}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  let longPressTimer: ReturnType<typeof setTimeout> | undefined;
  let longPressed = false;

  const cancelLongPress = () => clearTimeout(longPressTimer);

  onCleanup(cancelLongPress);

  const Tile: Component<{ item: MediaItem; index: number; leading: boolean; groupSize: number }> = (tile) => {
    const span = () => spanOf(tile.item, tile.index, tile.leading, tile.groupSize, columns());
    const selected = () => props.selection?.has(tile.item.id) ?? false;

    const edge = () => {
      const box = { width: span().x * cell() + (span().x - 1) * GAP, height: span().y * cell() + (span().y - 1) * GAP };
      const aspect = tile.item.width > 0 && tile.item.height > 0 ? tile.item.width / tile.item.height : 1;
      return thumbnailSize(neededEdge(box, aspect));
    };

    return (
      <button
        type="button"
        class={styles.tile}
        data-selected={selected()}
        data-selecting={props.selection?.active() ?? false}
        data-kind={tile.item.kind}
        style={{ "grid-column": `span ${span().x}`, "grid-row": `span ${span().y}` }}
        aria-label={`${tile.item.kind === "video" ? "Video" : "Photo"} from ${viewerDay(tile.item.takenAt, true)}`}
        aria-pressed={props.selection?.active() ? selected() : undefined}
        onClick={() => {
          if (longPressed) {
            longPressed = false;
            return;
          }

          if (props.selection?.active()) props.selection.toggle(tile.item.id);
          else props.onOpen(tile.item.id);
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch" || !props.selection) return;

          longPressed = false;
          cancelLongPress();
          longPressTimer = setTimeout(() => {
            longPressed = true;
            props.selection?.toggle(tile.item.id);
          }, LONG_PRESS_MS);
        }}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerMove={(event) => {
          // a drag is a scroll, not a press
          if (event.pointerType === "touch" && (Math.abs(event.movementX) > 2 || Math.abs(event.movementY) > 2)) cancelLongPress();
        }}
        onContextMenu={(event) => {
          // touch devices open a menu on long press, which would fight with starting a selection
          if (props.selection) event.preventDefault();
        }}
      >
        <Show
          when={tile.item.kind === "image"}
          fallback={
            <div class={styles.video}>
              <UKIcon class={styles.videoIcon}>{PLAY_CIRCLE_FILL_ICON}</UKIcon>
            </div>
          }
        >
          <img
            class={styles.image}
            src={thumbnailUrl(tile.item.id, tile.item.version, edge())}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={(event) => {
              event.currentTarget.dataset.loaded = "true";
            }}
            onError={(event) => {
              event.currentTarget.dataset.failed = "true";
            }}
          />
          <UKIcon class={styles.broken}>{BROKEN_IMAGE_ICON}</UKIcon>
        </Show>

        <Show when={tile.item.kind === "video"}>
          <UKIcon class={styles.videoBadge}>{PLAY_CIRCLE_FILL_ICON}</UKIcon>
        </Show>

        <Show when={props.selection}>
          {/* a span rather than a button: it sits inside of the tile's button, which already takes the click when selecting */}
          <span
            class={styles.check}
            role="checkbox"
            aria-checked={selected()}
            aria-label="Select"
            onClick={(event) => {
              event.stopPropagation();
              props.selection?.toggle(tile.item.id);
            }}
          >
            <UKIcon>{selected() ? CHECK_CIRCLE_FILL_ICON : RADIO_BUTTON_UNCHECKED_ICON}</UKIcon>
          </span>
        </Show>
      </button>
    );
  };

  return (
    <div class={clsx(styles.layout, props.class)}>
      <div ref={root} class={styles.root} style={{ "--columns": columns(), "--cell": `${cell()}px`, "--gap": `${GAP}px` }}>
        <For each={groups()}>
          {(group, groupIndex) => (
            <section class={styles.group}>
              <Show when={grouped()}>
                <UKText role="title" size="m" class={styles.heading}>
                  <span data-entry={group.entry}>{group.label}</span>
                </UKText>
              </Show>
              <div class={styles.grid}>
                <For each={group.items}>{(item, index) => <Tile item={item} index={index()} leading={groupIndex() === 0} groupSize={group.items.length} />}</For>
              </div>
            </section>
          )}
        </For>
      </div>

      <Show when={scrubberEntries().length > 1}>
        <nav class={styles.scrubber} aria-label="Jump to a date">
          <For each={scrubberEntries()}>
            {(entry, index) => (
              <>
                <Show when={index() > 0}>
                  <span class={styles.dot} aria-hidden="true" />
                </Show>
                <button type="button" class={styles.scrubberEntry} data-active={activeEntry() === entry.key} onClick={() => jumpTo(entry.key)}>
                  {entry.label}
                </button>
              </>
            )}
          </For>
        </nav>
      </Show>
    </div>
  );
};

export default MediaGrid;
