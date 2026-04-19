import { type Component, Match, Switch, useContext } from "solid-js";
import { AppContext } from "../../appContext.ts";
import GridView from "./components/GridView/GridView.tsx";

const View: Component = () => {
  const appContext = useContext(AppContext);

  return (
    <Switch>
      <Match when={appContext?.userPreferences.viewType === "grid"}>
        <GridView items={appContext?.viewState.viewItems || []} />
      </Match>
      <Match when={appContext?.userPreferences.viewType === "details"}>Details View</Match>
      <Match when={appContext?.userPreferences.viewType === "gallery"}>Gallery View</Match>
    </Switch>
  );
};

export default View;
