import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const Layout = lazy(() => import("./Layout"));
const HomePage = lazy(() => import("./pages/home/Index"));
const BrowsePage = lazy(() => import("./pages/browse/Index"));
const RecentPage = lazy(() => import("./pages/recent/Index"));
const StarredPage = lazy(() => import("./pages/starred/Index"));
const GroupPage = lazy(() => import("./pages/group/Index"));
const TrashPage = lazy(() => import("./pages/trash/Index"));

const App: Component = () => {
  return (
    <Route component={Layout}>
      <Route path="/" component={HomePage} />
      <Route path="/browse/*path" component={BrowsePage} />
      <Route path="/recent" component={RecentPage} />
      <Route path="/starred" component={StarredPage} />
      <Route path="/group/:group" component={GroupPage} />
      <Route path="/trash" component={TrashPage} />
    </Route>
  );
};

export default App;
