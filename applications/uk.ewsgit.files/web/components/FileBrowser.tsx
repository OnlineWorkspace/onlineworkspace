import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import ARROW_BACK_ICON from "@material-symbols/svg-700/outlined/arrow_back.svg";
import ARROW_DOWNWARD_ICON from "@material-symbols/svg-700/outlined/arrow_downward.svg";
import ARROW_UPWARD_ICON from "@material-symbols/svg-700/outlined/arrow_upward.svg";
import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import CLOSE_ICON from "@material-symbols/svg-700/outlined/close.svg";
import CONTENT_COPY_ICON from "@material-symbols/svg-700/outlined/content_copy.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DRIVE_FILE_MOVE_ICON from "@material-symbols/svg-700/outlined/drive_file_move.svg";
import FILTER_LIST_ICON from "@material-symbols/svg-700/outlined/filter_list.svg";
import GRID_VIEW_ICON from "@material-symbols/svg-700/outlined/grid_view.svg";
import INFO_ICON from "@material-symbols/svg-700/outlined/info.svg";
import MORE_VERT_ICON from "@material-symbols/svg-700/outlined/more_vert.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import SELECT_ALL_ICON from "@material-symbols/svg-700/outlined/select_all.svg";
import SHARE_ICON from "@material-symbols/svg-700/outlined/share.svg";
import VIEW_LIST_ICON from "@material-symbols/svg-700/outlined/view_list.svg";
import UKChip from "@ewsgit/uikit-solid/src/components/chip/UKChip.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKFloatingActionButton from "@ewsgit/uikit-solid/src/components/floatingActionButton/UKFloatingActionButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKMenu, { type MenuItem } from "@ewsgit/uikit-solid/src/components/menu/UKMenu.tsx";
import UKSearchBar from "@ewsgit/uikit-solid/src/components/searchBar/UKSearchBar.tsx";
import UKSegmentedButton from "@ewsgit/uikit-solid/src/components/segmentedButton/UKSegmentedButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import { useNavigate } from "@solidjs/router";
import clsx from "clsx";
import { type Accessor, type Component, createEffect, createSignal, For, type JSX, on, onCleanup, onMount, Show } from "solid-js";
import { useFiles } from "../lib/context";
import { filterFiles, type Filters, hasActiveFilters, SIZE_FILTERS, sortEntries, TYPE_FILTERS, type TypeFilter, type SizeFilter } from "../lib/filters";
import { formatBytes, formatModified, pluralise } from "../lib/format";
import { routes } from "../lib/routes";
import type { Entry, SortKey } from "../lib/types";
import Breadcrumbs from "./Breadcrumbs";
import DetailsPane from "./DetailsPane";
import FileBadge from "./FileBadge";
import Thumbnail from "./Thumbnail";
import styles from "./FileBrowser.module.scss";

export interface FileBrowserProps {
  // the headline on mobile, and on desktop whenever there are no breadcrumbs
  title: string;
  entries: Entry[] | undefined;
  loading: boolean;
  error?: string;
  emptyMessage: string;
  breadcrumbs?: { name: string; path: string }[];
  // set when showing the contents of a real folder: enables drag & drop uploads and the "New" button
  directory?: string;
  search?: { value: Accessor<string>; onChange: (value: string) => void; placeholder: string };
  onBack?: () => void;
  showFilters?: boolean;
  // show where each item lives, for listings that mix folders (recent, starred, search)
  showLocation?: boolean;
}

type ViewMode = "list" | "grid";

const SORT_LABELS: Record<SortKey, string> = { name: "Name", modified: "Modified", size: "Size" };
const VIEW_STORAGE_KEY = "uk.ewsgit.files:view";
const LONG_PRESS_MS = 450;

const readStoredView = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
};

const locationOf = (path: string) => {
  const segments = path.split("/").filter(Boolean).slice(0, -1);
  return segments.length === 0 ? "Home" : segments.join(" / ");
};

