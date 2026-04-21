import { useSearchParams } from "@solidjs/router";
import { type Component, createEffect, Match, Switch, useContext } from "solid-js";
import { AppContext } from "../../appContext.ts";
import DetailsView from "./components/DetailsView/DetailsView.tsx";
import GridView from "./components/GridView/GridView.tsx";
import styles from "./View.module.scss";
import { createStore } from "solid-js/store";

const View: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<{ path?: string }>();
  const appContext = useContext(AppContext);
  const [dragSelectRegion, setDragSelectRegion] = createStore<{
    origin?: { x: number; y: number };
    size?: { x: number; y: number };
    renderOrigin?: { x: number; y: number };
  }>({
    origin: undefined,
    size: undefined,
  });

  createEffect(() => {
    if (!searchParams.path) {
      setSearchParams({ path: appContext?.userPreferences.homePath });
    }
  }, []);

  return (
    /** biome-ignore lint/a11y/noStaticElementInteractions: button functionality not required */
    /** biome-ignore lint/a11y/useKeyWithClickEvents: button functionality not required */
    <div
      class={styles.root}
      onClick={(e) => {
        if (e.currentTarget === e.target) appContext!.setViewState("selectedItems", []);
      }}
      onMouseDown={(e) => {
        document.body.style.userSelect = "none";
        setDragSelectRegion("origin", { x: e.clientX, y: e.clientY });
        setDragSelectRegion("renderOrigin", { x: e.clientX, y: e.clientY });

        function mouseUp() {
          document.body.style.userSelect = "unset";

          setDragSelectRegion("origin", undefined);
          setDragSelectRegion("size", undefined);
          setDragSelectRegion("renderOrigin", undefined);

          document.removeEventListener("mouseup", mouseUp);
          document.removeEventListener("mousemove", mouseMove);
        }

        function mouseMove(e: MouseEvent) {
          if (!dragSelectRegion.origin) return;
          if (!dragSelectRegion.renderOrigin) return;

          if (e.clientX < dragSelectRegion.origin.x) {
            setDragSelectRegion("renderOrigin", { x: e.clientX, y: dragSelectRegion.renderOrigin.y });
            setDragSelectRegion("origin", {
              x: e.clientX,
              y: dragSelectRegion.origin.y,
            });
          }

          if (e.clientY < dragSelectRegion.origin.y) {
            setDragSelectRegion("renderOrigin", { x: dragSelectRegion.renderOrigin.x, y: e.clientY });
            setDragSelectRegion("origin", {
              x: dragSelectRegion.origin.x,
              y: e.clientY,
            });
          }

          setDragSelectRegion("size", {
            x: e.clientX - dragSelectRegion.renderOrigin!.x,
            y: e.clientY - dragSelectRegion.renderOrigin!.y,
          });
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
        <Match when={appContext?.userPreferences.viewType === "gallery"}>Gallery View</Match>
      </Switch>
      {dragSelectRegion.renderOrigin !== undefined ? (
        <div
          class={styles.dragSelectRegion}
          style={{
            left: `${dragSelectRegion.renderOrigin!.x}px`,
            top: `${dragSelectRegion.renderOrigin!.y}px`,
            width: `${dragSelectRegion.size?.x}px`,
            height: `${dragSelectRegion.size?.y}px`,
          }}
        />
      ) : null}
    </div>
  );
};

export default View;
