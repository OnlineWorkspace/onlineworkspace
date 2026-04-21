import { useSearchParams } from "@solidjs/router";
import { type Component, createEffect, createSignal, Match, Switch, useContext } from "solid-js";
import { AppContext } from "../../appContext.ts";
import DetailsView from "./components/DetailsView/DetailsView.tsx";
import GridView from "./components/GridView/GridView.tsx";
import styles from "./View.module.scss";

const View: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<{ path?: string }>();
  const appContext = useContext(AppContext);
  const [dragSelectRegion, setDragSelectRegion] = createSignal<{ x: number; y: number } | undefined>(undefined);

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
      {dragSelectRegion() !== undefined ? <div class={styles.dragSelectRegion} /> : null}
    </div>
  );
};

export default View;
