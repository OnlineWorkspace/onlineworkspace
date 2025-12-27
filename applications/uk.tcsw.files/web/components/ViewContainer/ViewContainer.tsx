import { Match, Switch, useContext, type Component } from "solid-js";
import GridView from "./Grid/Grid";
import { ViewContext } from "./ViewContext";
import ListView from "./List/List";

const ViewContainer: Component = () => {
    const viewCtx = useContext(ViewContext);

    return (
        <Switch fallback={<>You have no view type selected?</>}>
            <Match when={viewCtx?.viewType() === "grid"}>
                <GridView />
            </Match>
            <Match when={viewCtx?.viewType() === "list"}>
                <ListView />
            </Match>
        </Switch>
    );
};

export default ViewContainer;
