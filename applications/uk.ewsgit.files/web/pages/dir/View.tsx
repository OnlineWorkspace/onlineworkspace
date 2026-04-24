import {useSearchParams} from "@solidjs/router";
import {type Component, createEffect, Match, Switch, useContext} from "solid-js";
import {createStore} from "solid-js/store";
import {AppContext} from "../../appContext.ts";
import trpc from "../../lib/trpc.ts";
import DetailsView from "./components/DetailsView/DetailsView.tsx";
import GridView from "./components/GridView/GridView.tsx";
import styles from "./View.module.scss";
import filesystemInterface, {type UniformResourceLocator} from "../../lib/filesystemInterface.ts";

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

  createEffect(async () => {
    if (!searchParams.path) {
      setSearchParams({path: appContext?.userPreferences.homePath});
      return;
    }

    const newItems = await filesystemInterface.readDirectory(searchParams.path || "remote:/")

    console.log({path: searchParams.path, newItems})

    if (newItems.status === "ok") {
      appContext?.setViewState("selectedItems", []);
      appContext?.setViewState("lastSelectionTime", -1);
      appContext?.setViewState("viewItems", []);

      for (const itemPath of newItems.items) {
        filesystemInterface.getViewEntry(itemPath, appContext!.userPreferences.viewType === "details" ? "details" : "grid").then((viewEntry) => {
          if (viewEntry.status === "ok") {
            appContext?.setViewState("viewItems", [ ...appContext.viewState.viewItems, viewEntry.data ]);
          }
        })
      }

    }
  });

  return (
    /** biome-ignore lint/a11y/noStaticElementInteractions: button functionality not required */
    <div
      class={styles.root}
      onDblClick={(e) => {
        if (e.currentTarget === e.target) appContext!.setViewState("selectedItems", []);
      }}
    // onMouseDown={(downEvent) => {
    //   document.body.style.userSelect = "none";
    //   setDragSelectRegion("origin", {x: downEvent.clientX, y: downEvent.clientY});
    //   setDragSelectRegion("transOrigin", {x: downEvent.clientX, y: downEvent.clientY});

    //   const currentTarget = downEvent.currentTarget as HTMLDivElement;
    //   const currentTargetBounds = currentTarget.getBoundingClientRect();
    //   const selectableItems = currentTarget.querySelectorAll("[data-fs-item-path]");

    //   function mouseUp() {
    //     document.body.style.userSelect = "unset";

    //     setDragSelectRegion("origin", undefined);
    //     setDragSelectRegion("size", undefined);
    //     setDragSelectRegion("transOrigin", undefined);

    //     document.removeEventListener("mouseup", mouseUp);
    //     document.removeEventListener("mousemove", mouseMove);
    //   }

    //   let itemInRegionCalculationTimeout: NodeJS.Timeout | undefined;

    //   function itemInRegionCalculation() {
    //     appContext?.setViewState("selectedItems", []);

    //     for (const item of selectableItems) {
    //       const boundingRect = item.getBoundingClientRect();

    //       const tl1 = {x: dragSelectRegion.transOrigin?.x || 0, y: dragSelectRegion.transOrigin?.y || 0};
    //       const br1 = {x: tl1.x + (dragSelectRegion.size?.x || 0), y: tl1.y + (dragSelectRegion.size?.y || 0)};

    //       const tl2 = {x: boundingRect.left, y: boundingRect.top};
    //       const br2 = {x: boundingRect.right, y: boundingRect.bottom};

    //       if (tl1.x > br2.x || tl2.x > br1.x) continue;

    //       if (tl1.y > br2.y || tl2.y > br1.y) continue;

    //       const itemPath = item.getAttribute("data-fs-item-path");
    //       if (!itemPath) return;
    //       if (!appContext?.viewState.selectedItems.includes(itemPath)) {
    //         appContext?.setViewState("selectedItems", [ ...appContext.viewState.selectedItems, itemPath ]);
    //       }
    //     }
    //   }

    //   function mouseMove(e: MouseEvent) {
    //     if (!dragSelectRegion.origin) return;
    //     if (!dragSelectRegion.transOrigin) return;

    //     const mouseX = Math.min(Math.max(e.clientX, currentTargetBounds.left), currentTargetBounds.right);
    //     const mouseY = Math.min(Math.max(e.clientY, currentTargetBounds.top), currentTargetBounds.bottom);

    //     let sizeX = 0;
    //     let sizeY = 0;

    //     sizeX = mouseX - dragSelectRegion.origin.x;
    //     sizeY = mouseY - dragSelectRegion.origin.y;

    //     if (mouseX < dragSelectRegion.origin.x) {
    //       setDragSelectRegion("transOrigin", {x: mouseX, y: dragSelectRegion.transOrigin.y});
    //       sizeX = dragSelectRegion.origin.x - mouseX;
    //     }

    //     if (mouseY < dragSelectRegion.origin.y) {
    //       setDragSelectRegion("transOrigin", {x: dragSelectRegion.transOrigin.x, y: mouseY});
    //       sizeY = dragSelectRegion.origin.y - mouseY;
    //     }

    //     setDragSelectRegion("size", {
    //       x: sizeX,
    //       y: sizeY,
    //     });

    //     if (itemInRegionCalculationTimeout) clearTimeout(itemInRegionCalculationTimeout);

    //     itemInRegionCalculationTimeout = setTimeout(() => {
    //       itemInRegionCalculation();
    //     }, 2);
    //   }

    //   document.addEventListener("mouseup", mouseUp);
    //   document.addEventListener("mousemove", mouseMove);
    // }}
    >
      <Switch>
        <Match when={appContext?.userPreferences.viewType === "grid"}>
          <GridView />
        </Match>
        <Match when={appContext?.userPreferences.viewType === "details"}>
          <DetailsView />
        </Match>
        <Match when={appContext?.userPreferences.viewType === "gallery"}>Gallery View</Match>
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
  );
};

export default View;
