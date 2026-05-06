import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import FOLDER_LIMITED_ICON from "@material-symbols/svg-700/outlined/folder_limited.svg";
import { useSearchParams } from "@solidjs/router";
import path from "path-browserify";
import { type Component, createEffect, createSignal, Match, onCleanup, onMount, Suspense, Switch, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import type { Task } from "../../App.tsx";
import { AppContext } from "../../appContext.ts";
import ViewMessage from "../../layout/components/ViewMessage/ViewMessage.tsx";
import chunkArray from "../../lib/chunk.ts";
import filesystemInterface, { type UniformResourceLocator } from "../../lib/filesystemInterface.ts";
import DetailsView from "./components/DetailsView/DetailsView.tsx";
import GalleryView from "./components/GalleryView/GalleryView.tsx";
import GridView from "./components/GridView/GridView.tsx";
import { deselectAllItems, selectNextItem, selectPreviousItem } from "./itemSelection.ts";
import styles from "./View.module.scss";

const View: Component<{ pathOverride?: string }> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams<{ path?: UniformResourceLocator }>();
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
  let navigationCounter = 0;

  createEffect(async () => {
    if (!searchParams.path) {
      setSearchParams({ path: props.pathOverride || appContext?.userPreferences.homePath });
      return;
    }

    appContext?.userPreferences.viewType;
    appContext?.userPreferences.zoomPercentage;
    forceViewItemUpdate();

    appContext?.setViewState("isRenaming", undefined);
    appContext?.setViewState("selectedItems", []);

    navigationCounter++;
    const currentNavigationCount = navigationCounter;

    appContext?.setTasks((tasks) => tasks.filter((t) => t.type !== "view_fetch_items"));
    appContext?.setViewState("isLoading", true);
    const newItems = await filesystemInterface.readDirectory(searchParams.path || "remote:/");

    if (currentNavigationCount !== navigationCounter) return;

    if (newItems.status === "ok") {
      setErrorMessage(undefined);

      appContext?.setViewState("selectedItems", []);
      appContext?.setViewState("lastSelectionTime", -1);
      appContext?.setViewState("viewItems", []);

      const task: Task = {
        parent: "view0",
        id: crypto.randomUUID(),
        max: newItems.items.length,
        current: 0,
        message: `Fetched %c of %m items`,
        type: "view_fetch_items",
      };

      appContext?.setTasks((tasks) => [...tasks, task]);

      const CHUNK_SIZE = filesystemInterface.getViewEntryBatchSize(searchParams.path);

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
          appContext?.setViewState("viewItems", [
            ...appContext.viewState.viewItems,
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

      appContext?.setViewState("isLoading", false);
    } else {
      setErrorMessage(newItems.status);
    }
  });

  const onKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();

    if (e.key !== "Escape" && appContext?.globalState.disableShortcuts) return;

    switch (e.key) {
      case "F2": {
        appContext?.setViewState("isRenaming", appContext.viewState.lastSelectedItem);
        break;
      }
      case " ": {
        if (appContext?.viewState.lastSelectedItem === undefined) return;

        if (appContext?.globalState.showPreview === false) {
          appContext?.setGlobalState("showPreview", true);
        } else {
          appContext?.setGlobalState("showPreview", false);
        }
        break;
      }
      case "Escape": {
        appContext?.setGlobalState("showPreview", false);
        appContext?.setViewState("isRenaming", undefined);
        appContext?.setViewState("selectedItems", []);
        appContext?.setGlobalState("disableShortcuts", false);
        break;
      }
      case "Enter": {
        if (appContext?.viewState.lastSelectedItem) {
          const item = appContext.viewState.viewItems.find((i) => i.path === appContext.viewState.lastSelectedItem);

          if (!item) return;

          if (item.type === "file") {
            filesystemInterface.openInDefaultApplication(item.path as UniformResourceLocator);
            return;
          }

          setSearchParams({ path: item.path });
        }
        deselectAllItems(appContext!);
        break;
      }
      case "ArrowLeft": {
        if (e.altKey) {
          window.history.back();
          return;
        }

        selectPreviousItem(appContext!);
        break;
      }
      case "ArrowRight": {
        if (e.altKey) {
          window.history.forward();
          return;
        }

        selectNextItem(appContext!);
        break;
      }
      case "ArrowUp": {
        selectPreviousItem(appContext!);
        break;
      }
      case "ArrowDown": {
        selectNextItem(appContext!);
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
  });

  onCleanup(() => {
    window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <Suspense>
      {errorMessage() ? (
        <ViewMessage icon={ERROR_ICON} title={"An error has occurred"} message={errorMessage() || "Missing Error Message?"}></ViewMessage>
      ) : appContext?.viewState.viewItems.length === 0 && !appContext.viewState.isLoading ? (
        <ViewMessage
          icon={FOLDER_LIMITED_ICON}
          title={"Nothing Here."}
          message="You have no files"
          actions={[
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
                const resolvedPath = filesystemInterface.urlToPath(searchParams.path || "remote:/");

                if (resolvedPath.type === "invalid")
                  throw "Error resolving searchParams path";

                const joinedPath = path.join(resolvedPath.path, "Untitled Folder");

               await filesystemInterface.createDirectory(`${resolvedPath.type}:${joinedPath}`);
               setForceViewItemUpdate(pv => pv + 1)
              },
            },
          ]}
        />
      ) : (
        <>
          {/** biome-ignore lint/a11y/noStaticElementInteractions: button functionality not required */}
          <div
            class={styles.root}
            onMouseDown={(downEvent) => {
              if (appContext?.userPreferences.viewType === "gallery") return;

              const target = downEvent.target as HTMLElement;
              const itemPath = target.closest("[data-fs-item-path]")?.getAttribute("data-fs-item-path");
              const currentSelected = appContext?.viewState.selectedItems || [];

              if (itemPath) {
                const isSelected = currentSelected.includes(itemPath);
                const newSelection = isSelected ? currentSelected.filter((path) => path !== itemPath) : [...currentSelected, itemPath];

                appContext?.setViewState("selectedItems", newSelection);
              } else {
                deselectAllItems(appContext!);
              }

              const originX = downEvent.clientX;
              const originY = downEvent.clientY;

              document.body.style.userSelect = "none";
              setDragSelectRegion("origin", { x: originX, y: originY });

              const currentTarget = downEvent.currentTarget as HTMLDivElement;
              const bounds = currentTarget.getBoundingClientRect();
              const selectableItems = Array.from(currentTarget.querySelectorAll("[data-fs-item-path]"));

              function mouseMove(e: MouseEvent) {
                const mouseX = Math.min(Math.max(e.clientX, bounds.left), bounds.right);
                const mouseY = Math.min(Math.max(e.clientY, bounds.top), bounds.bottom);

                const left = Math.min(originX, mouseX);
                const top = Math.min(originY, mouseY);
                const width = Math.abs(mouseX - originX);
                const height = Math.abs(mouseY - originY);

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

                appContext?.setViewState("selectedItems", newlySelected);
              }

              function mouseUp() {
                document.body.style.userSelect = "unset";
                setDragSelectRegion("origin", undefined);
                setDragSelectRegion("size", undefined);
                setDragSelectRegion("transOrigin", undefined);
                document.removeEventListener("mouseup", mouseUp);
                document.removeEventListener("mousemove", mouseMove);
              }

              document.addEventListener("mouseup", mouseUp);
              document.addEventListener("mousemove", mouseMove);
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
    </Suspense>
  );
};

export default View;
