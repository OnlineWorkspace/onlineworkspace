import { type Component } from "solid-js";
import RootPage from "./pages/root";
import { Route } from "@solidjs/router";
import Layout from "./Layout";
import ProfilePage from "./pages/profile/Index";
import AuthenticationPage from "./pages/authentication/Index";
import StoragePage from "./pages/storage/Index";
import CustomizationPage from "./pages/customization/Index";
import InstancePage from "./pages/instance/Index";
import ResetPasswordPage from "./pages/authentication/reset-password/Index";
import WallpaperPage from "./pages/customization/wallpaper/Index.tsx";
import ColorThemePage from "./pages/customization/colorTheme/Index.tsx";

const App: Component = () => {
    return (
        <>
            <Route component={Layout}>
                <Route path={"/"} component={RootPage} />
                <Route path={"/profile"} component={ProfilePage} />
                <Route path={"/authentication"}>
                    <Route path={"/"} component={AuthenticationPage} />
                    <Route path={"/reset-password"} component={ResetPasswordPage} />
                </Route>
                <Route path={"/storage"} component={StoragePage} />
                <Route path={"/customization"}>
                    <Route path={"/"} component={CustomizationPage} />
                    <Route path={"/wallpaper"} component={WallpaperPage} />
                    <Route path={"/color-theme"} component={ColorThemePage} />
                </Route>
                <Route path={"/instance"} component={InstancePage} />
            </Route>
        </>
    );
};

export default App;
