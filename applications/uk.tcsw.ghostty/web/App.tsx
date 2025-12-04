import { type Component } from "solid-js";
import RootPage from "./pages/root";
import {Route} from "@solidjs/router";

const App: Component = () => {
    return (
        <>
            <Route path={"/"} component={RootPage} />
        </>
    );
};

export default App;
