import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const SearchPage = lazy(() => import("./pages/search/Index"));
const CategoriesPage = lazy(() => import("./pages/categories/Index"));
const ManageInstalledPage = lazy(() => import("./pages/manage-installed/Index"));
const Layout = lazy(() => import("./Layout"));
const ApplicationPage = lazy(() => import("./pages/app/Index"));

const App: Component = () => {
  return (
    <Route component={Layout}>
      {/*<Route path="/" component={RootPage} />*/}
      <Route path="/" component={SearchPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/manage-installed" component={ManageInstalledPage} />
      <Route path="/app/:repository/:applicationId" component={ApplicationPage} />
    </Route>
  );
};

export default App;
