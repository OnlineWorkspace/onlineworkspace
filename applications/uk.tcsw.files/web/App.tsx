import { type Component } from "solid-js";
import RootPage from "./pages/root";
import { Route } from "@solidjs/router";
import Layout from "./Layout.tsx";
import Redirect from "./components/Redirect.tsx";

const App: Component = () => {
    return (
        <>
            <Route path={"/"} component={Redirect} />
            <Route component={Layout}>
                <Route path={"/dir"} component={RootPage} />
                <Route path={"/dir/*currentPath"} component={RootPage} />
            </Route>
        </>
    );
};

export default App;
