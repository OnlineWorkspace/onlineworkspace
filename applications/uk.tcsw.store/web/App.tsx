import { type Component } from "solid-js";
import { Route } from "@solidjs/router";
import SearchPage from "./pages/search/Index";
import CategoriesPage from "./pages/categories/Index";
import ManageInstalledPage from "./pages/manage-installed/Index";
import Layout from "./Layout";
import ApplicationPage from "./pages/app/Index";

const App: Component = () => {
  return (
    <Route component={Layout}>
      {/*<Route path="/" component={RootPage} />*/}
      <Route path="/" component={SearchPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/manage-installed" component={ManageInstalledPage} />
      <Route
        path="/app/:repository/:applicationId"
        component={ApplicationPage}
      />
    </Route>
  );
};

export default App;
