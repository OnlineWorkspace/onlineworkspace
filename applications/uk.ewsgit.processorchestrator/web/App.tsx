import { Route } from "@solidjs/router";
import { type Component, lazy } from "solid-js";

const Layout = lazy(() => import("./Layout"));
const ListPage = lazy(() => import("./pages/list/Index"));
const DetailPage = lazy(() => import("./pages/detail/Index"));
const ActivityPage = lazy(() => import("./pages/activity/Index"));

const App: Component = () => {
  return (
    <Route component={Layout}>
      <Route path="/" component={ListPage} />
      <Route path="/p/:id" component={DetailPage} />
      <Route path="/activity" component={ActivityPage} />
    </Route>
  );
};

export default App;
