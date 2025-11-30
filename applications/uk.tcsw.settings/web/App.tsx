import { type Component } from "solid-js";
import RootPage from "./pages/root";
import { Route } from "@solidjs/router";
import Layout from "./Layout";
import ProfilePage from "./pages/profile/Index";
import AuthenticationPage from "./pages/authentication/Index";
import StoragePage from "./pages/storage/Index";
import CustomizationPage from "./pages/customization/Index";
import InstancePage from "./pages/instance/Index";

const App: Component = () => {
    return (
        <>
            <Route component={Layout}>
                <Route path={"/"} component={RootPage} />
                <Route path={"/profile"} component={ProfilePage} />
                <Route path={"/authentication"} component={AuthenticationPage} />
                <Route path={"/storage"} component={StoragePage} />
                <Route path={"/customization"} component={CustomizationPage} />
                <Route path={"/instance"} component={InstancePage} />
            </Route>
        </>
    );
};

export default App;
