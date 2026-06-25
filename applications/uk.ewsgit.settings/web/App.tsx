import { Route } from "@solidjs/router";
import { type Component, ErrorBoundary, lazy } from "solid-js";

const Layout = lazy(() => import("./Layout"));
const ApplicationPage = lazy(() => import("./pages/applications/applicationId/Index.tsx"));
const ApplicationsPage = lazy(() => import("./pages/applications/Index.tsx"));
const AuthenticationPage = lazy(() => import("./pages/authentication/Index"));
const ColorThemePage = lazy(() => import("./pages/customization/colorTheme/Index.tsx"));
const CustomizationPage = lazy(() => import("./pages/customization/Index"));
const QuickShortcutsPage = lazy(() => import("./pages/customization/quickShortcuts/Index.tsx"));
const WallpaperPage = lazy(() => import("./pages/customization/wallpaper/Index.tsx"));
const ProfilePage = lazy(() => import("./pages/profile/Index"));
const RootPage = lazy(() => import("./pages/root"));
const StoragePage = lazy(() => import("./pages/storage/Index"));
const ManageInstanceFeaturesPage = lazy(() => import("./pages/instance/features/index.tsx"));
const ManageInstanceInstalledApplicationsPage = lazy(() => import("./pages/instance/installed_applications/index.tsx"));
const ManageInstanceMailServerPage = lazy(() => import("./pages/instance/mailserver/index.tsx"));
const ManageInstanceUsersPage = lazy(() => import("./pages/instance/users/index.tsx"));
const ManageInstanceBrandingPage = lazy(() => import("./pages/instance/branding/index.tsx"));

const App: Component = () => {
  return (
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
      <Route path={"/instance"}>
        <Route path={"/branding"} component={ManageInstanceBrandingPage}/>
        <Route path={"/features"} component={ManageInstanceFeaturesPage}/>
        <Route path={"/installed_applications"} component={ManageInstanceInstalledApplicationsPage}/>
        <Route path={"/mailserver"} component={ManageInstanceMailServerPage}/>
        <Route path={"/users"} component={ManageInstanceUsersPage}/>
      </Route>
      <Route path={"/applications"}>
        <Route path={"/"} component={ApplicationsPage} />
        <ErrorBoundary fallback={() => <div>Failed</div>}>
          <Route path={":applicationId"} component={ApplicationPage} />
        </ErrorBoundary>
      </Route>
    </Route>
  );
};

export default App;