const FileBrowser: Component<FileBrowserProps> = (props) => {
  const files = useFiles();
  const { actions } = files;
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [view, setViewSignal] = createSignal<ViewMode>(readStoredView());
  const [sortKey, setSortKey] = createSignal<SortKey>("name");
  const [descending, setDescending] = createSignal(false);
  const [filters, setFilters] = createSignal<Filters>({ recentOnly: false });
  const [selected, setSelected] = createSignal<ReadonlySet<string>>(new Set());
  const [anchor, setAnchor] = createSignal<string | undefined>();
  const [detailsOpen, setDetailsOpen] = createSignal(true);
  const [searching, setSearching] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);
  const [sortMenu, setSortMenu] = createSignal<{ x: number; y: number; align: "right" } | false>(false);

  const setView = (mode: ViewMode) => {
    setViewSignal(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // the preference just won't be remembered
    }
  };

  // ---- derived listings ----

  const everything = () => props.entries ?? [];
  const folders = () => sortEntries(everything().filter((entry) => entry.kind === "directory"), sortKey() === "size" ? "name" : sortKey(), descending());
  const visibleFiles = () => sortEntries(filterFiles(everything().filter((entry) => entry.kind === "file"), filters()), sortKey(), descending());
  const ordered = () => [...folders(), ...visibleFiles()];
  const selectedEntries = () => ordered().filter((entry) => selected().has(entry.path));
  const selectionMode = () => isMobile() && selected().size > 0;

  // ---- selection ----

  const clearSelection = () => {
    setSelected(new Set<string>());
    setAnchor(undefined);
  };

  const toggle = (entry: Entry) => {
    const next = new Set(selected());
    if (!next.delete(entry.path)) next.add(entry.path);
    setSelected(next);
    setAnchor(entry.path);
  };

  const selectOnly = (entry: Entry) => {
    setSelected(new Set([entry.path]));
    setAnchor(entry.path);
  };

  const selectRange = (entry: Entry) => {
    const list = ordered();
    const from = list.findIndex((candidate) => candidate.path === anchor());
    const to = list.findIndex((candidate) => candidate.path === entry.path);

    if (from === -1 || to === -1) return selectOnly(entry);

    setSelected(new Set(list.slice(Math.min(from, to), Math.max(from, to) + 1).map((candidate) => candidate.path)));
  };

  const selectAll = () => setSelected(new Set(ordered().map((entry) => entry.path)));

  // keep the selection to items that still exist after a reload
  createEffect(
    on(
      everything,
      (list) => {
        const paths = new Set(list.map((entry) => entry.path));
        setSelected((previous) => new Set([...previous].filter((path) => paths.has(path))));
      },
      { defer: true },
    ),
  );

  createEffect(on(() => [props.directory, props.search?.value()], clearSelection, { defer: true }));

  createEffect(() => files.setCurrentDirectory(props.directory ?? "/"));

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      if (event.key === "Escape") clearSelection();
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectAll();
      } else if (event.key === "Delete" && selected().size > 0) actions.trash(selectedEntries());
    };

    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  // ---- interaction ----

  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let longPressed = false;

  const cancelPress = () => clearTimeout(pressTimer);

  const handlersFor = (entry: Entry) => ({
    onPointerDown: (event: PointerEvent) => {
      if (!isMobile() || event.pointerType === "mouse") return;
      longPressed = false;
      pressTimer = setTimeout(() => {
        longPressed = true;
        toggle(entry);
        navigator.vibrate?.(10);
      }, LONG_PRESS_MS);
    },
    onPointerUp: cancelPress,
    onPointerLeave: cancelPress,
    onPointerCancel: cancelPress,
    onClick: (event: MouseEvent) => {
      if (longPressed) {
        longPressed = false;
        return;
      }

      if (isMobile()) {
        if (selectionMode()) toggle(entry);
        else actions.open(entry);
      } else if (event.ctrlKey || event.metaKey) toggle(entry);
      else if (event.shiftKey) selectRange(entry);
      else selectOnly(entry);
    },
    onDblClick: () => {
      if (!isMobile()) actions.open(entry);
    },
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      if (isMobile()) return;

      if (!selected().has(entry.path)) selectOnly(entry);
      actions.openEntryMenu(selectedEntries(), event.clientX, event.clientY);
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter") actions.open(entry);
      else if (event.key === " ") {
        event.preventDefault();
        toggle(entry);
      }
    },
  });

  const openKebab = (entry: Entry, event: MouseEvent & { currentTarget: HTMLElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    actions.openEntryMenu([entry], rect.left - 200, rect.bottom);
  };

  const openSortMenu = (event: MouseEvent & { currentTarget: HTMLElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSortMenu({ x: Math.max(8, Math.min(rect.left, window.innerWidth - 220)), y: Math.min(rect.bottom, window.innerHeight - 240), align: "right" });
  };

  const sortMenuItems = (): MenuItem[] => [
    ...(["name", "modified", "size"] as SortKey[]).map((key) => ({ type: "button" as const, label: SORT_LABELS[key], selected: sortKey() === key, onClick: () => void setSortKey(key) })),
    { type: "divider" },
    { type: "button", label: "Descending", leadingIcon: descending() ? CHECK_ICON : undefined, onClick: () => void setDescending(!descending()) },
  ];

  const toggleSort = (key: SortKey) => {
    if (sortKey() === key) setDescending(!descending());
    else {
      setSortKey(key);
      setDescending(false);
    }
  };

  const dropHandlers = {
    onDragOver: (event: DragEvent) => {
      if (props.directory === undefined || !event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: (event: DragEvent) => {
      if (event.currentTarget === event.target) setDragging(false);
    },
    onDrop: (event: DragEvent) => {
      setDragging(false);
      if (props.directory === undefined || !event.dataTransfer?.files.length) return;
      event.preventDefault();
      void actions.uploadFiles([...event.dataTransfer.files], props.directory);
    },
  };

  // ---- shared pieces ----

  const FilterChips = () => (
    <div class={styles.chips}>
      <UKChip
        type="filter_dropdown"
        placeholderText="Type"
        selectedId={filters().type ?? ""}
        items={[{ id: "", label: "Any type" }, ...TYPE_FILTERS]}
        onSelectItem={(id) => setFilters({ ...filters(), type: (id || undefined) as TypeFilter | undefined })}
      />
      <UKChip
        type="filter_deselectable"
        leading={filters().recentOnly ? { type: "icon", value: CHECK_ICON } : undefined}
        isSelected={filters().recentOnly}
        select={() => setFilters({ ...filters(), recentOnly: true })}
        deselect={() => setFilters({ ...filters(), recentOnly: false })}
      >
        Last 30 days
      </UKChip>
      <UKChip
        type="filter_dropdown"
        placeholderText="Size"
        selectedId={filters().size ?? ""}
        items={[{ id: "", label: "Any size" }, ...SIZE_FILTERS]}
        onSelectItem={(id) => setFilters({ ...filters(), size: (id || undefined) as SizeFilter | undefined })}
      />
    </div>
  );

  const Status = () => (
    <>
      <Show when={props.loading && !props.entries}>
        <div class={styles.status}>
          <UKCircularProgressIndicator />
        </div>
      </Show>
      <Show when={props.error}>
        <div class={styles.status}>
          <UKText role="body" size="l" align="center">
            {props.error}
          </UKText>
        </div>
      </Show>
      <Show when={!props.loading && !props.error && props.entries && ordered().length === 0}>
        <div class={styles.status}>
          <UKText role="body" size="l" align="center" class={styles.muted}>
            {everything().length > 0 && hasActiveFilters(filters()) ? "Nothing matches the current filters" : props.emptyMessage}
          </UKText>
        </div>
      </Show>
    </>
  );

  const subtitle = (entry: Entry, forMobile: boolean) => {
    if (entry.kind === "directory") return pluralise(entry.itemCount ?? 0, "item");
    if (forMobile) return `${formatModified(entry.modified)} · ${formatBytes(entry.size)}`;
    return props.showLocation ? `${entry.typeLabel} · ${locationOf(entry.path)}` : entry.typeLabel;
  };

  const Kebab = (kebab: { entry: Entry }) => <UKIconButton color="standard" icon={MORE_VERT_ICON} alt={`More actions for ${kebab.entry.name}`} onClick={(event) => openKebab(kebab.entry, event)} />;

  const FolderCards = (): JSX.Element => (
    <Show when={folders().length > 0}>
      <UKText role="title" size="s" class={styles.sectionLabel}>
        Folders
      </UKText>
      <div class={styles.folderGrid}>
        <For each={folders()}>
          {(folder) => (
            <div class={styles.folderCard} role="button" tabindex="0" data-selected={selected().has(folder.path)} {...handlersFor(folder)}>
              <FileBadge entry={folder} size="s" class={styles.folderBadge} />
              <div class={styles.cardText}>
                <UKText role="label" size="l" class={styles.ellipsis}>
                  {folder.name}
                </UKText>
                <UKText role="body" size="s" class={clsx(styles.muted, styles.ellipsis)}>
                  {props.showLocation ? locationOf(folder.path) : subtitle(folder, false)}
                </UKText>
              </div>
            </div>
          )}
        </For>
      </div>
    </Show>
  );

  const FileGrid = (): JSX.Element => (
    <div class={styles.fileGrid}>
      <For each={visibleFiles()}>
        {(file) => (
          <div class={styles.fileTile} role="button" tabindex="0" data-selected={selected().has(file.path)} {...handlersFor(file)}>
            <Thumbnail entry={file} size="l" pixels={200} class={styles.tileBadge} />
            <UKText role="label" size="l" class={styles.ellipsis}>
              {file.name}
            </UKText>
            <UKText role="body" size="s" class={clsx(styles.muted, styles.ellipsis)}>
              {formatModified(file.modified)} · {formatBytes(file.size)}
            </UKText>
          </div>
        )}
      </For>
    </div>
  );

  const SortHeader = (header: { sort: SortKey; children: string }) => (
    <button type="button" class={styles.headerCell} onClick={() => toggleSort(header.sort)}>
      {header.children}
      <Show when={sortKey() === header.sort}>
        <UKIcon class={styles.sortArrow}>{descending() ? ARROW_DOWNWARD_ICON : ARROW_UPWARD_ICON}</UKIcon>
      </Show>
    </button>
  );

  // ---- desktop ----

  const Desktop = () => (
    <div class={styles.desktop} {...dropHandlers}>
      <div class={styles.main} onClick={(event) => event.target === event.currentTarget && clearSelection()}>
        <div class={styles.toolbar}>
          <Show when={props.search}>{(search) => <UKSearchBar class={styles.searchBar} value={search().value} placeholder={search().placeholder} onValueChange={search().onChange} leadingIcon={SEARCH_ICON} />}</Show>
          <div class={styles.toolbarEnd}>
            <UKSegmentedButton
              selectedId={view}
              onSelect={(id) => setView(id as ViewMode)}
              items={[
                { id: "list", icon: VIEW_LIST_ICON, accessibleLabel: "List view" },
                { id: "grid", icon: GRID_VIEW_ICON, accessibleLabel: "Grid view" },
              ]}
            />
            <UKIconButton color="standard" icon={INFO_ICON} alt="Toggle details" onClick={() => setDetailsOpen(!detailsOpen())} />
          </div>
        </div>

        <div class={styles.pathRow}>
          <Show when={props.breadcrumbs} fallback={<UKText role="headline" size="s">{props.title}</UKText>}>
            {(crumbs) => <Breadcrumbs crumbs={crumbs()} onNavigate={(path) => navigate(routes.browse(path))} />}
          </Show>
          <button type="button" class={styles.sortButton} onClick={openSortMenu}>
            <UKIcon class={styles.sortIcon}>{FILTER_LIST_ICON}</UKIcon>
            <UKText role="label" size="l">
              {SORT_LABELS[sortKey()]}
            </UKText>
          </button>
        </div>

        <Show when={props.showFilters}>
          <FilterChips />
        </Show>

        <Status />
        <FolderCards />

        <Show when={visibleFiles().length > 0}>
          <UKText role="title" size="s" class={styles.sectionLabel}>
            Files
          </UKText>
          <Show when={view() === "list"} fallback={<FileGrid />}>
            <div class={styles.table} role="table">
              <div class={styles.tableHeader} role="row">
                <SortHeader sort="name">NAME</SortHeader>
                <SortHeader sort="modified">MODIFIED</SortHeader>
                <SortHeader sort="size">SIZE</SortHeader>
                <span />
              </div>
              <For each={visibleFiles()}>
                {(file) => (
                  <div class={styles.tableRow} role="row" tabindex="0" data-selected={selected().has(file.path)} {...handlersFor(file)}>
                    <div class={styles.nameCell}>
                      <Thumbnail entry={file} size="s" pixels={36} />
                      <div class={styles.cardText}>
                        <UKText role="label" size="l" class={styles.ellipsis}>
                          {file.name}
                        </UKText>
                        <UKText role="body" size="s" class={clsx(styles.muted, styles.ellipsis)}>
                          {subtitle(file, false)}
                        </UKText>
                      </div>
                    </div>
                    <span class={styles.cell}>{formatModified(file.modified, true)}</span>
                    <span class={styles.cell}>{formatBytes(file.size)}</span>
                    <Kebab entry={file} />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>

        <Show when={dragging()}>
          <div class={styles.dropOverlay}>
            <UKText role="title" size="l">Drop files to upload</UKText>
          </div>
        </Show>
      </div>

      <Show when={detailsOpen() && selectedEntries().length > 0}>
        <DetailsPane entries={selectedEntries()} />
      </Show>
    </div>
  );

  // ---- mobile ----

  const MobileRows = (): JSX.Element => (
    <div class={styles.mobileList}>
      <For each={visibleFiles()}>
        {(file) => (
          <div class={styles.mobileRow} role="button" tabindex="0" data-selected={selected().has(file.path)} {...handlersFor(file)}>
            <Show when={selected().has(file.path)} fallback={<Thumbnail entry={file} size="s" pixels={36} />}>
              <div class={styles.selectedCheck}>
                <UKIcon>{CHECK_ICON}</UKIcon>
              </div>
            </Show>
            <div class={styles.cardText}>
              <UKText role="body" size="l" class={styles.ellipsis}>
                {file.name}
              </UKText>
              <UKText role="body" size="m" class={clsx(styles.muted, styles.ellipsis)}>
                {props.showLocation ? `${formatModified(file.modified)} · ${locationOf(file.path)}` : subtitle(file, true)}
              </UKText>
            </div>
            <Show when={!selectionMode()}>
              <Kebab entry={file} />
            </Show>
          </div>
        )}
      </For>
    </div>
  );

  const MobileAppBar = () => (
    <Show
      when={!searching() || !props.search}
      fallback={
        <div class={styles.mobileSearch}>
          <UKSearchBar
            value={props.search!.value}
            placeholder={props.search!.placeholder}
            onValueChange={props.search!.onChange}
            leadingButton={{
              icon: ARROW_BACK_ICON,
              accessibleLabel: "Close search",
              onClick: () => {
                props.search!.onChange("");
                setSearching(false);
              },
            }}
          />
        </div>
      }
    >
      <Show
        when={!selectionMode()}
        fallback={
          <UKTopAppBar
            type="small"
            headline={`${selected().size} selected`}
            leadingButton={{ icon: CLOSE_ICON, accessibleLabel: "Clear selection", onClick: clearSelection }}
            trailingElements={
              <>
                <UKIconButton color="standard" icon={SELECT_ALL_ICON} alt="Select all" onClick={selectAll} />
                <UKIconButton color="standard" icon={MORE_VERT_ICON} alt="More actions" onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  actions.openEntryMenu(selectedEntries(), rect.left - 200, rect.bottom);
                }} />
              </>
            }
          />
        }
      >
        <UKTopAppBar
          type="small"
          headline={props.title}
          leadingButton={props.onBack ? { icon: ARROW_BACK_ICON, accessibleLabel: "Back", onClick: props.onBack } : undefined}
          trailingElements={
            <>
              <Show when={props.search}>
                <UKIconButton color="standard" icon={SEARCH_ICON} alt="Search" onClick={() => setSearching(true)} />
              </Show>
              <UKIconButton color="standard" icon={view() === "list" ? GRID_VIEW_ICON : VIEW_LIST_ICON} alt={view() === "list" ? "Grid view" : "List view"} onClick={() => setView(view() === "list" ? "grid" : "list")} />
              <UKIconButton color="standard" icon={MORE_VERT_ICON} alt="Sort options" onClick={openSortMenu} />
            </>
          }
        />
      </Show>
    </Show>
  );

  const Mobile = () => (
    <div class={styles.mobile}>
      <MobileAppBar />
      <Show when={props.breadcrumbs}>
        {(crumbs) => <Breadcrumbs class={styles.mobileCrumbs} crumbs={crumbs()} onNavigate={(path) => navigate(routes.browse(path))} />}
      </Show>
      <Show when={props.showFilters}>
        <FilterChips />
      </Show>
      <Status />
      <FolderCards />
      <Show when={visibleFiles().length > 0}>
        <UKText role="title" size="s" class={styles.sectionLabel}>
          Files
        </UKText>
        <Show when={view() === "list"} fallback={<FileGrid />}>
          <MobileRows />
        </Show>
      </Show>

      <Show when={selectionMode()}>
        <div class={styles.actionBar}>
          <ActionBarButton icon={SHARE_ICON} label="Share" onClick={() => {
            const only = selectedEntries();
            if (only.length === 1 && only[0]!.kind === "file") void actions.share(only[0]!);
            else files.notify("Select a single file to share it");
          }} />
          <ActionBarButton icon={CONTENT_COPY_ICON} label="Copy" onClick={() => actions.moveOrCopy(selectedEntries(), "copy")} />
          <ActionBarButton icon={DRIVE_FILE_MOVE_ICON} label="Move" onClick={() => actions.moveOrCopy(selectedEntries(), "move")} />
          <ActionBarButton icon={DELETE_ICON} label="Delete" onClick={() => actions.trash(selectedEntries())} />
        </div>
      </Show>

      <Show when={props.directory !== undefined && !selectionMode()}>
        <UKFloatingActionButton
          class={styles.fab}
          icon={ADD_ICON}
          alt="New"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            actions.openNewMenu(rect.right - 248, rect.top - 4 * 44 - 32, props.directory);
          }}
        />
      </Show>
    </div>
  );

  return (
    <>
      <Show when={isMobile()} fallback={<Desktop />}>
        <Mobile />
      </Show>
      <UKMenu items={sortMenuItems()} showMenu={sortMenu} closeMenu={() => setSortMenu(false)} />
    </>
  );
};

const ActionBarButton: Component<{ icon: string; label: string; onClick: () => void }> = (props) => (
  <button type="button" class={styles.actionBarButton} onClick={props.onClick}>
    <UKIcon>{props.icon}</UKIcon>
    <UKText role="label" size="m">
      {props.label}
    </UKText>
  </button>
);

export default FileBrowser;
