import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import FOLDER_LIMITED_ICON from "@material-symbols/svg-700/outlined/folder_limited.svg";
import {useSearchParams} from "@solidjs/router";
import {type Component, createEffect, createSignal, Match, Switch, useContext} from "solid-js";
import {createStore} from "solid-js/store";
import type {Task} from "../../App.tsx";
import {AppContext} from "../../appContext.ts";
import ViewMessage from "../../layout/components/ViewMessage/ViewMessage.tsx";
import chunkArray from "../../lib/chunk.ts";
import filesystemInterface, {type UniformResourceLocator} from "../../lib/filesystemInterface.ts";
import DetailsView from "./components/DetailsView/DetailsView.tsx";
import GridView from "./components/GridView/GridView.tsx";
import styles from "./View.module.scss";
import GalleryView from "./components/GalleryView/GalleryView.tsx";

const View: Component = () => {
  const [ searchParams, setSearchParams ] = useSearchParams<{path?: UniformResourceLocator}>();
  const appContext = useContext(AppContext);
  const [ dragSelectRegion, setDragSelectRegion ] = createStore<{
    origin?: {x: number; y: number};
    size?: {x: number; y: number};
    transOrigin?: {x: number; y: number};
  }>({
    origin: undefined,
    size: undefined,
  });
  const [ lastClickTime, setLastClickTime ] = createSignal<number>(-1);
  const [ errorMessage, setErrorMessage ] = createSignal<string | undefined>(undefined);
  let navigationCounter = 0;

  createEffect(async () => {
    if (!searchParams.path) {
      setSearchParams({path: appContext?.userPreferences.homePath});
      return;
    }

    appContext?.userPreferences.viewType;
    appContext?.userPreferences.zoomPercentage;
    navigationCounter++
    const currentNavigationCount = navigationCounter;

    appContext?.setViewState("isLoading", true)
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
      };

      appContext?.setTasks((tasks) => [ ...tasks, task ]);

      const CHUNK_SIZE = filesystemInterface.getViewEntryBatchSize(searchParams.path);

      for (const itemPathGroup of chunkArray(newItems.items, CHUNK_SIZE)) {
        if (currentNavigationCount !== navigationCounter) {
          appContext?.setTasks((tasks) => {
            return tasks.map((t) => {
              if (task.id === t.id) {
                return task;
              }

              return t;
            });
          })

          return;
        };
        await new Promise<void>(async (resolve) => {
          const itemGroupResponsePromises = [];
          for (const itemPath of itemPathGroup) {
            itemGroupResponsePromises.push(
              filesystemInterface
                .getViewEntry(
                  itemPath as UniformResourceLocator,
                  Math.floor(appContext!.userPreferences.zoomPercentage * (appContext!.userPreferences.viewType === "details"
                    ? 32
                    : 128)),
                )
                .then((viewEntry) => {
                  if (viewEntry.status === "ok") {
                    return viewEntry;
                  }
                }),
            );
          }

          const itemGroupResponseResolvedPromises = await Promise.all(itemGroupResponsePromises)
          if (currentNavigationCount !== navigationCounter) {
            appContext?.setTasks((tasks) => {
              return tasks.map((t) => {
                if (task.id === t.id) {
                  return task;
                }

                return t;
              });
            })

            resolve();
            return;
          }
          appContext?.setViewState("viewItems", [
            ...appContext.viewState.viewItems,
            ...(itemGroupResponseResolvedPromises).map((ig) => ig?.data || undefined).filter((ig) => ig !== undefined),
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

      appContext?.setViewState("isLoading", false)
    } else {
      setErrorMessage(newItems.status);
    }
  });

  return (
    <>
      {errorMessage() ? (
        <ViewMessage icon={ERROR_ICON} title={"An error has occurred"} message={errorMessage() || "Missing Error Message?"}></ViewMessage>
      ) : appContext?.viewState.viewItems.length === 0 && !appContext.viewState.isLoading ? (
        <ViewMessage icon={FOLDER_LIMITED_ICON} title={"Nothing Here."} message="You have no files" actions={[
          {
            color: "filled",
            label: "Create new File",
            onClick() {
              // TODO: create a new file
              // Do nothing Currently
            }
          },
          {
            color: "filled",
            label: "Create new Folder",
            onClick() {
              // TODO: create a new folder
              // Do nothing Currently
            }
          }
        ]} />
      ) : (
        <>
          {/** biome-ignore lint/a11y/noStaticElementInteractions: button functionality not required */}
          <div
            class={styles.root}
            onMouseDown={(downEvent) => {
              if (appContext?.userPreferences.viewType === "gallery") return;

              if (lastClickTime() > Date.now() - 250) {
                setLastClickTime(-1);

                if (appContext?.viewState.selectedItems.length === 0) {
                  appContext!.setViewState(
                    "selectedItems",
                    appContext.viewState.viewItems.map((i) => i.path),
                  );
                } else {
                  appContext!.setViewState("selectedItems", []);
                }
              }

              setLastClickTime(Date.now());
              document.body.style.userSelect = "none";
              setDragSelectRegion("origin", {x: downEvent.clientX, y: downEvent.clientY});
              setDragSelectRegion("transOrigin", {x: downEvent.clientX, y: downEvent.clientY});

              const currentTarget = downEvent.currentTarget as HTMLDivElement;
              const currentTargetBounds = currentTarget.getBoundingClientRect();
              const selectableItems = currentTarget.querySelectorAll("[data-fs-item-path]");

              function mouseUp() {
                document.body.style.userSelect = "unset";

                setDragSelectRegion("origin", undefined);
                setDragSelectRegion("size", undefined);
                setDragSelectRegion("transOrigin", undefined);

                document.removeEventListener("mouseup", mouseUp);
                document.removeEventListener("mousemove", mouseMove);
              }

              let itemInRegionCalculationTimeout: NodeJS.Timeout | undefined;

              function itemInRegionCalculation() {
                appContext?.setViewState("selectedItems", []);

                for (const item of selectableItems) {
                  const boundingRect = item.getBoundingClientRect();

                  const tl1 = {x: dragSelectRegion.transOrigin?.x || 0, y: dragSelectRegion.transOrigin?.y || 0};
                  const br1 = {x: tl1.x + (dragSelectRegion.size?.x || 0), y: tl1.y + (dragSelectRegion.size?.y || 0)};

                  const tl2 = {x: boundingRect.left, y: boundingRect.top};
                  const br2 = {x: boundingRect.right, y: boundingRect.bottom};

                  if (tl1.x > br2.x || tl2.x > br1.x) continue;

                  if (tl1.y > br2.y || tl2.y > br1.y) continue;

                  const itemPath = item.getAttribute("data-fs-item-path");
                  if (!itemPath) return;
                  if (!appContext?.viewState.selectedItems.includes(itemPath)) {
                    appContext?.setViewState("selectedItems", [ ...appContext.viewState.selectedItems, itemPath ]);
                  }
                }
              }

              function mouseMove(e: MouseEvent) {
                if (!dragSelectRegion.origin) return;
                if (!dragSelectRegion.transOrigin) return;

                const mouseX = Math.min(Math.max(e.clientX, currentTargetBounds.left), currentTargetBounds.right);
                const mouseY = Math.min(Math.max(e.clientY, currentTargetBounds.top), currentTargetBounds.bottom);

                let sizeX = 0;
                let sizeY = 0;

                sizeX = mouseX - dragSelectRegion.origin.x;
                sizeY = mouseY - dragSelectRegion.origin.y;

                if (mouseX < dragSelectRegion.origin.x) {
                  setDragSelectRegion("transOrigin", {x: mouseX, y: dragSelectRegion.transOrigin.y});
                  sizeX = dragSelectRegion.origin.x - mouseX;
                }

                if (mouseY < dragSelectRegion.origin.y) {
                  setDragSelectRegion("transOrigin", {x: dragSelectRegion.transOrigin.x, y: mouseY});
                  sizeY = dragSelectRegion.origin.y - mouseY;
                }

                setDragSelectRegion("size", {
                  x: sizeX,
                  y: sizeY,
                });

                if (itemInRegionCalculationTimeout) clearTimeout(itemInRegionCalculationTimeout);

                itemInRegionCalculationTimeout = setTimeout(() => {
                  itemInRegionCalculation();
                }, 2);
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
    </>
  );
};

export default View;
