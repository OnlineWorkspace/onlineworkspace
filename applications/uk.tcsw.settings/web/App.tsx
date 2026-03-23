import { Route } from "@solidjs/router";
import { type Component, createEffect, createSignal, ErrorBoundary } from "solid-js";
import { AppContext } from "./appContext.ts";
import Layout from "./Layout";
import trpc from "./lib/trpc.ts";
import ApplicationPage from "./pages/applications/applicationId/Index.tsx";
import ApplicationsPage from "./pages/applications/Index.tsx";
import AuthenticationPage from "./pages/authentication/Index";
import ColorThemePage from "./pages/customization/colorTheme/Index.tsx";
import CustomizationPage from "./pages/customization/Index";
import QuickShortcutsPage from "./pages/customization/quickShortcuts/Index.tsx";
import WallpaperPage from "./pages/customization/wallpaper/Index.tsx";
import InstancePage from "./pages/instance/Index";
import ProfilePage from "./pages/profile/Index";
import RootPage from "./pages/root";
import StoragePage from "./pages/storage/Index";

const App: Component = () => {
  const [isAdministrator, setIsAdministrator] = createSignal<boolean>(false);
  const [shootYourselfInTheFoot, setShootYourselfInTheFoot] = createSignal<boolean>(false);

  createEffect(async () => {
    setIsAdministrator(await trpc.instance.isUserAdministrator.query());
    setShootYourselfInTheFoot(await trpc.instance.hasFeature.query("shoot_yourself_in_the_foot"));
  });

  return (
    <AppContext.Provider
      value={{
        isAdministrator: isAdministrator,
        shootYourselfInTheFoot: shootYourselfInTheFoot,
        setShootYourselfInTheFoot: setShootYourselfInTheFoot,
      }}
    >
      <Route component={Layout}>
        <Route path={"/"} component={RootPage} />
        <Route path={"/profile"} component={ProfilePage} />
        <Route path={"/authentication"}>
          <Route path={"/"} component={AuthenticationPage} />
        </Route>
        <Route path={"/storage"} component={StoragePage} />
        <Route path={"/customization"}>
          <Route path={"/"} component={CustomizationPage} />
          <Route path={"/wallpaper"} component={WallpaperPage} />
          <Route path={"/color-theme"} component={ColorThemePage} />
          <Route path={"/quick-shortcuts"} component={QuickShortcutsPage} />
        </Route>
        <Route path={"/instance"} component={InstancePage} />
        <Route path={"/applications"}>
          <Route path={"/"} component={ApplicationsPage} />
          <ErrorBoundary fallback={() => <div>Failed</div>}>
            <Route path={":applicationId"} component={ApplicationPage} />
          </ErrorBoundary>
        </Route>
      </Route>
    </AppContext.Provider>
  );
};

export default App;
