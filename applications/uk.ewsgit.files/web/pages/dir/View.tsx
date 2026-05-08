import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import FOLDER_LIMITED_ICON from "@material-symbols/svg-700/outlined/folder_limited.svg";
import path from "path-browserify";
import { type Component, createEffect, createSignal, Match, onCleanup, onMount, Suspense, Switch, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { AppContext } from "../../appContext.ts";
import StatusBar from "../../layout/components/StatusBar/StatusBar.tsx";
import type { Task } from "../../layout/components/StatusBar/task.ts";
import ViewMessage from "../../layout/components/ViewMessage/ViewMessage.tsx";
import chunkArray from "../../lib/chunk.ts";
import filesystemInterface, { type UniformResourceLocator } from "../../lib/filesystemInterface.ts";
import DetailsView from "./components/DetailsView/DetailsView.tsx";
import GalleryView from "./components/GalleryView/GalleryView.tsx";
import GridView from "./components/GridView/GridView.tsx";
import { deselectAllItems, selectNextItem, selectPreviousItem } from "./itemSelection.ts";
import styles from "./View.module.scss";
import { ViewContext } from "./viewContext.ts";
import type { ViewItem } from "./viewItem.ts";

export interface ViewState {
  pathUrl: UniformResourceLocator;
  viewItems: ViewItem[];
  selectedItems: string[];
  lastSelectionTime: number;
  lastSelectedItem: string | undefined;
  viewId: number;
  isLoading: boolean;
  isRenaming: string | undefined;
}

const View: Component<{ pathOverride?: UniformResourceLocator; disallowCreation?: boolean; viewId: number }> = (props) => {
  const appContext = useContext(AppContext);
  const [dragSelectRegion, setDragSelectRegion] = createStore<{
    origin?: { x: number; y: number };
    size?: { x: number; y: number };
    transOrigin?: { x: number; y: number };
  }>({
    origin: undefined,
    size: undefined,
  });
  const [errorMessage, setErrorMessage] = createSignal<string | undefined>(undefined);
  const [forceViewItemUpdate, setForceViewItemUpdate] = createSignal<number>(0);
  const [itemViewRef, setItemViewRef] = createSignal<HTMLDivElement | null>(null);
  let selectableItems: Element[] = [];
  let navigationCounter = 0;

  createEffect(async () => {
    if (!appContext?.viewState[props.viewId].pathUrl) {
      appContext?.setViewState(props.viewId, "pathUrl", props.pathOverride || appContext?.userPreferences.homePath);
      return;
    }

    appContext?.userPreferences.viewType;
    appContext?.userPreferences.zoomPercentage;
    forceViewItemUpdate();

    appContext?.setViewState(props.viewId, "isRenaming", undefined);
    appContext?.setViewState(props.viewId, "selectedItems", []);

    navigationCounter++;
    const currentNavigationCount = navigationCounter;

    appContext?.setTasks((tasks) => tasks.filter((t) => t.type !== "view_fetch_items"));
    appContext?.setViewState(props.viewId, "isLoading", true);
    const newItems = await filesystemInterface.readDirectory(appContext?.viewState[props.viewId].pathUrl || "remote:/");

    if (currentNavigationCount !== navigationCounter) return;

    if (newItems.status === "ok") {
      setErrorMessage(undefined);

      appContext?.setViewState(props.viewId, "selectedItems", []);
      appContext?.setViewState(props.viewId, "lastSelectionTime", -1);
      appContext?.setViewState(props.viewId, "viewItems", []);

      const task: Task = {
        parent: "view0",
        id: crypto.randomUUID(),
        max: newItems.items.length,
        current: 0,
        message: `Fetched %c of %m items`,
        type: "view_fetch_items",
      };

      appContext?.setTasks((tasks) => [...tasks, task]);

      const CHUNK_SIZE = filesystemInterface.getViewEntryBatchSize(appContext?.viewState[props.viewId].pathUrl);

      for (const itemPathGroup of chunkArray(newItems.items, CHUNK_SIZE)) {
        if (currentNavigationCount !== navigationCounter) {
          return;
        }
        await new Promise<void>(async (resolve) => {
          const itemGroupResponsePromises = [];
          for (const itemPath of itemPathGroup) {
            itemGroupResponsePromises.push(
              filesystemInterface
                .getViewEntry(
                  itemPath as UniformResourceLocator,
                  Math.floor(appContext!.userPreferences.zoomPercentage * (appContext!.userPreferences.viewType === "details" ? 32 : 128)),
                )
                .then((viewEntry) => {
                  if (viewEntry.status === "ok") {
                    return viewEntry;
                  }
                }),
            );
          }

          const itemGroupResponseResolvedPromises = await Promise.all(itemGroupResponsePromises);
          if (currentNavigationCount !== navigationCounter) {
            resolve();
            return;
          }
          appContext?.setViewState(props.viewId, "viewItems", [
            ...appContext.viewState[props.viewId].viewItems,
            ...itemGroupResponseResolvedPromises.map((ig) => ig?.data || undefined).filter((ig) => ig !== undefined),
          ]);

          if (!(task.current + CHUNK_SIZE > task.max)) {
            task.current += CHUNK_SIZE;
          } else {
            task.current = task.max;
          }

          appContext?.setTasks((tasks) => {
            return tasks.map((t) => {
              if (task.id === t.id) {
                return task;
              }

              return t;
            });
          });

          resolve();
        });
      }

      appContext?.setViewState(props.viewId, "isLoading", false);
    } else {
      setErrorMessage(newItems.status);
    }
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab" || e.key === " " || appContext?.globalState.disableShortcuts) return;

    e.preventDefault();

    switch (e.key) {
      case "F2": {
        appContext?.setViewState(props.viewId, "isRenaming", appContext.viewState[props.viewId].lastSelectedItem);
        break;
      }
      case " ": {
        if (appContext?.viewState[props.viewId].lastSelectedItem === undefined) return;

        if (appContext?.globalState.showPreview === false) {
          appContext?.setGlobalState("showPreview", true);
        } else {
          appContext?.setGlobalState("showPreview", false);
        }
        break;
      }
      case "Escape": {
        appContext?.setGlobalState("showPreview", false);
        appContext?.setViewState(props.viewId, "isRenaming", undefined);
        appContext?.setViewState(props.viewId, "selectedItems", []);
        appContext?.setGlobalState("disableShortcuts", false);
        break;
      }
      case "Enter": {
        if (appContext?.viewState[props.viewId].lastSelectedItem) {
          const item = appContext?.viewState[props.viewId].viewItems.find((i) => i.path === appContext?.viewState[props.viewId].lastSelectedItem);

          if (!item) return;

          if (item.type === "file") {
            filesystemInterface.openInDefaultApplication(item.path as UniformResourceLocator);
            return;
          }

          appContext?.setViewState(props.viewId, "pathUrl", item.path as UniformResourceLocator);
        }
        deselectAllItems(appContext!, props.viewId);
        break;
      }
      case "ArrowLeft": {
        if (e.altKey) {
          window.history.back();
          return;
        }

        selectPreviousItem(appContext!, props.viewId);
        break;
      }
      case "ArrowRight": {
        if (e.altKey) {
          window.history.forward();
          return;
        }

        selectNextItem(appContext!, props.viewId);
        break;
      }
      case "ArrowUp": {
        selectPreviousItem(appContext!, props.viewId);
        break;
      }
      case "ArrowDown": {
        selectNextItem(appContext!, props.viewId);
        break;
      }
      case "F5": {
        setForceViewItemUpdate((p) => p + 1);
        break;
      }
      case "r": {
        if (e.ctrlKey) {
          setForceViewItemUpdate((p) => p + 1);
        }
        break;
      }
    }
  };

  onMount(async () => {
    window.addEventListener("keydown", onKeyDown);

    function mouseMove(e: MouseEvent) {
      const bounds = itemViewRef()!.getBoundingClientRect();

      const mouseX = Math.min(Math.max(e.clientX, bounds.left), bounds.right);
      const mouseY = Math.min(Math.max(e.clientY, bounds.top), bounds.bottom);

      const left = Math.min(dragSelectRegion.origin!.x, mouseX);
      const top = Math.min(dragSelectRegion.origin!.y, mouseY);
      const width = Math.abs(mouseX - dragSelectRegion.origin!.x);
      const height = Math.abs(mouseY - dragSelectRegion.origin!.y);

      setDragSelectRegion("transOrigin", { x: left, y: top });
      setDragSelectRegion("size", { x: width, y: height });

      const boxRight = left + width;
      const boxBottom = top + height;

      const newlySelected: string[] = [];
      for (const item of selectableItems) {
        const itemRect = item.getBoundingClientRect();
        const path = item.getAttribute("data-fs-item-path");

        const isIntersecting = !(itemRect.left > boxRight || itemRect.right < left || itemRect.top > boxBottom || itemRect.bottom < top);

        if (isIntersecting && path) newlySelected.push(path);
      }

      appContext?.setViewState(props.viewId, "selectedItems", newlySelected);
    }

    function mouseUp() {
      document.body.style.userSelect = "unset";
      setDragSelectRegion("origin", undefined);
      setDragSelectRegion("size", undefined);
      setDragSelectRegion("transOrigin", undefined);
      document.removeEventListener("mouseup", mouseUp);
      document.removeEventListener("mousemove", mouseMove);
    }

    createEffect(() => {
      function mouseDown() {
        window.addEventListener("mouseup", mouseUp);
        window.addEventListener("mousemove", mouseMove);
      }

      itemViewRef()?.addEventListener("mousedown", mouseDown);
    });

    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("mousemove", mouseMove);
    });
  });

  return (
    <Suspense>
      <ViewContext.Provider value={{ viewId: props.viewId }}>
        <div class={styles.root} onFocusIn={() => appContext?.setGlobalState("activeViewId", props.viewId)}>
          {errorMessage() ? (
            <ViewMessage icon={ERROR_ICON} title={"An error has occurred"} message={errorMessage() || "Missing Error Message?"}></ViewMessage>
          ) : appContext!.viewState[props.viewId].viewItems.length === 0 && !appContext!.viewState[props.viewId].isLoading ? (
            <ViewMessage
              icon={FOLDER_LIMITED_ICON}
              title={"Nothing Here."}
              message="You have no files"
              actions={
                props.disallowCreation
                  ? []
                  : [
                      {
                        color: "filled",
                        label: "Create new File",
                        onClick() {
                          // TODO: create a new file
                          // Do nothing Currently
                        },
                      },
                      {
                        color: "filled",
                        label: "Create new Folder",
                        async onClick() {
                          const resolvedPath = filesystemInterface.urlToPath(appContext?.viewState[props.viewId].pathUrl || "remote:/");

                          if (resolvedPath.type === "invalid") throw "Error resolving searchParams path";

                          const joinedPath = path.join(resolvedPath.path, "Untitled Folder");

                          await filesystemInterface.createDirectory(`${resolvedPath.type}:${joinedPath}`);
                          setForceViewItemUpdate((pv) => pv + 1);
                        },
                      },
                    ]
              }
            />
          ) : (
            <>
              {/** biome-ignore lint/a11y/noStaticElementInteractions: button functionality not required */}
              <div
                class={styles.itemView}
                ref={setItemViewRef}
                onMouseDown={(downEvent) => {
                  if (appContext?.userPreferences.viewType === "gallery") return;

                  const target = downEvent.target as HTMLElement;
                  const itemPath = target.closest("[data-fs-item-path]")?.getAttribute("data-fs-item-path");
                  const currentSelected = appContext?.viewState[props.viewId].selectedItems || [];

                  if (itemPath) {
                    const isSelected = currentSelected.includes(itemPath);
                    const newSelection = isSelected ? currentSelected.filter((path) => path !== itemPath) : [...currentSelected, itemPath];

                    appContext?.setViewState(props.viewId, "selectedItems", newSelection);
                  } else {
                    deselectAllItems(appContext!, props.viewId);
                  }

                  const originX = downEvent.clientX;
                  const originY = downEvent.clientY;

                  document.body.style.userSelect = "none";
                  setDragSelectRegion("origin", { x: originX, y: originY });

                  const currentTarget = downEvent.currentTarget as HTMLDivElement;
                  selectableItems = Array.from(currentTarget.querySelectorAll("[data-fs-item-path]"));
                }}
              >
                <Switch>
                  <Match when={appContext?.userPreferences.viewType === "grid"}>
                    <GridView />
                  </Match>
                  <Match when={appContext?.userPreferences.viewType === "details"}>
                    <DetailsView />
                  </Match>
                  <Match when={appContext?.userPreferences.viewType === "gallery"}>
                    <GalleryView />
                  </Match>
                </Switch>
                {dragSelectRegion.transOrigin !== undefined ? (
                  <div
                    class={styles.dragSelectRegion}
                    style={{
                      left: `${dragSelectRegion.transOrigin!.x}px`,
                      top: `${dragSelectRegion.transOrigin!.y}px`,
                      width: `${dragSelectRegion.size?.x}px`,
                      height: `${dragSelectRegion.size?.y}px`,
                    }}
                  />
                ) : null}
              </div>
            </>
          )}
          <StatusBar />
        </div>
      </ViewContext.Provider>
    </Suspense>
  );
};

export default View;
