import { useSearchParams } from "@solidjs/router";
import { type Component, createEffect, Match, Switch, useContext } from "solid-js";
import { AppContext } from "../../appContext.ts";
import GridView from "./components/GridView/GridView.tsx";

const View: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<{ path?: string }>();
  const appContext = useContext(AppContext);

  createEffect(() => {
    if (!searchParams.path) {
      setSearchParams({ path: appContext?.userPreferences.homePath });
    }
  }, []);

  return (
    <Switch>
      <Match when={appContext?.userPreferences.viewType === "grid"}>
        <GridView />
      </Match>
      <Match when={appContext?.userPreferences.viewType === "details"}>Details View</Match>
      <Match when={appContext?.userPreferences.viewType === "gallery"}>Gallery View</Match>
    </Switch>
  );
};

export default View;
